const fs = require('fs');
let code = fs.readFileSync('src/components/SeoAudit.tsx', 'utf8');

if (!code.includes('LiveAuditProgress')) {
  code = code.replace(
    `import React, { useState } from 'react';`,
    `import React, { useState } from 'react';\nimport { LiveAuditProgress } from './audit/LiveAuditProgress';`
  );
  
  code = code.replace(
    `const [isLoading, setIsLoading] = useState(false);`,
    `const [isLoading, setIsLoading] = useState(false);\n  const [auditId, setAuditId] = useState<string | null>(null);`
  );
  
  code = code.replace(
    `const response = await fetch('/api/tools/website/analyze', {`,
    `const response = await fetch('/api/tools/audit/start', {`
  );
  
  code = code.replace(
    `const data = await response.json();
      if (data.success) {
        setAuditResult(data.data.fullAudit);`,
    `const data = await response.json();
      if (data.success && data.data?.auditId) {
        setAuditId(data.data.auditId);
        setIsLoading(false);
        return;
      }
      if (data.success) {
        setAuditResult(data.data.fullAudit);`
  );
  
  code = code.replace(
    `{isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-lg">Analyzing website... This may take a minute.</p>
        </div>
      )}`,
    `{isLoading && !auditId && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-lg">Starting audit...</p>
        </div>
      )}
      
      {auditId && !auditResult && (
        <LiveAuditProgress 
          auditId={auditId} 
          onComplete={async () => {
            const res = await fetch(\`/api/tools/audit/result/\${auditId}\`);
            const data = await res.json();
            if (data.success) {
              setAuditResult(data.data.fullAudit || data.data.result || data.data);
              setAuditId(null);
            }
          }} 
        />
      )}`
  );
}

fs.writeFileSync('src/components/SeoAudit.tsx', code);
