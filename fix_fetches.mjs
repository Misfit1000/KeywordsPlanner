import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const depth = filePath.split('/').length - 2;
  const relPath = Array(depth).fill('..').join('/');

  if (!content.includes('safeJsonFetch')) {
    content = `import { safeJsonFetch } from '${relPath}/lib/http/safe-json';\n` + content;
  }
  if (!content.includes('API_ROUTES')) {
    content = `import { API_ROUTES } from '${relPath}/lib/api/routes';\n` + content;
  }

  // Handle generic fetches
  content = content.replace(
    /const (response|res) = await fetch\(['"`]\/api\/tools\/(.*?)['"`],\s*\{([\s\S]*?)\}\s*\);\s*const (data|resData) = await \1\.json\(\);/g,
    (match, resVar, endpoint, fetchOpts, dataVar) => {
      // Find the right route mapping
      let route = `'/api/tools/${endpoint}'`;
      if (endpoint === 'audit/start') route = 'API_ROUTES.auditStart';
      else if (endpoint === 'keyword/research') route = 'API_ROUTES.keywordResearch';
      else if (endpoint === 'website/analyze') route = 'API_ROUTES.websiteAnalyze';
      else if (endpoint === 'clusters') route = 'API_ROUTES.clusters';
      else if (endpoint === 'content-brief') route = 'API_ROUTES.contentBrief';
      else if (endpoint === 'competitor-gap') route = 'API_ROUTES.competitorGap';

      return `const ${dataVar}Resp = await safeJsonFetch<any>(${route}, {${fetchOpts}});\n      const ${dataVar} = ${dataVar}Resp.success ? ${dataVar}Resp.data : { success: false, error: ${dataVar}Resp.error };`;
    }
  );

  content = content.replace(
    /const (response|res) = await fetch\([`'"]\/api\/tools\/audit\/result\/\$\{(.*?)\}[`'"]\);\s*const (data|resData) = await \1\.json\(\);/g,
    (match, resVar, idVar, dataVar) => {
      return `const ${dataVar}Resp = await safeJsonFetch<any>(API_ROUTES.auditResult(${idVar}));\n        const ${dataVar} = ${dataVar}Resp.success ? ${dataVar}Resp.data : { success: false, error: ${dataVar}Resp.error };`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  'src/components/SeoAudit.tsx',
  'src/components/CompetitorGap.tsx',
  'src/components/ContentBriefs.tsx',
  'src/components/KeywordClusters.tsx',
  'src/components/KeywordResearch.tsx',
  'src/components/WebsiteAnalyzer.tsx',
  'src/components/SecurityAudit.tsx'
];

files.forEach(replaceInFile);

// Handle live-client.ts separately
let liveClientContent = fs.readFileSync('src/lib/audit/live-client.ts', 'utf8');
if (!liveClientContent.includes('safeJsonFetch')) {
  liveClientContent = `import { safeJsonFetch } from '../http/safe-json';\nimport { API_ROUTES } from '../api/routes';\n` + liveClientContent;
  liveClientContent = liveClientContent.replace(
    /const res = await fetch\(`\/api\/tools\/audit\/status\/\$\{this\.auditId\}`\);\s*const data = await res\.json\(\);/,
    `const dataResp = await safeJsonFetch<any>(API_ROUTES.auditStatus(this.auditId));\n      if (!dataResp.success) throw new Error(dataResp.error);\n      const data = dataResp.data;`
  );
  liveClientContent = liveClientContent.replace(
    /this\.eventSource = new EventSource\(`\/api\/tools\/audit\/events\/\$\{this\.auditId\}`\);/,
    `this.eventSource = new EventSource(API_ROUTES.auditEvents(this.auditId));`
  );
  fs.writeFileSync('src/lib/audit/live-client.ts', liveClientContent, 'utf8');
  console.log('Updated src/lib/audit/live-client.ts');
}

