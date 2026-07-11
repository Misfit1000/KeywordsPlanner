import { API_ROUTES } from '../lib/api/routes';
import { safeJsonFetch } from '../lib/http/safe-json';
import React, { useState } from 'react';
import { Search, Loader2, Download, TrendingUp, BarChart } from 'lucide-react';
import { KeywordResult } from '../lib/keywords/generator';
import { Notice, PageHeader, Panel, ResponsiveTable } from './ui/page-system';

export default function KeywordResearch({ keyword: initialKeyword }: { keyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const dataResp = await safeJsonFetch<any>(API_ROUTES.keywordResearch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: keyword })
      });
      if (!dataResp.success) throw new Error((dataResp as any).error || 'Failed to fetch keywords');
      
      const data = dataResp.data;
      setResults(data.data.keywords || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!results.length) return;
    const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [['Keyword', 'Intent', 'Estimated difficulty', 'Opportunity score', 'Source'], ...results.map((row) => [row.keyword, row.intent, row.estimatedDifficulty, row.opportunityScore, row.source])];
    const href = URL.createObjectURL(new Blob([rows.map((row) => row.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = 'seointel-keyword-ideas.csv';
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-rise">
      <PageHeader eyebrow="Rule-based planning" icon={Search} title="Keyword ideas" description="Generate deterministic phrase variations and planning scores without pretending they are live search volume, traffic, or ranking data." />

      <Panel className="p-5 sm:p-6">
        <form onSubmit={handleResearch} className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Enter a seed keyword..."
              className="suite-input pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="trust-button sm:w-auto"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Analyze
          </button>
        </form>
      </Panel>

      {error && <Notice tone="danger" title="Ideas could not be generated">{error}</Notice>}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">Total Keywords</p>
              <p className="text-2xl font-bold">{results.length}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">High Opportunity</p>
              <p className="text-2xl font-bold text-green-500">{results.filter(r => r.opportunityScore > 75).length}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">Transactional</p>
              <p className="text-2xl font-bold text-accent">{results.filter(r => r.intent === 'Transactional').length}</p>
            </div>
          </div>

          <Panel className="overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-semibold">Generated Keywords</h3>
              <button type="button" onClick={exportCsv} className="quiet-button px-3 py-2 text-sm">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <ResponsiveTable label="Generated keyword ideas" minWidth={760}>
              <table className="suite-table">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">Keyword</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">Intent</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">Difficulty (Est.)</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">Opportunity Score</th>
                    <th className="px-6 py-3 font-semibold text-muted-foreground">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map(r => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{r.keyword}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                          {r.intent}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-2 max-w-[100px]">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${r.estimatedDifficulty}%` }} />
                          </div>
                          <span>{r.estimatedDifficulty}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${r.opportunityScore > 75 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {r.opportunityScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          </Panel>
        </div>
      )}
    </div>
  );
}
