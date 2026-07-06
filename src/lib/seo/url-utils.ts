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
