import { API_ROUTES } from '../lib/api/routes';
import { safeJsonFetch } from '../lib/http/safe-json';
import React, { useState } from 'react';
import { FileText, Loader2, Download, Search } from 'lucide-react';
import { ContentBrief } from '../lib/keywords/content-brief';
import { Notice, PageHeader, Panel } from './ui/page-system';

export default function ContentBriefs() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const inputCluster = {
        id: '1',
        name: topic,
        primaryKeyword: topic,
        keywords: [`${topic} tips`, `${topic} guide`, `best ${topic}`],
        intent: 'Informational',
        opportunityScore: 80,
        difficulty: 40,
        suggestedContentType: 'Blog Post'
      };

      const dataResp = await safeJsonFetch<any>(API_ROUTES.contentBrief, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster: inputCluster })
      });
      const data = dataResp.success ? dataResp.data : { success: false, error: (dataResp as any).error };
      if (!dataResp.success) throw new Error(data.error || 'Failed to generate brief');
      
      setBrief(data.data.brief);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportBrief = () => {
    if (!brief) return;
    const text = [
      `${topic} - SEOIntel content brief`,
      `Intent: ${brief.targetIntent}`,
      `Format: ${brief.suggestedFormat}`,
      `Length: ${brief.wordCount}`,
      '',
      'Title ideas', ...brief.titleTemplates.map((value) => `- ${value}`),
      '',
      'Meta description ideas', ...brief.metaDescriptionTemplates.map((value) => `- ${value}`),
      '',
      'H1 ideas', ...brief.h1Suggestions.map((value) => `- ${value}`),
      '',
      'Outline', ...brief.h2Outline.map((value, index) => `${index + 1}. ${value}`),
      '',
      'Related phrases', ...brief.relatedKeywords.map((value) => `- ${value}`),
    ].join('\n');
    const href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = 'seointel-content-brief.txt';
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-rise">
      <PageHeader eyebrow="Deterministic planning" icon={FileText} title="Content brief builder" description="Build rule-based metadata and heading outlines without AI or unsupported search-volume claims." />

      <Panel className="p-5 sm:p-6">
        <form onSubmit={handleGenerate} className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Enter a primary keyword or topic..."
              className="suite-input pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="trust-button"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            Build Brief
          </button>
        </form>
      </Panel>

      {error && <Notice tone="danger" title="Brief could not be built">{error}</Notice>}

      {brief && (
        <Panel className="space-y-8 p-6 sm:p-8">
          <div className="flex justify-between items-start border-b border-border pb-6">
            <div>
              <h2 className="text-2xl font-bold capitalize mb-2">{topic} - Content Brief</h2>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="bg-muted px-2 py-1 rounded-md">Intent: {brief.targetIntent}</span>
                <span className="bg-muted px-2 py-1 rounded-md">Format: {brief.suggestedFormat}</span>
                <span className="bg-muted px-2 py-1 rounded-md">Length: {brief.wordCount}</span>
              </div>
            </div>
            <button type="button" onClick={exportBrief} className="quiet-button px-3 py-2 text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-accent">1. Page Titles</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              {brief.titleTemplates.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-accent">2. Meta Description</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              {brief.metaDescriptionTemplates.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-accent">3. H1 Heading</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              {brief.h1Suggestions.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-accent">4. H2 Outline Structure</h3>
            <ul className="list-decimal pl-5 space-y-2 text-muted-foreground">
              {brief.h2Outline.map((t, i) => <li key={i} className="font-medium text-foreground">{t}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-accent">5. Target Secondary Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {brief.relatedKeywords.map((k, i) => (
                <span key={i} className="px-3 py-1.5 bg-muted/50 rounded-lg text-sm border border-border">
                  {k}
                </span>
              ))}
            </div>
          </div>

          {brief.faqs.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-accent">6. Frequently Asked Questions (FAQ Schema)</h3>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                {brief.faqs.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
