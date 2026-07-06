export async function fetchRobotsTxt(origin: string): Promise<string> {
  try {
    const url = new URL('/robots.txt', origin).toString();
    const res = await fetch(url, { headers: { 'User-Agent': 'SEOIntelBot/1.0' }, timeout: 5000 } as any);
    if (res.ok) return await res.text();
  } catch(e) {}
  return '';
}

export function parseRobotsTxt(text: string) {
  const rules = { allow: [] as string[], disallow: [] as string[], sitemaps: [] as string[] };
  const lines = text.split('\n');
  let currentUserAgentMatch = false;
  
  for (const line of lines) {
    const clean = line.split('#')[0].trim();
    if (!clean) continue;
    const [key, ...vals] = clean.split(':');
    const val = vals.join(':').trim();
    
    if (key.toLowerCase() === 'user-agent') {
      currentUserAgentMatch = val === '*' || val.toLowerCase().includes('seointelbot');
    } else if (key.toLowerCase() === 'sitemap') {
      rules.sitemaps.push(val);
    } else if (currentUserAgentMatch) {
      if (key.toLowerCase() === 'allow') rules.allow.push(val);
      if (key.toLowerCase() === 'disallow') rules.disallow.push(val);
    }
  }
  return rules;
}

export function getSitemapUrlsFromRobots(text: string): string[] {
  return parseRobotsTxt(text).sitemaps;
}

export function isBlockedByRobots(url: string, rules: any): boolean {
  try {
    const pathname = new URL(url).pathname;
    
    // Explicit allow wins
    for (const rule of rules.allow) {
      if (rule === '' || rule === '/') continue; // simplify
      if (pathname.startsWith(rule)) return false;
    }
    
    for (const rule of rules.disallow) {
      if (rule === '') continue;
      if (pathname.startsWith(rule)) return true;
    }
  } catch(e) {}
  return false;
}
