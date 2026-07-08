import React from 'react';
import { Globe, Moon, Sun, TrendingUp } from 'lucide-react';

export function SurfaceCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card/90 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>}
        <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const tones = {
    neutral: 'border-border bg-muted text-muted-foreground',
    success: 'border-green-500/20 bg-green-500/10 text-green-600',
    warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-700',
    danger: 'border-red-500/20 bg-red-500/10 text-red-600',
    accent: 'border-accent/20 bg-accent/10 text-accent',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function ProgressBar({
  value,
  label,
  tone = 'accent',
}: {
  value: number;
  label?: string;
  tone?: 'accent' | 'green' | 'yellow' | 'red';
}) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  const colors = {
    accent: 'bg-accent',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{label}</span>
          <span className="text-foreground">{Math.round(safeValue)}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${colors[tone]} transition-all duration-700 ease-out`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'accent',
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  icon?: React.ReactNode;
  tone?: 'accent' | 'green' | 'yellow' | 'red' | 'blue';
}) {
  const tones = {
    accent: 'bg-accent/10 text-accent',
    green: 'bg-green-500/10 text-green-600',
    yellow: 'bg-yellow-500/10 text-yellow-700',
    red: 'bg-red-500/10 text-red-600',
    blue: 'bg-blue-500/10 text-blue-600',
  };
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-bold">{value}</div>
          {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
        </div>
        {icon && <div className={`rounded-2xl p-3 ${tones[tone]} transition-transform duration-300 group-hover:scale-105`}>{icon}</div>}
      </div>
    </SurfaceCard>
  );
}

export function BarList({
  items,
}: {
  items: Array<{ label: string; value: number; tone?: 'accent' | 'green' | 'yellow' | 'red' }>;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ProgressBar key={item.label} label={item.label} value={item.value} tone={item.tone || 'accent'} />
      ))}
    </div>
  );
}

export function SeverityStack({
  critical,
  high,
  medium,
  low,
}: {
  critical: number;
  high: number;
  medium: number;
  low: number;
}) {
  const total = Math.max(1, critical + high + medium + low);
  const parts = [
    { label: 'Critical', value: critical, className: 'bg-red-500' },
    { label: 'High', value: high, className: 'bg-orange-500' },
    { label: 'Medium', value: medium, className: 'bg-yellow-500' },
    { label: 'Low', value: low, className: 'bg-blue-500' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {parts.map((part) => (
          <div key={part.label} className={`${part.className} transition-all duration-700`} style={{ width: `${(part.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        {parts.map((part) => (
          <div key={part.label} className="rounded-lg border border-border bg-muted/30 p-2">
            <div className="font-semibold">{part.value}</div>
            <div className="text-muted-foreground">{part.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SitePreviewCard({
  url,
  title,
  description,
  hostname,
}: {
  url?: string | null;
  title?: string | null;
  description?: string | null;
  hostname?: string | null;
}) {
  const displayUrl = url || hostname || 'Waiting for URL';
  const host = hostname || (() => {
    try {
      return displayUrl ? new URL(displayUrl).hostname : '';
    } catch {
      return displayUrl;
    }
  })();
  const favicon = host ? `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(host)}` : '';
  return (
    <SurfaceCard className="overflow-hidden">
      <div className="h-24 bg-gradient-to-br from-accent/25 via-blue-500/10 to-green-500/10" />
      <div className="p-5">
        <div className="-mt-11 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          {favicon ? <img src={favicon} alt="" className="h-8 w-8 rounded" /> : <Globe className="h-7 w-7 text-accent" />}
        </div>
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{host || 'Website preview'}</div>
        <h3 className="mt-2 line-clamp-2 text-xl font-bold">{title || 'Site preview will update as pages are crawled'}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
          {description || 'SEOIntel shows metadata, crawl progress, and issues without storing raw page HTML.'}
        </p>
        <div className="mt-4 break-all rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{displayUrl}</div>
      </div>
    </SurfaceCard>
  );
}

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'dark' | 'light';
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/90 px-2 text-sm font-semibold shadow-sm transition-all duration-300 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${theme === 'dark' ? 'translate-x-7 bg-accent text-accent-foreground' : 'translate-x-0 bg-yellow-400 text-slate-950'}`}>
        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
      <span className="sr-only">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-2 font-bold tracking-tight text-foreground">
      <div className="rounded-xl bg-accent p-2 text-accent-foreground shadow-sm shadow-accent/20">
        <TrendingUp className="h-5 w-5" />
      </div>
      <span className="text-xl">SEO<span className="text-accent">Intel</span></span>
    </div>
  );
}
