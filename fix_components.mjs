import fs from 'fs';

const files = [
  'src/components/SeoAudit.tsx',
  'src/components/CompetitorGap.tsx',
  'src/components/ContentBriefs.tsx',
  'src/components/KeywordClusters.tsx',
  'src/components/KeywordResearch.tsx',
  'src/components/WebsiteAnalyzer.tsx',
  'src/components/SecurityAudit.tsx',
  'src/lib/audit/live-client.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\(dataResp\.error\)/g, '((dataResp as any).error)');
  content = content.replace(/:\s*\{ success: false, error: ([^R]+)Resp\.error \}/g, ': { success: false, error: ($1Resp as any).error }');
  
  // also handle dangling `if (!response.ok)`
  content = content.replace(/if \(!response\.ok\) \{/g, 'if (!dataResp.success) {');
  
  // same for `!res.ok`
  content = content.replace(/if \(!res\.ok\) \{/g, 'if (!dataResp.success) {');

  // and `response.statusText` -> `dataResp.error`
  content = content.replace(/response\.statusText/g, '(dataResp as any).error');
  
  // same for `!res.ok`
  content = content.replace(/res\.statusText/g, '(dataResp as any).error');

  fs.writeFileSync(file, content, 'utf8');
}
