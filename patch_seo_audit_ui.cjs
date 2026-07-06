const fs = require('fs');
let code = fs.readFileSync('src/components/SeoAudit.tsx', 'utf8');

// Strip out the interval logic
code = code.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[jobId, status\]\);\s*/, '');

// Update startAudit
code = code.replace(/const startAudit = async \(e: React\.FormEvent\) => \{[\s\S]*?setLoading\(true\);/, 
`const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setLoading(true);
    setAuditResult(null);
    setJobId(null);
    setError(null);
`);

code = code.replace(/try \{[\s\S]*?const response = await fetch\('\/api\/tools\/audit\/start'[\s\S]*?const data = await response\.json\(\);[\s\S]*?if \(!data\.success\) throw new Error\(data\.error \|\| 'Failed to start audit'\);[\s\S]*?setJobId\(data\.data\.auditId\);[\s\S]*?setStatus\('pending'\);[\s\S]*?\} catch \(err: any\) \{[\s\S]*?setError\(err\.message\);[\s\S]*?setLoading\(false\);[\s\S]*?\}/,
`try {
      const response = await fetch('/api/tools/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, maxPages, type: 'seo' })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to start audit');
      
      setJobId(data.data.auditId || data.data.jobId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }`);

// Replace the loading and interval display with LiveAuditProgress
code = code.replace(/\{loading && !auditResult && \([\s\S]*?This may take a minute depending on crawl limit\.<\/p>\s*<\/div>\s*\)\}/,
`{jobId && !auditResult && (
  <LiveAuditProgress 
    auditId={jobId} 
    type="seo" 
    onComplete={async () => {
      try {
        const res = await fetch(\`/api/tools/audit/result/\${jobId}\`);
        const data = await res.json();
        if (data.success) {
          setAuditResult(data.data);
          setJobId(null);
        }
      } catch(e) {}
    }} 
  />
)}`);

// Fix missing imports
if (!code.includes('LiveAuditProgress')) {
  code = `import { LiveAuditProgress } from './audit/LiveAuditProgress';\n` + code;
}

fs.writeFileSync('src/components/SeoAudit.tsx', code);
