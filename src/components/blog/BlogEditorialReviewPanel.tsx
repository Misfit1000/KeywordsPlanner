import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, FileCheck2, Image, Link2, SearchCheck, ShieldCheck } from 'lucide-react';
import type { BlogPost, BlogPostInput, BlogSource } from '../../lib/blog/types';
import { StatusBadge } from '../ui/visual-system';

function statusTone(value: string | undefined) {
  if (value === 'passed' || value === 'not_required') return 'success' as const;
  if (value === 'blocked' || value === 'failed') return 'danger' as const;
  return 'warning' as const;
}

export default function BlogEditorialReviewPanel({ post, draft }: { post?: BlogPost; draft: BlogPostInput }) {
  const [selectedClaim, setSelectedClaim] = useState<{ claim: string; source: BlogSource } | null>(null);
  const [selectedWarning, setSelectedWarning] = useState('');
  const sources = draft.sources || [];
  const checks = useMemo(() => [
    ['Quality gates', draft.qualityStatus || 'pending', FileCheck2], ['Source verification', draft.sourceStatus || 'pending', SearchCheck],
    ['Originality', draft.originalityStatus || 'pending', ShieldCheck], ['Internal links', /href=["']\//i.test(draft.contentHtml) ? 'passed' : 'needs_review', Link2],
    ['External references', /href=["']https?:\/\//i.test(draft.contentHtml) ? 'passed' : 'needs_review', ExternalLink], ['Image licence', draft.ogImageUrl ? draft.imageStatus || 'pending' : 'not_required', Image],
    ['Static HTML', draft.prerenderStatus || 'pending', FileCheck2], ['Sitemap and RSS', draft.status === 'published' && !String(draft.robotsDirective || '').includes('noindex') ? 'passed' : 'not_required', CheckCircle2],
  ] as const, [draft]);
  const warnings = draft.qualityResults?.warnings || [];
  return <aside className="h-fit rounded-lg border border-border bg-muted/20 p-4 2xl:sticky 2xl:top-24" aria-label="Editorial validation">
    <h4 className="font-semibold text-foreground">Editorial validation</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">Review evidence and publishing gates beside the article. Provider prompts and private notes are never shown here.</p>
    <div className="mt-4 space-y-2">{checks.map(([label, value, Icon]) => <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3"><span className="flex items-center gap-2 text-sm text-foreground"><Icon className="h-4 w-4 text-muted-foreground" /> {label}</span><StatusBadge tone={statusTone(String(value))}>{String(value).replaceAll('_', ' ')}</StatusBadge></div>)}</div>
    <div className="mt-5"><h5 className="text-sm font-semibold text-foreground">Claims and sources</h5><div className="mt-2 space-y-2">{sources.flatMap((source) => (source.supportedClaims || []).map((claim) => <button key={`${source.url}-${claim}`} type="button" onClick={() => setSelectedClaim({ claim, source })} className="w-full rounded-md border border-border bg-card p-3 text-left text-xs leading-5 hover:border-accent"><span className="line-clamp-2 text-foreground">{claim}</span><span className="mt-1 block text-muted-foreground">{source.publisher}</span></button>))}{!sources.some((source) => source.supportedClaims?.length) && <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">No claim records attached yet.</p>}</div></div>
    {selectedClaim && <div className="mt-3 rounded-md border border-accent/25 bg-accent/5 p-3 text-xs"><p className="font-semibold text-foreground">{selectedClaim.claim}</p><a href={selectedClaim.source.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 break-all text-accent">{selectedClaim.source.title}<ExternalLink className="h-3 w-3" /></a><p className="mt-1 text-muted-foreground">{selectedClaim.source.citationStatus || 'needs review'} · {selectedClaim.source.publishedAt ? new Date(selectedClaim.source.publishedAt).toLocaleDateString() : 'Source date unavailable'}</p></div>}
    <div className="mt-5"><h5 className="text-sm font-semibold text-foreground">Originality review</h5><div className="mt-2 space-y-2">{warnings.map((warning) => <button key={warning} type="button" onClick={() => setSelectedWarning(warning)} className="flex w-full gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-left text-xs leading-5"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><span>{warning}</span></button>)}{!warnings.length && <p className="text-xs text-muted-foreground">No originality warning is recorded.</p>}</div>{selectedWarning && <p className="mt-2 rounded-md bg-card p-3 text-xs leading-5 text-muted-foreground">Affected text requires a manual comparison with its attached source. Recommended action: rewrite from verified evidence or remove repeated wording. {selectedWarning}</p>}</div>
    {post?.imageVariants?.length ? <div className="mt-5"><h5 className="text-sm font-semibold text-foreground">Responsive image variants</h5><div className="mt-2 grid grid-cols-2 gap-2">{post.imageVariants.map((variant) => <div key={`${variant.width}-${variant.format}`} className="rounded-md border border-border bg-card p-2 text-xs"><p className="font-semibold">{variant.width} × {variant.height}</p><p className="text-muted-foreground">{variant.format.toUpperCase()} · {Math.max(1, Math.round(variant.fileSize / 1024))} KB</p></div>)}</div><p className="mt-2 break-all text-xs text-muted-foreground">Source: {post.ogImageUrl}<br />Attribution: {post.ogImageAttribution || 'Not required or not supplied'}</p></div> : null}
  </aside>;
}
