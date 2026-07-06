import { parseHtml } from '../seo/html-parser';

export async function fetchSecurityPage(url: string) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SEOIntelBot/1.0 (Local Analysis Tools)' },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const headers: Record<string, string> = {};
    response.headers.forEach((val, key) => { headers[key.toLowerCase()] = val; });
    
    const html = await response.text();
    const parsed = parseHtml(html, response.url);
    
    return {
      success: true,
      url,
      finalUrl: response.url,
      status: response.status,
      headers,
      data: parsed,
      html
    };
  } catch (error: any) {
    clearTimeout(timeout);
    return {
      success: false,
      url,
      finalUrl: url,
      status: 0,
      headers: {},
      error: error.message
    };
  }
}
