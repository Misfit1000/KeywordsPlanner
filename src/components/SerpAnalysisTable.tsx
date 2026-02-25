import { memo } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Users, DollarSign, ShieldAlert, FileText, Link as LinkIcon, Loader2, BarChart2, PlaySquare, Image, MapPin, HelpCircle, ShoppingBag, Newspaper, LayoutTemplate } from 'lucide-react';
import { KeywordData } from '../services/keywordService';

export default memo(function SerpAnalysisTable({ data, loading }: { data: KeywordData['topPages'], loading?: boolean }) {
  const getSerpFeatureIcon = (feature: string) => {
    const f = feature.toLowerCase();
    if (f.includes('snippet')) return <FileText className="w-3 h-3" />;
    if (f.includes('video')) return <PlaySquare className="w-3 h-3" />;
    if (f.includes('image')) return <Image className="w-3 h-3" />;
    if (f.includes('local') || f.includes('map')) return <MapPin className="w-3 h-3" />;
    if (f.includes('ask') || f.includes('question')) return <HelpCircle className="w-3 h-3" />;
    if (f.includes('shop') || f.includes('product')) return <ShoppingBag className="w-3 h-3" />;
    if (f.includes('news') || f.includes('top stories')) return <Newspaper className="w-3 h-3" />;
    return <LayoutTemplate className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl overflow-hidden relative shadow-sm col-span-1 md:col-span-2"
    >
      {loading && (
        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
      <div className="p-6 border-b border-border bg-muted/50 relative z-10">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            Advanced SERP Analysis
          </h3>
          <div className="text-sm text-muted-foreground">Top 10 Organic Results</div>
        </div>
        <p className="text-muted-foreground text-xs">Detailed metrics for the highest ranking pages, including traffic estimates and keyword difficulty.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Rank & URL</th>
              <th className="px-6 py-4 font-medium text-right">Traffic</th>
              <th className="px-6 py-4 font-medium text-right">Value</th>
              <th className="px-6 py-4 font-medium text-right">Links</th>
              <th className="px-6 py-4 font-medium text-right">DA / PA</th>
              <th className="px-6 py-4 font-medium text-right">Top KD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((page, index) => (
              <motion.tr 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                className="hover:bg-muted/50 transition-colors group"
              >
                <td className="px-6 py-4 max-w-xs sm:max-w-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <a 
                        href={page.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-accent hover:underline flex items-center gap-1 line-clamp-1"
                        title={page.title}
                      >
                        {page.title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                      <div className="text-xs text-muted-foreground truncate mt-1" title={page.url}>
                        {page.url}
                      </div>
                      {page.serpFeatures && page.serpFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {page.serpFeatures.map((feature, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border text-[10px] text-muted-foreground" title={feature}>
                              {getSerpFeatureIcon(feature)}
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5 font-medium text-foreground">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    {page.traffic.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1 font-medium text-emerald-500">
                    <DollarSign className="w-3.5 h-3.5" />
                    {page.trafficValue.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    {page.backlinks.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground" title="Domain Authority">
                      {page.domainAuthority}
                    </span>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground" title="Page Authority">
                      {page.pageAuthority}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${page.topKeywordDifficulty > 70 ? 'bg-orange-500' : page.topKeywordDifficulty > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="font-medium text-foreground">{page.topKeywordDifficulty}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
});
