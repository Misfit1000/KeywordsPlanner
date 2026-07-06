const fs = require('fs');
let code = fs.readFileSync('src/components/WebsiteAnalyzer.tsx', 'utf8');

code = code.replace(/const handleAnalyze = async \(e: React\.FormEvent\) => \{[\s\S]*?\};\s*return \(/, 
`const [auditId, setAuditId] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }

    setLoading(true);
    setError(null);
    setAuditId(null);
    setResult(null);

    try {
      const response = await fetch('/api/tools/website/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, maxPages })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze website');
      
      setAuditId(data.data.auditId);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (auditId) {
    return (
       <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Website Analyzer</h1>
          <p className="text-muted-foreground">Extract keywords and run an on-page SEO audit on multiple pages locally.</p>
        </div>
        <LiveAuditProgress 
          auditId={auditId} 
          type="seo" 
          onComplete={async () => {
             try {
                const res = await fetch(\`/api/tools/audit/result/\${auditId}\`);
                const data = await res.json();
                if (data.success) {
                   setResult({
                     data: data.data.data,
                     audit: data.data.audit,
                     crawledPages: data.data.crawledPages,
                     fullAudit: data.data.fullAudit
                   });
                   setAuditId(null);
                }
             } catch(e) {}
          }} 
        />
       </div>
    );
  }

  return (`);

code = code.replace(/import React, \{ useState \} from 'react';/, `import React, { useState } from 'react';\nimport { LiveAuditProgress } from './audit/LiveAuditProgress';`);

fs.writeFileSync('src/components/WebsiteAnalyzer.tsx', code);
