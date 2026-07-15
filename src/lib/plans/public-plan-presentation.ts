export type PublicPlanId = 'free' | 'plus' | 'pro';

export interface PublicPlanPresentation {
  id: PublicPlanId;
  name: string;
  mode: string;
  pagesPerAudit: number;
  allowance: string;
  bestFor: string;
  features: string[];
  footer: string;
  recommended?: boolean;
}

export const PUBLIC_AUDIT_PLANS: readonly PublicPlanPresentation[] = [
  {
    id: 'free', name: 'Free', mode: 'Quick audit', pagesPerAudit: 5,
    allowance: '3 daily · 30 monthly', bestFor: 'Testing a small website or a few important pages',
    features: [
      'Core on-page and technical SEO checks',
      'Metadata, headings, indexing, and crawlability findings',
      'Passive browser-security observations',
      'Live progress and saved reports',
      'JSON and CSV exports',
      'One active audit at a time',
    ],
    footer: 'Best for small sites and first-time checks.',
  },
  {
    id: 'plus', name: 'Plus', mode: 'Full standard audit', pagesPerAudit: 50,
    allowance: '25 daily · 500 monthly', bestFor: 'Small businesses and growing content websites',
    features: [
      'Includes everything in Free',
      'Wider page coverage and full finding categories',
      'PDF, JSON, and CSV exports',
      'Audit history and comparison',
      'Faster processing priority',
    ],
    footer: 'Best for businesses managing one growing website.', recommended: true,
  },
  {
    id: 'pro', name: 'Pro', mode: 'Agency deep audit', pagesPerAudit: 75,
    allowance: '100 daily · 3,000 monthly', bestFor: 'Agencies, teams, and larger websites',
    features: [
      'Includes everything in Plus',
      'Quick, Standard, and Deep audit modes',
      'Deep sitemap and crawl-graph discovery',
      'PDF, JSON, and CSV reports',
      'Highest non-admin processing priority',
    ],
    footer: 'Best for agencies, multi-site teams, and larger websites.',
  },
] as const;

export const PUBLIC_PLAN_COMPARISON = [
  { label: 'Pages per audit', values: ['5', '50', '75'] },
  { label: 'Audit modes', values: ['Quick', 'Quick + Standard', 'Quick + Standard + Deep'] },
  { label: 'PDF export', values: ['No', 'Yes', 'Yes'] },
  { label: 'JSON and CSV exports', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'History and comparison', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'Deep sitemap discovery', values: ['No', 'No', 'Yes'] },
] as const;
