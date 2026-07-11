import { Globe } from 'lucide-react';
import { EmptyState } from './ui/visual-system';
import { Notice, PageHeader, Panel } from './ui/page-system';

export default function PublicDiscovery() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 animate-rise">
      <PageHeader eyebrow="Import-ready data" icon={Globe} title="Public web discovery" description="Review public link observations only when a supported dataset or user import is available." />
      <Notice tone="warning" title="Coverage is intentionally limited">Public crawl datasets are incomplete and never represent a complete live backlink index. SEOIntel does not manufacture missing links, authority, or traffic.</Notice>
      <Panel className="p-6 sm:p-10">
        <EmptyState icon={Globe} title="No public link dataset loaded" description="Import a compliant backlink export before using this workspace. A website audit alone does not create backlink data." />
      </Panel>
    </div>
  );
}
