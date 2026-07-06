const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityAudit.tsx', 'utf8');

if (!code.includes('LiveAuditProgress')) {
  code = code.replace(
    `import React, { useState } from 'react';`,
    `import React, { useState } from 'react';\nimport { LiveAuditProgress } from './audit/LiveAuditProgress';`
  );
  
  code = code.replace(
    `const [loading, setLoading] = useState(false);`,
    `const [loading, setLoading] = useState(false);\n  const [auditId, setAuditId] = useState<string | null>(null);`
  );
  
  code = code.replace(
    `const res = await fetch('/api/security-audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), options: {} })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setResult(data.data);`,
    `const res = await fetch('/api/tools/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type: 'security', options: {} })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      setAuditId(data.data.auditId);
      setLoading(false);
      return;`
  );

  code = code.replace(
    `{error && (`,
    `{auditId && !result && (
        <LiveAuditProgress 
          auditId={auditId} 
          onComplete={async () => {
            const res = await fetch(\`/api/tools/audit/result/\${auditId}\`);
            const data = await res.json();
            if (data.success) {
              setResult(data.data.result || data.data);
              setAuditId(null);
            }
          }} 
        />
      )}
      
      {error && (`
  );
}

fs.writeFileSync('src/components/SecurityAudit.tsx', code);
