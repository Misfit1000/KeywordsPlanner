export interface PublicLinkSignals {
  domain: string;
  found: boolean;
  globalRank: number | null;
  tldRank: number | null;
  referringSubnets: number | null;
  referringIps: number | null;
  datasetDate: string | null;
  fetchedAt: string;
  source: 'Majestic Million';
  sourceUrl: string;
  license: 'CC BY 3.0';
  scope: 'public_top_million';
}
