import { auditStore } from './audit-store';
import { crawlDomain } from '../seo/crawler';
import { runAllChecks } from '../seo/checks/runner';
import { AuditIssue } from './types';

export async function runAuditJob(jobId: string, maxPages = 10) {
  const job = auditStore.getJob(jobId);
  if (!job) return;

  try {
    auditStore.updateJob(jobId, { status: 'crawling' });
    
    // 1. Crawl
    const crawlResults = await crawlDomain(job.targetUrl, { maxPages });
    
    auditStore.updateJob(jobId, { status: 'analyzing', pagesCrawled: crawlResults.length });
    
    // 2. Analyze each page
    let allIssues: AuditIssue[] = [];
    let indexable = 0;
    let nonIndexable = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let passed = 0;
    
    const analyzedPages = crawlResults.map(page => {
      const flatPageData = { ...page, ...page.data };
      const pageIssues = runAllChecks(flatPageData);
      
      const isIndexable = flatPageData.status === 200 && !flatPageData.metaRobots?.includes('noindex');
      if (isIndexable) indexable++;
      else nonIndexable++;
      
      pageIssues.forEach(issue => {
        if (issue.severity === 'critical') critical++;
        else if (issue.severity === 'high') high++;
        else if (issue.severity === 'medium') medium++;
        else if (issue.severity === 'low') low++;
        else if (issue.severity === 'info') passed++;
      });
      
      allIssues.push(...pageIssues);
      
      return {
        url: flatPageData.url,
        title: flatPageData.title || '',
        status: flatPageData.status,
        wordCount: flatPageData.wordCount || 0,
        isIndexable,
        issues: pageIssues
      };
    });
    
    // Add domain-level checks (robots.txt and sitemap)
    try {
      const parsedUrl = new URL(job.targetUrl);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
      const sitemapUrl = `${parsedUrl.protocol}//${parsedUrl.host}/sitemap.xml`;
      
      try {
        const robRes = await fetch(robotsUrl, { method: 'HEAD', headers: { 'User-Agent': 'SEOIntel-Bot' }});
        if (!robRes.ok) {
           allIssues.push({ id: 'missing-robots', category: 'crawlability', severity: 'high', title: 'Missing robots.txt', description: 'Could not find a valid robots.txt file.', affectedUrl: robotsUrl });
           high++;
        }
      } catch(e) {
         allIssues.push({ id: 'missing-robots', category: 'crawlability', severity: 'high', title: 'Missing robots.txt', description: 'Could not find a valid robots.txt file.', affectedUrl: robotsUrl });
         high++;
      }
      
      try {
        const smRes = await fetch(sitemapUrl, { method: 'HEAD', headers: { 'User-Agent': 'SEOIntel-Bot' }});
        if (!smRes.ok) {
           allIssues.push({ id: 'missing-sitemap', category: 'crawlability', severity: 'medium', title: 'Missing sitemap.xml', description: 'Could not find a valid sitemap.xml file at the root.', affectedUrl: sitemapUrl });
           medium++;
        }
      } catch(e) {
         allIssues.push({ id: 'missing-sitemap', category: 'crawlability', severity: 'medium', title: 'Missing sitemap.xml', description: 'Could not find a valid sitemap.xml file at the root.', affectedUrl: sitemapUrl });
         medium++;
      }
    } catch(e) {}
    
    // 3. Scoring
    const totalIssues = critical * 10 + high * 5 + medium * 2 + low;
    const baseScore = 100 - (totalIssues / (analyzedPages.length || 1));
    const overallScore = Math.max(0, Math.min(100, Math.round(baseScore)));
    
    auditStore.updateJob(jobId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      overallScore,
      pagesIndexable: indexable,
      pagesNonIndexable: nonIndexable,
      criticalIssues: critical,
      highIssues: high,
      mediumIssues: medium,
      lowIssues: low,
      passedChecks: passed,
      allIssues,
      crawledPages: analyzedPages
    });
    
  } catch (error: any) {
    console.error('Audit Job failed', error);
    auditStore.updateJob(jobId, { 
      status: 'failed', 
      error: error.message || 'Unknown error occurred',
      completedAt: new Date().toISOString()
    });
  }
}
