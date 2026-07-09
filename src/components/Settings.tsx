import React from 'react';
import { Database, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';

export default function Settings() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 animate-rise">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-accent/10 p-3 text-accent">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-muted-foreground">Adjust scan defaults and optional data connections without changing the audit architecture.</p>
        </div>
      </div>

      <section className="trust-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Website scan defaults</h2>
            <p className="text-sm text-muted-foreground">These controls describe how many pages a full scan should try to review.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Max pages per full scan</span>
            <input type="number" defaultValue={25} className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Audit engine name</span>
            <input type="text" defaultValue="SEOIntelBot/1.0" className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="trust-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Optional imported data</h2>
            <p className="text-sm text-muted-foreground">Live rankings and search volume are disabled unless you bring a compliant provider or upload your own exports.</p>
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted-foreground">Third-party search data key</span>
          <input type="password" placeholder="Disabled" disabled className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 opacity-60" />
        </label>
      </section>
    </div>
  );
}
