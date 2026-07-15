import * as cheerio from 'cheerio';
import { safePublicFetch, type SafePublicFetchOptions } from '../security/safe-public-fetch';

export interface SitemapDocument {
  urls: string[];
  sitemaps: string[];
  errors: string[];
}

export async function fetchSitemap(url: string, options: SafePublicFetchOptions = {}) {
  try {
    const response = await safePublicFetch(url, {
      ...options,
      timeoutMs: options.timeoutMs ?? 10_000,
      maxBytes: Math.min(options.maxBytes ?? 2_000_000, 2_000_000),
      allowedContentTypes: ['application/xml', 'text/xml', 'text/plain', 'application/xhtml+xml'],
    });
    if (response.status < 200 || response.status >= 300) return { urls: [], sitemaps: [], errors: [`HTTP ${response.status}`] };
    return parseSitemapXml(response.body);
  } catch(e: any) {
    return { urls: [], sitemaps: [], errors: [e.message] };
  }
}

export function parseSitemapXml(xml: string): SitemapDocument {
  const errors: string[] = [];
  try {
    const $ = cheerio.load(xml, { xmlMode: true });
    const rootName = String($.root().children().first().get(0)?.tagName || '').toLowerCase();
    if (!rootName.endsWith('urlset') && !rootName.endsWith('sitemapindex')) {
      return { urls: [], sitemaps: [], errors: ['Unsupported sitemap root element'] };
    }

    const locations = $('loc')
      .map((_index, element) => $(element).text().trim())
      .get()
      .filter((location) => {
        try {
          const parsed = new URL(location);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      });
    const uniqueLocations = [...new Set(locations)];
    return rootName.endsWith('sitemapindex')
      ? { urls: [], sitemaps: uniqueLocations, errors }
      : { urls: uniqueLocations, sitemaps: [], errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid sitemap XML');
    return { urls: [], sitemaps: [], errors };
  }
}
