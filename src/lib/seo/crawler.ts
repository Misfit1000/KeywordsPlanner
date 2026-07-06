import { parseHtml, ParsedPageData } from './html-parser';
import { normalizeUrl, isSameDomain } from './url-utils';

export interface CrawlResult {
  url: string;
  finalUrl: string;
  status: number;
  success: boolean;
  error?: string;
  data?: ParsedPageData;
  headers: Record<string, string>;
  loadTimeMs: number;
  pageSizeBytes: number;
  contentType: string;
}

export interface CrawlOptions {
  maxPages?: number;
  timeoutMs?: number;
}

export async function crawlDomain(startUrl: string, options: CrawlOptions = {}): Promise<CrawlResult[]> {
  const maxPages = options.maxPages || 25;
  const timeoutMs = options.timeoutMs || 10000;
  
  const visited = new Set<string>();
  const toVisit: string[] = [startUrl];
  const results: CrawlResult[] = [];

  while (toVisit.length > 0 && visited.size < maxPages) {
    const currentUrl = toVisit.shift()!;
    if (visited.has(currentUrl)) continue;
    
    visited.add(currentUrl);

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(currentUrl, {
        headers: { 'User-Agent': 'KeywordsIntelBot/1.0 (Local Analysis Tools)' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      const loadTimeMs = Date.now() - startTime;
      const headers: Record<string, string> = {};
      response.headers.forEach((val, key) => { headers[key.toLowerCase()] = val; });
      const contentType = headers['content-type'] || '';
      
      if (!contentType.includes('text/html')) {
        results.push({
          url: currentUrl,
          finalUrl: response.url,
          status: response.status,
          success: true,
          headers,
          loadTimeMs,
          pageSizeBytes: 0,
          contentType
        });
        continue;
      }

      const html = await response.text();
      const pageSizeBytes = Buffer.byteLength(html, 'utf8');
      
      const parsedData = parseHtml(html, response.url);
      
      results.push({
        url: currentUrl,
        finalUrl: response.url,
        status: response.status,
        success: true,
        data: parsedData,
        headers,
        loadTimeMs,
        pageSizeBytes,
        contentType
      });

      // Add internal links to queue
      for (const link of parsedData.internalLinks) {
        const normalized = normalizeUrl(link.href, response.url);
        if (normalized && isSameDomain(normalized, startUrl) && !visited.has(normalized)) {
          toVisit.push(normalized);
        }
      }
    } catch (error: any) {
      results.push({
        url: currentUrl,
        finalUrl: currentUrl,
        status: 0,
        success: false,
        error: error.message,
        headers: {},
        loadTimeMs: 0,
        pageSizeBytes: 0,
        contentType: ''
      });
    }
  }

  return results;
}
