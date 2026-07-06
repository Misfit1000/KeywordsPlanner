import fs from 'fs';

let content = fs.readFileSync('src/components/KeywordResearch.tsx', 'utf8');

const replacement = `      const dataResp = await safeJsonFetch<any>(API_ROUTES.keywordResearch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: keyword })
      });
      if (!dataResp.success) throw new Error((dataResp as any).error || 'Failed to fetch keywords');
      
      const data = dataResp.data;`;

content = content.replace(/      const response = await fetch\('\/api\/tools\/keyword\/research', \{[\s\S]*?      const data = await response\.json\(\);/, replacement);

fs.writeFileSync('src/components/KeywordResearch.tsx', content, 'utf8');
