export async function fetchSitemap(url: string) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'SEOIntelBot/1.0' }, timeout: 10000 } as any);
    if (!res.ok) return { urls: [], errors: ['HTTP ' + res.status] };
    const xml = await res.text();
    return parseSitemapXml(xml);
  } catch(e: any) {
    return { urls: [], errors: [e.message] };
  }
}

function parseSitemapXml(xml: string) {
  const urls: string[] = [];
  const errors: string[] = [];
  
  if (!xml.includes('<?xml')) {
    errors.push('Invalid XML format');
  }
  
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    if (match[1] && match[1].startsWith('http')) {
      urls.push(match[1]);
    }
  }
  return { urls, errors };
}
