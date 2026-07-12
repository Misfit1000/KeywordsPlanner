import { useState } from 'react';
import { Database, Save, Settings as SettingsIcon, ShieldCheck, UserRound } from 'lucide-react';
import { FormField, Notice, PageHeader, PageSection, Panel } from './ui/page-system';

const SETTINGS_KEY = 'seointel_preferences';

function readPreferences() {
  try {
    return { maxPages: 25, engineName: 'SEOIntelBot/1.0', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { maxPages: 25, engineName: 'SEOIntelBot/1.0' };
  }
}

export default function Settings() {
  const [preferences, setPreferences] = useState(readPreferences);
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-9 animate-rise">
      <PageHeader
        eyebrow="Account"
        icon={SettingsIcon}
        title="Settings"
        description="Manage browser preferences and understand which product settings are controlled by your plan or deployment."
        actions={<button type="button" onClick={save} className="trust-button"><Save className="h-4 w-4" /> Save preferences</button>}
      />

      {saved && <Notice tone="success" title="Preferences saved">These browser settings will be used on this device.</Notice>}

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="h-fit space-y-1 lg:sticky lg:top-24" aria-label="Settings sections">
          {[
            ['scan-preferences', ShieldCheck, 'Audit preferences'],
            ['account-plan', UserRound, 'Account and plan'],
            ['data-sources', Database, 'Data sources'],
          ].map(([id, Icon, label]) => (
            <a key={id as string} href={`#${id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              <Icon className="h-4 w-4 text-accent" />{label as string}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          <PageSection id="scan-preferences" title="Audit preferences" description="Local defaults for starting an audit. Server-enforced plan limits always take priority.">
            <Panel className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              <FormField label="Preferred full-audit page limit" htmlFor="max-pages" hint="Your active plan and audit-engine capacity may apply a lower limit.">
                <input id="max-pages" type="number" min={1} max={500} value={preferences.maxPages} onChange={(event) => setPreferences((value) => ({ ...value, maxPages: Number(event.target.value) }))} className="suite-input" />
              </FormField>
              <FormField label="Audit engine label" htmlFor="engine-name" hint="Used only as a local display preference; it does not change the deployed engine identity.">
                <input id="engine-name" type="text" value={preferences.engineName} onChange={(event) => setPreferences((value) => ({ ...value, engineName: event.target.value }))} className="suite-input" />
              </FormField>
            </Panel>
          </PageSection>

          <PageSection id="account-plan" title="Account and plan" description="Review your current usage, plan access, and account role.">
            <Panel className="p-5 sm:p-6"><Notice tone="info">Open the Overview page to see current daily and monthly usage. Plan upgrades are shown only when a billing or administrator path is configured.</Notice></Panel>
          </PageSection>

          <PageSection id="data-sources" title="Optional data sources" description="Ranking, backlink, and search-performance views require user-provided data. SEOIntel does not invent missing provider values.">
            <Panel className="p-5 sm:p-6"><Notice tone="warning" title="Provider credentials are not entered here">Use Data Imports for CSV, Google Search Console, or Bing exports. Service credentials remain server-side and are never accepted by this browser form.</Notice></Panel>
          </PageSection>
        </div>
      </div>
    </div>
  );
}
