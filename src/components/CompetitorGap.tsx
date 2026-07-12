import { Target } from 'lucide-react';
import { Notice, PageHeader, Panel } from './ui/page-system';

export default function CompetitorGap() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 animate-rise">
      <PageHeader eyebrow="Planned workflow" icon={Target} title="Competitor comparison" description="Compare public page structure only after the background audit engine supports a bounded, resource-light workflow." />
      <Notice tone="warning" title="Background comparison is not active">The unfinished form has been removed so the page does not present controls that cannot complete an analysis. Long competitor scans will run only in the separate audit engine when this feature is ready.</Notice>
      <Panel className="grid gap-6 p-6 sm:p-8 md:grid-cols-3">
        {[
          ['1', 'Choose audited pages', 'Use completed SEOIntel audits as the evidence source.'],
          ['2', 'Compare measured checks', 'Metadata, headings, links, response signals, and passive safety only.'],
          ['3', 'Review differences', 'Show real observed differences without invented rankings or traffic.'],
        ].map(([step, title, copy]) => (
          <div key={step}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-sm font-semibold text-accent">{step}</div>
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
          </div>
        ))}
      </Panel>
    </div>
  );
}
