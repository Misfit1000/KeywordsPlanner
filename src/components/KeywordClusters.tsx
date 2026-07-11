import { API_ROUTES } from '../lib/api/routes';
import { safeJsonFetch } from '../lib/http/safe-json';
import React, { useState } from 'react';
import { Layers, Loader2, Search, Download } from 'lucide-react';
import { Cluster } from '../lib/keywords/clustering';
import { Notice, PageHeader, Panel } from './ui/page-system';

export default function KeywordClusters() {
  const [keywordList, setKeywordList] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Cluster[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordList.trim()) return;

    const rawKeywords = keywordList.split('\n').map(k => k.trim()).filter(k => k);
    
    setLoading(true);
    setError(null);
    try {
      const genResponse = await safeJsonFetch<any>(API_ROUTES.keywordResearch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: rawKeywords[0] })
      });
      
      if (!genResponse.success) throw new Error((genResponse as any).error || 'Failed to fetch keywords');
      const genData = (genResponse as any).data;
      
      if (genData.keywords) {
         const dataResp = await safeJsonFetch<any>(API_ROUTES.clusters, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: genData.keywords })
        });
        
        if (!dataResp.success) throw new Error((dataResp as any).error || 'Failed to cluster keywords');
        setResults((dataResp as any).data.clusters || (dataResp as any).data.data?.clusters);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!results?.length) return;
    const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [['Cluster', 'Primary keyword', 'Secondary keywords', 'Intent', 'Opportunity'], ...results.map((cluster) => [cluster.name, cluster.primaryKeyword, cluster.keywords.join(' | '), cluster.intent, cluster.opportunityScore])];
    const href = URL.createObjectURL(new Blob([rows.map((row) => row.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = 'seointel-keyword-clusters.csv';
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-rise">
      <PageHeader eyebrow="Local planning" icon={Layers} title="Keyword clusters" description="Group deterministic keyword ideas by local similarity. Scores are planning aids, not live search-volume or ranking measurements." />

      <Panel className="p-5 sm:p-6">
        <form onSubmit={handleCluster} className="space-y-4">
          <div>
             <label className="block text-sm font-medium mb-2">Enter seed keyword to generate and cluster</label>
             <input
                type="text"
                value={keywordList}
                onChange={e => setKeywordList(e.target.value)}
                placeholder="e.g. bookkeeping"
                className="suite-input"
                required
              />
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !keywordList.trim()}
              className="trust-button"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
              Generate Clusters
            </button>
          </div>
        </form>
      </Panel>

      {error && <Notice tone="danger" title="Clusters could not be generated">{error}</Notice>}

      {results && (
        <div className="space-y-4">
           <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Generated Clusters</h2>
            <button type="button" onClick={exportCsv} className="quiet-button px-3 py-2 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {results.map(cluster => (
               <Panel key={cluster.id} className="p-5">
                 <div className="flex justify-between items-start mb-3">
                   <h3 className="font-bold text-lg capitalize">{cluster.name}</h3>
                   <span className="bg-muted px-2 py-1 rounded-md text-xs font-medium">{cluster.keywords.length + 1} keywords</span>
                 </div>
                 <div className="mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Primary</span>
                    <p className="font-medium text-accent mt-0.5">{cluster.primaryKeyword}</p>
                 </div>
                 
                 <div className="space-y-1 mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Secondary</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cluster.keywords.slice(0, 3).map((kw, i) => (
                        <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md">{kw}</span>
                      ))}
                      {cluster.keywords.length > 3 && <span className="text-xs text-muted-foreground px-1 py-1">+{cluster.keywords.length - 3} more</span>}
                    </div>
                 </div>

                 <div className="flex justify-between items-center pt-4 border-t border-border mt-auto">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Intent</p>
                      <p className="text-sm font-semibold">{cluster.intent}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">Opportunity</p>
                      <p className="text-sm font-bold text-green-500">{cluster.opportunityScore}</p>
                    </div>
                 </div>
               </Panel>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
