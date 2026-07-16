export type DomainSignalStatus = 'measured' | 'not_ranked' | 'unavailable';

export interface WebRankHistoryPoint {
  date: string;
  rank: number;
}

export interface DomainSignalAttribution {
  label: string;
  url: string;
  license?: string;
}

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
  linkStatus: DomainSignalStatus;
  webRankStatus: DomainSignalStatus;
  webRank: number | null;
  previousWebRank: number | null;
  webRankChange: number | null;
  webRankHistory: WebRankHistoryPoint[];
  partial: boolean;
  attributions: DomainSignalAttribution[];
}
