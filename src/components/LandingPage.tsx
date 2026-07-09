import React, { useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileText,
  Gauge,
  Globe,
  Link2,
  LockKeyhole,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { createAuditSubmitGuard } from '../lib/api/audit-submit-guard';
import { MetricCard, SeverityStack, SitePreviewSection, StatusBadge, SurfaceCard } from './ui/visual-system';

interface Props {
  onStartAudit: (url: string) => Promise<void> | void;
  onExploreFeatures: () => void;
}

type IconType = React.ComponentType<{ className?: string }>;

const auditChecks: Array<{ title: string; text: string; icon: IconType }> = [
  { title: 'Page titles and descriptions', text: 'Spot missing, duplicated, too long, or unclear search snippets before customers see them.', icon: Search },
  { title: 'Google access checks', text: 'See whether search engines can reach and understand important pages.', icon: Globe },
  { title: 'Preferred page URLs', text: 'Find confusing duplicate-page signals and mismatched preferred URLs.', icon: Link2 },
  { title: 'Headings and content shape', text: 'Review page structure, H1 usage, and content signals without reading raw HTML.', icon: FileText },
  { title: 'Images and internal links', text: 'Catch missing image descriptions, oversized pages, and weak internal linking patterns.', icon: Activity },
  { title: 'Browser safety signals', text: 'Review HTTPS and browser protection settings with non-invasive checks only.', icon: ShieldCheck },
];

const planCards = [
  {
    title: 'Free Quick Audit',
    price: '$0',
    description: 'Best for checking one site quickly.',
    features: ['Lightweight 5-page scan', 'Desktop, mobile, and Google-style preview', 'Basic SEO and safety checks', 'One active audit at a time'],
  },
  {
    title: 'Full Audit',
    price: 'Paid',
    description: 'For owners, marketers, and freelancers who need deeper reports.',
    features: ['Larger website scan', 'More SEO and website health checks', 'Priority processing', 'Client-ready report exports'],
    featured: true,
  },
  {
    title: 'Agency / Admin',
    price: 'Scale',
    description: 'For teams managing many sites.',
    features: ['Deep audit-ready workflow', 'Admin queue and user controls', 'Higher scan limits', 'Operational diagnostics'],
  },
];

const faqs = [
  {
    question: 'Does SEOIntel use paid SEO APIs?',
    answer: 'No. The audit uses your website data and public page signals. Imported search data is optional and clearly separated.',
  },
  {
    question: 'Does it store raw HTML?',
    answer: 'No. The app stores scan results, page details, issues, and report data, not full raw page HTML.',
  },
  {
    question: 'Is the security audit invasive?',
    answer: 'No. It checks public browser safety settings such as HTTPS and protection headers. It does not exploit vulnerabilities or perform penetration testing.',
  },
  {
    question: 'What does the free audit include?',
    answer: 'A lightweight quick scan, live progress, basic SEO checks, passive security checks, and exportable results.',
  },
  {
    question: 'Why are some audit types limited?',
    answer: 'Deeper scans need more always-on audit engine capacity. Free plans stay resource-light so the live site remains reliable.',
  },
];

export default function LandingPage({ onStartAudit, onExploreFeatures }: Props) {
  const [url, setUrl] = useState('');
  const [starting, setStarting] = useState(false);
  const auditStartGuardRef = useRef(createAuditSubmitGuard());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !auditStartGuardRef.current.begin()) return;
    setStarting(true);
    try {
      await onStartAudit(url);
    } finally {
      auditStartGuardRef.current.end();
      setStarting(false);
    }
  };

  return (
    <main className="w-full bg-background text-foreground">
      <section className="section-shell relative overflow-hidden pb-16 pt-16 md:pb-24 md:pt-24">
        <div className="absolute inset-x-4 top-8 -z-10 h-72 rounded-[3rem] bg-gradient-to-br from-accent/10 via-emerald-500/10 to-transparent blur-3xl" />

        <div className="grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
          <div className="space-y-8">
            <nav className="flex flex-wrap gap-2 text-sm" aria-label="Homepage sections">
              <a href="#checks" className="quiet-button px-3 py-1.5">What it checks</a>
              <a href="#reports" className="quiet-button px-3 py-1.5">Reports</a>
              <a href="#plans" className="quiet-button px-3 py-1.5">Plans</a>
            </nav>

            <div className="space-y-5">
              <StatusBadge tone="accent">Visual SEO and website health audits</StatusBadge>
              <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
                Find website issues faster, then show the fix in plain English.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                Run a live website scan, preview how pages look on desktop, mobile, and Google, then get clear SEO, website health, and passive safety recommendations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="trust-card p-2">
              <div className="flex flex-col gap-2 md:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
                  <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="sr-only">Website URL</span>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com"
                    className="w-full bg-transparent text-lg outline-none placeholder:text-muted-foreground/60"
                    required
                  />
                </label>
                <button type="submit" disabled={starting || !url.trim()} className="trust-button px-6 py-3">
                  {starting ? 'Starting audit...' : 'Start free audit'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>

            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <TrustBullet text="No paid SEO API required" />
              <TrustBullet text="No raw HTML stored" />
              <TrustBullet text="Non-invasive safety checks" />
              <TrustBullet text="Live progress from the audit engine" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onExploreFeatures} className="quiet-button">
                Open dashboard demo
              </button>
              <a href="#sample-report" className="quiet-button">
                View sample report
              </a>
            </div>
          </div>

          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">Sample audit report</span>
              </div>
            </div>
            <div className="grid gap-4 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniScore icon={Gauge} label="Site score" value="84" tone="text-emerald-600" />
                <MiniScore icon={Search} label="SEO fixes" value="12" tone="text-amber-600" />
                <MiniScore icon={ShieldCheck} label="Safety" value="A-" tone="text-emerald-600" />
              </div>
              <div className="grid gap-4 lg:grid-cols-[1fr_0.76fr]">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Monitor className="h-4 w-4 text-accent" /> Desktop page preview
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-accent/10" />
                        <div>
                          <div className="h-3 w-28 rounded bg-foreground/75" />
                          <div className="mt-2 h-2 w-20 rounded bg-muted-foreground/30" />
                        </div>
                      </div>
                      <div className="h-8 w-20 rounded-full bg-accent/20" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
                      <div>
                        <div className="h-5 w-3/4 rounded bg-foreground/80" />
                        <div className="mt-3 h-3 w-full rounded bg-muted-foreground/30" />
                        <div className="mt-2 h-3 w-5/6 rounded bg-muted-foreground/30" />
                        <div className="mt-5 h-9 w-32 rounded-xl bg-accent" />
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-accent/20 to-emerald-500/20 p-4">
                        <Sparkles className="mb-8 h-5 w-5 text-accent" />
                        <div className="h-3 w-24 rounded bg-foreground/50" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Smartphone className="h-4 w-4 text-accent" /> Mobile + Google preview
                  </div>
                  <div className="space-y-3">
                    <div className="mx-auto w-36 rounded-[1.6rem] border-4 border-foreground/80 bg-card p-2">
                      <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted-foreground/40" />
                      <div className="rounded-xl bg-muted p-3">
                        <div className="mb-3 h-7 w-7 rounded-lg bg-accent/20" />
                        <div className="h-3 w-full rounded bg-foreground/80" />
                        <div className="mt-2 h-2 w-5/6 rounded bg-muted-foreground/30" />
                        <div className="mt-3 h-7 rounded-lg bg-accent" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-white p-3 text-slate-900 shadow-sm dark:bg-white">
                      <div className="text-xs text-slate-600">example.com</div>
                      <div className="mt-1 text-sm font-medium text-blue-700">Example page title preview</div>
                      <p className="mt-1 text-xs leading-5 text-slate-600">See how your page may appear before customers click.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section id="checks" className="section-shell py-16 md:py-20">
        <div className="mb-10 max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[0.18em] text-accent">What SEOIntel checks</div>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Clear answers, not a wall of technical terms.</h2>
          <p className="mt-3 text-muted-foreground">Each audit turns website signals into a fix list your team can understand.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {auditChecks.map((item) => (
            <InfoCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section id="sample-report" className="section-shell py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <StatusBadge tone="success">Client-friendly reports</StatusBadge>
            <h2 className="text-3xl font-bold md:text-4xl">Show the page, the score, and the next action.</h2>
            <p className="text-muted-foreground">
              Reports lead with plain-language summaries, visual previews, and top fixes first. Developer details stay available when your team needs them.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Overall health" value="84" detail="Easy score summary" icon={<Gauge className="h-6 w-6" />} tone="green" />
              <MetricCard label="Top fixes" value="12" detail="Sorted by priority" icon={<Zap className="h-6 w-6" />} tone="yellow" />
            </div>
            <SeverityStack critical={3} high={6} medium={12} low={8} />
          </div>
          <SitePreviewSection
            url="https://example.com"
            hostname="example.com"
            title="Example Brand - Services, Pricing, and Local Trust"
            description="A clear preview helps users understand what was checked before they read technical details."
          />
        </div>
      </section>

      <section id="reports" className="border-y border-border bg-muted/30 py-16 md:py-20">
        <div className="section-shell">
          <div className="grid gap-6 lg:grid-cols-3">
            <ExplainerCard
              title="SEO visibility"
              text="Review titles, descriptions, headings, internal links, image descriptions, and Google preview quality."
              points={['Search result preview', 'Page structure checks', 'Simple fix guidance']}
            />
            <ExplainerCard
              title="Website health"
              text="Find redirects, slow responses, oversized pages, broken scan paths, and confusing page signals."
              points={['Status checks', 'Page size signals', 'Preferred URL review']}
            />
            <ExplainerCard
              title="Passive safety"
              text="Check public browser protection settings without probing, exploiting, or attacking the site."
              points={['HTTPS review', 'Browser protections', 'Non-invasive checks only']}
            />
          </div>
        </div>
      </section>

      <section id="plans" className="section-shell py-16 md:py-20">
        <div className="mb-10 text-center">
          <div className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Plans</div>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Start light, upgrade when you need deeper scans.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Free audits stay fast and resource-light. Paid and admin workflows unlock more depth when the audit engine supports it.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {planCards.map((plan) => (
            <PlanCard key={plan.title} {...plan} />
          ))}
        </div>
      </section>

      <section className="section-shell py-16 md:py-20">
        <div className="mb-10 max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[0.18em] text-accent">How it works</div>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">A simple flow for useful website checks.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {['Enter a URL', 'The audit engine scans safely', 'SEO and safety checks run', 'Review a visual report'].map((step, index) => (
            <SurfaceCard key={step} className="p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{index + 1}</div>
              <h3 className="text-lg font-bold">{step}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {index === 0 && 'Use any public website URL.'}
                {index === 1 && 'The audit engine runs outside live page requests.'}
                {index === 2 && 'Checks are deterministic and explainable.'}
                {index === 3 && 'Share fixes with clients or developers.'}
              </p>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section id="faq" className="section-shell pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-accent">FAQ</div>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Straight answers before you scan.</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/70">
        <div className="section-shell flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-bold">SEOIntel</div>
            <p className="text-sm text-muted-foreground">Visual SEO, website health, and passive safety audits.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <a href="#checks" className="hover:text-foreground">Checks</a>
            <a href="#reports" className="hover:text-foreground">Reports</a>
            <a href="#plans" className="hover:text-foreground">Plans</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function TrustBullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      <span>{text}</span>
    </div>
  );
}

function MiniScore({ icon: Icon, label, value, tone }: { icon: IconType; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="mb-3 h-5 w-5 text-accent" />
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function InfoCard({ title, text, icon: Icon }: { title: string; text: string; icon: IconType }) {
  return (
    <SurfaceCard className="p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </SurfaceCard>
  );
}

function ExplainerCard({ title, text, points }: { title: string; text: string; points: string[] }) {
  return (
    <SurfaceCard className="p-6">
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
      <ul className="mt-5 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {point}
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}

function PlanCard({
  title,
  price,
  description,
  features,
  featured,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <SurfaceCard className={`p-6 ${featured ? 'border-accent bg-accent/10 shadow-blue-600/10' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-sm font-bold text-accent">{price}</span>
      </div>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="trust-card group p-5">
      <summary className="cursor-pointer list-none font-semibold">
        <span className="flex items-center justify-between gap-4">
          {question}
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        </span>
      </summary>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
    </details>
  );
}
