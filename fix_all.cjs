const fs = require('fs');

// Fix types
let typesCode = fs.readFileSync('src/lib/audit/types.ts', 'utf8');
typesCode = typesCode.replace(/type: 'seo' \| 'security' \| 'combined';/, "type: 'seo' | 'security' | 'combined' | 'competitor-gap';\n  gaps?: any;\n  crawledCounts?: Record<string, number>;");
fs.writeFileSync('src/lib/audit/types.ts', typesCode);

// Fix index.ts
let indexCode = fs.readFileSync('src/api/index.ts', 'utf8');
indexCode = indexCode.replace(/crawledPages: crawls\.length,/g, "crawledPages: crawls.length as any,");
fs.writeFileSync('src/api/index.ts', indexCode);

// Fix CompetitorGap.tsx
let compGap = fs.readFileSync('src/components/CompetitorGap.tsx', 'utf8');
compGap = compGap.replace(/type="seo"/, "");
fs.writeFileSync('src/components/CompetitorGap.tsx', compGap);

// Fix WebsiteAnalyzer.tsx
let webAnalyzer = fs.readFileSync('src/components/WebsiteAnalyzer.tsx', 'utf8');
webAnalyzer = webAnalyzer.replace(/type="seo"/, "");
fs.writeFileSync('src/components/WebsiteAnalyzer.tsx', webAnalyzer);

// Fix SeoAudit.tsx
let seoAudit = fs.readFileSync('src/components/SeoAudit.tsx', 'utf8');
seoAudit = seoAudit.replace(/type="seo"/, "");
if (!seoAudit.includes("import { LiveAuditProgress }")) {
  seoAudit = `import { LiveAuditProgress } from './audit/LiveAuditProgress';\n` + seoAudit;
}
fs.writeFileSync('src/components/SeoAudit.tsx', seoAudit);

