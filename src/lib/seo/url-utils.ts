export interface NormalizedUrlResult {
  input: string;
  normalizedUrl: string;
  origin: string;
  hostname: string;
  protocol: "http:" | "https:";
  pathname: string;
  isValid: boolean;
  error?: string;
}

export function normalizeUserUrl(input: string): NormalizedUrlResult {
  const trimmed = input.trim();
  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    withProtocol = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(withProtocol);
    return {
      input: trimmed,
      normalizedUrl: parsed.href,
      origin: parsed.origin,
      hostname: parsed.hostname,
      protocol: parsed.protocol as "http:" | "https:",
      pathname: parsed.pathname,
      isValid: true,
    };
  } catch (error: any) {
    return {
      input: trimmed,
      normalizedUrl: '',
      origin: '',
      hostname: '',
      protocol: "https:",
      pathname: '',
      isValid: false,
      error: error.message || 'Invalid URL',
    };
  }
}

export function normalizeDomainInput(input: string): string {
  const result = normalizeUserUrl(input);
  if (!result.isValid) return input;
  return result.normalizedUrl;
}

export function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(url, baseUrl);
    parsed.hash = ''; // Remove fragments
    return parsed.href;
  } catch (e) {
    return null;
  }
}

export function isSameDomain(url1: string, url2: string): boolean {
  try {
    const host1 = new URL(url1).hostname;
    const host2 = new URL(url2).hostname;
    return host1 === host2 || host1.endsWith('.' + host2) || host2.endsWith('.' + host1);
  } catch (e) {
    return false;
  }
}

export function stripTrackingParams(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    return parsed.href;
  } catch (e) {
    return url;
  }
}

export function isLikelyDomain(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  
  // Basic domain matching without protocol
  const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/;
  return domainRegex.test(trimmed.replace(/^https?:\/\//, ''));
}

export function getDomainVariants(input: string): string[] {
  const res = normalizeUserUrl(input);
  if (!res.isValid) return [input];
  
  const host = res.hostname;
  const noWww = host.replace(/^www\./, '');
  
  return Array.from(new Set([
    `https://${noWww}`,
    `http://${noWww}`,
    `https://www.${noWww}`,
    `http://www.${noWww}`
  ]));
}
