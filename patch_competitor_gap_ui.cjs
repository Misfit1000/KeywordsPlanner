const fs = require('fs');
let code = fs.readFileSync('src/components/CompetitorGap.tsx', 'utf8');

// Replace handleAnalyze body
code = code.replace(/const handleAnalyze = async \(e: React\.FormEvent\) => \{[\s\S]*?\};\s*return \(/, 
`const [auditId, setAuditId] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUrl.trim() || !comp1.trim()) return;
    
    let targetUrl = myUrl.trim().startsWith('http') ? myUrl.trim() : 'https://' + myUrl.trim();
    let c1Url = comp1.trim().startsWith('http') ? comp1.trim() : 'https://' + comp1.trim();
    let c2Url = comp2.trim() ? (comp2.trim().startsWith('http') ? comp2.trim() : 'https://' + comp2.trim()) : undefined;
    const competitorUrls = [c1Url];
    if (c2Url) competitorUrls.push(c2Url);
    
    setLoading(true);
    setError(null);
    setAuditId(null);
    setResults(null);
    
    try {
      const response = await fetch('/api/tools/competitor-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myUrl: targetUrl, competitorUrls, maxPages })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze competitor gap');
      
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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Competitor Keyword Gap</h1>
          <p className="text-muted-foreground">Extract and compare content keyword gaps from website copy locally.</p>
        </div>
        <LiveAuditProgress 
          auditId={auditId} 
          type="seo" // competitor-gap is a subset of seo
          onComplete={async () => {
             try {
                const res = await fetch(\`/api/tools/audit/result/\${auditId}\`);
                const data = await res.json();
                if (data.success) {
                   setResults({ gaps: data.data.gaps, crawledCounts: data.data.crawledCounts });
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

fs.writeFileSync('src/components/CompetitorGap.tsx', code);
