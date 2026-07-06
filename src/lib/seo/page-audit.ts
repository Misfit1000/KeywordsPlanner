import { ParsedPageData } from './html-parser';
import { CrawlResult } from './crawler';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AuditIssue {
  id: string;
  category: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  affectedUrl?: string;
}

export interface AuditResult {
  score: number;
  categoryScores: Record<string, number>;
  counts: Record<IssueSeverity, number>;
  passedChecks: string[];
  issues: AuditIssue[];
}

export function auditPage(crawl: CrawlResult): AuditResult {
  const issues: AuditIssue[] = [];
  const passedChecks: string[] = [];
  
  if (!crawl.success || !crawl.data) {
    return {
      score: 0,
      categoryScores: {},
      counts: { critical: 1, high: 0, medium: 0, low: 0 },
      passedChecks: [],
      issues: [{
        id: 'fetch-failed',
        category: 'crawl',
        severity: 'critical',
        title: 'Page Fetch Failed',
        description: 'The crawler could not access the page.',
        evidence: crawl.error || `HTTP ${crawl.status}`,
        recommendation: 'Check URL spelling, server status, or firewall rules.',
        affectedUrl: crawl.url
      }]
    };
  }

  const { data, headers, status, loadTimeMs, pageSizeBytes, finalUrl } = crawl;
  const url = crawl.url;

  function addIssue(severity: IssueSeverity, category: string, id: string, title: string, description: string, evidence: string, recommendation: string) {
    issues.push({ id, category, severity, title, description, evidence, recommendation, affectedUrl: url });
  }

  // 1. Status Codes
  if (status >= 400) {
    addIssue('critical', 'crawl', 'status-error', 'Error Status Code', `Page returned HTTP ${status}.`, `HTTP ${status}`, 'Fix broken links or server errors.');
  } else {
    passedChecks.push('status-ok');
  }

  // 2. Redirects
  if (url !== finalUrl) {
    addIssue('low', 'crawl', 'redirect', 'Page Redirects', 'The URL redirects to another URL.', `From ${url} to ${finalUrl}`, 'Update internal links to point directly to the final URL to save crawl budget.');
  } else {
    passedChecks.push('no-redirect');
  }

  // 3. HTTPS
  if (!finalUrl.startsWith('https://')) {
    addIssue('high', 'security', 'no-https', 'Not Secure', 'Page is not using HTTPS.', finalUrl, 'Install an SSL certificate and redirect HTTP to HTTPS.');
  } else {
    passedChecks.push('https');
  }

  // 4. Title
  if (!data.title) {
    addIssue('high', 'content', 'missing-title', 'Missing Title', 'The page has no <title> tag.', 'No <title> found', 'Add a descriptive title tag.');
  } else {
    if (data.title.length < 30) {
      addIssue('medium', 'content', 'short-title', 'Short Title', 'Title is too short.', `Length: ${data.title.length} chars`, 'Expand title to 50-60 characters including primary keywords.');
    } else if (data.title.length > 65) {
      addIssue('medium', 'content', 'long-title', 'Long Title', 'Title is too long and may truncate in SERPs.', `Length: ${data.title.length} chars`, 'Keep title under 60 characters.');
    } else {
      passedChecks.push('title-length-ok');
    }
  }

  // 5. Meta Description
  if (!data.metaDescription) {
    addIssue('high', 'content', 'missing-meta-desc', 'Missing Meta Description', 'No meta description found.', 'Empty', 'Add a compelling meta description.');
  } else {
    if (data.metaDescription.length < 70) {
      addIssue('medium', 'content', 'short-meta-desc', 'Short Meta Description', 'Description is too short.', `Length: ${data.metaDescription.length} chars`, 'Expand to 150-160 characters.');
    } else if (data.metaDescription.length > 160) {
      addIssue('medium', 'content', 'long-meta-desc', 'Long Meta Description', 'Description is too long.', `Length: ${data.metaDescription.length} chars`, 'Trim to under 160 characters.');
    } else {
      passedChecks.push('meta-desc-length-ok');
    }
  }

  // 6. Headings
  if (data.h1.length === 0) {
    addIssue('high', 'content', 'missing-h1', 'Missing H1', 'No H1 tag found.', 'Empty', 'Add exactly one H1 tag describing the page topic.');
  } else if (data.h1.length > 1) {
    addIssue('medium', 'content', 'multiple-h1', 'Multiple H1s', 'More than one H1 tag found.', `Found ${data.h1.length}`, 'Use only one H1 tag per page for clearer hierarchy.');
  } else {
    passedChecks.push('h1-ok');
  }

  if (data.h2.length === 0 && data.h3.length > 0) {
    addIssue('low', 'content', 'skipped-heading-level', 'Skipped Heading Level', 'H3 tags found but no H2 tags.', 'H3 exists without H2', 'Use heading tags in sequential order (H1, H2, H3).');
  }

  // 7. Word Count
  if (data.wordCount < 300) {
    addIssue('high', 'content', 'thin-content', 'Thin Content', 'Page has very little text content.', `${data.wordCount} words`, 'Add more comprehensive content to satisfy user intent.');
  } else {
    passedChecks.push('word-count-ok');
  }

  // 8. Canonical
  if (!data.canonical) {
    addIssue('medium', 'indexability', 'missing-canonical', 'Missing Canonical', 'No canonical URL specified.', 'Empty', 'Add a self-referencing canonical tag.');
  } else if (data.canonical !== finalUrl && !data.canonical.endsWith(new URL(finalUrl).pathname)) {
    // Basic check, might be false positive if different protocol/www but let's keep it simple
    addIssue('low', 'indexability', 'canonical-mismatch', 'Canonical Mismatch', 'Canonical URL differs from the final URL.', `Canonical: ${data.canonical}`, 'Ensure the canonical points to the preferred version of the URL.');
  } else {
    passedChecks.push('canonical-ok');
  }

  // 9. Meta Robots
  if (data.metaRobots.toLowerCase().includes('noindex')) {
    addIssue('critical', 'indexability', 'noindex', 'Page is Noindex', 'Search engines are instructed not to index this page.', 'meta robots = noindex', 'Remove noindex directive if this page should be searchable.');
  } else {
    passedChecks.push('indexable');
  }

  // 10. Links
  if (data.internalLinks.length > 100) {
    addIssue('low', 'links', 'too-many-links', 'Too Many Internal Links', 'Over 100 internal links found.', `${data.internalLinks.length} links`, 'Reduce internal links to concentrate link equity.');
  }
  
  let genericLinks = 0;
  for (const link of data.internalLinks) {
    const text = link.text.toLowerCase();
    if (['click here', 'read more', 'learn more'].includes(text)) genericLinks++;
  }
  if (genericLinks > 0) {
    addIssue('low', 'links', 'generic-anchor-text', 'Generic Anchor Text', 'Found links with generic anchor text.', `${genericLinks} instances`, 'Use descriptive anchor text with keywords.');
  } else {
    passedChecks.push('anchor-text-ok');
  }

  let missingRelNoopener = 0;
  for (const link of data.externalLinks) {
    // In Cheerio, we don't have target="_blank" easily unless we modified html-parser.
    // Assuming external links without rel noopener might be a risk.
    if (!link.rel.includes('noopener') && !link.rel.includes('noreferrer')) {
       missingRelNoopener++;
    }
  }
  if (missingRelNoopener > 0) {
    addIssue('low', 'security', 'missing-noopener', 'Missing rel=noopener', 'External links missing security attributes.', `${missingRelNoopener} links`, 'Add rel="noopener noreferrer" to external links opening in new tabs.');
  }

  // 11. Images
  if (data.imagesWithoutAlt > 0) {
    addIssue('high', 'accessibility', 'missing-alt', 'Missing Image Alt Attributes', 'Images are missing alt text.', `${data.imagesWithoutAlt} images`, 'Add descriptive alt text to all images.');
  } else if (data.imageCount > 0) {
    passedChecks.push('images-alt-ok');
  }

  // 12. Open Graph & Twitter
  if (!data.ogTitle || !data.ogDescription || !data.ogImage) {
    addIssue('medium', 'social', 'missing-og', 'Missing Open Graph Tags', 'Page is missing Open Graph tags for social sharing.', 'Missing OG tags', 'Add og:title, og:description, and og:image.');
  } else {
    passedChecks.push('og-tags-ok');
  }
  
  if (!data.twitterCard) {
    addIssue('low', 'social', 'missing-twitter-card', 'Missing Twitter Card', 'No twitter:card meta tag found.', 'Empty', 'Add twitter:card meta tag.');
  }

  // 13. Schema / JSON-LD
  if (data.jsonLd.length === 0) {
    addIssue('low', 'content', 'missing-schema', 'Missing Structured Data', 'No JSON-LD structured data found.', 'Empty', 'Implement schema markup to enhance SERP presence.');
  } else {
    let invalidSchema = false;
    for (const schema of data.jsonLd) {
      try { JSON.parse(schema); } catch (e) { invalidSchema = true; }
    }
    if (invalidSchema) {
      addIssue('high', 'content', 'invalid-schema', 'Invalid JSON-LD', 'Structured data has syntax errors.', 'Parse error', 'Validate and fix JSON-LD syntax.');
    } else {
      passedChecks.push('schema-valid');
    }
  }

  // 14. Viewport & Lang
  if (!data.viewport) {
    addIssue('critical', 'mobile', 'missing-viewport', 'Missing Viewport', 'No viewport meta tag found.', 'Empty', 'Add meta viewport tag for mobile responsiveness.');
  } else {
    passedChecks.push('viewport-ok');
  }
  if (!data.lang) {
    addIssue('medium', 'accessibility', 'missing-lang', 'Missing Lang Attribute', 'HTML tag is missing lang attribute.', 'Empty', 'Add lang="en" (or appropriate language) to <html> tag.');
  } else {
    passedChecks.push('lang-ok');
  }

  // 15. Security Headers
  const missingHeaders = [];
  if (!headers['strict-transport-security']) missingHeaders.push('HSTS');
  if (!headers['content-security-policy']) missingHeaders.push('CSP');
  if (!headers['x-content-type-options']) missingHeaders.push('X-Content-Type-Options');
  
  if (missingHeaders.length > 0) {
    addIssue('low', 'security', 'missing-headers', 'Missing Security Headers', 'Some security headers are missing.', missingHeaders.join(', '), 'Configure server to send modern security headers.');
  }

  // 16. Performance
  if (loadTimeMs > 3000) {
    addIssue('medium', 'performance', 'slow-response', 'Slow Response Time', 'Page took longer than 3 seconds to load.', `${loadTimeMs}ms`, 'Optimize server response time and reduce page weight.');
  }
  if (pageSizeBytes > 2000000) { // 2MB
    addIssue('medium', 'performance', 'large-page', 'Large Page Size', 'HTML size is larger than 2MB.', `${(pageSizeBytes/1000000).toFixed(2)}MB`, 'Minify HTML and optimize assets.');
  }

  // Calculate score
  const weights = { critical: 20, high: 10, medium: 5, low: 1 };
  let deduction = 0;
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  
  for (const issue of issues) {
    deduction += weights[issue.severity];
    counts[issue.severity]++;
  }

  const score = Math.max(0, 100 - deduction);

  return {
    score,
    categoryScores: {},
    counts,
    passedChecks,
    issues
  };
}

export function auditFullCrawl(crawls: CrawlResult[]): { overallScore: number, allIssues: AuditIssue[], pageResults: { url: string, audit: AuditResult }[] } {
  let totalScore = 0;
  const allIssues: AuditIssue[] = [];
  const pageResults = [];

  for (const crawl of crawls) {
    const audit = auditPage(crawl);
    totalScore += audit.score;
    allIssues.push(...audit.issues);
    pageResults.push({ url: crawl.url, audit });
  }

  const overallScore = crawls.length > 0 ? Math.round(totalScore / crawls.length) : 0;
  return { overallScore, allIssues, pageResults };
}
