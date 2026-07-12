import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, ChevronRight, X } from 'lucide-react';
import type { ResourceAuditEvent } from '../../lib/audit/resource-types';
import { customerSafeDiagnosticText } from '../../lib/audit/audit-failures';

const PREFERENCE_KEY = 'seointel_audit_activity_open_v1';

function readableEventTitle(event: ResourceAuditEvent) {
  if (event.type === 'audit_started') return 'Audit started';
  if (event.type === 'url_normalized') return 'Website address confirmed';
  if (event.type === 'page_discovered') return 'Page discovered';
  if (event.type === 'page_warning' || event.type === 'warning_summary') return 'Audit warning';
  if (event.type === 'page_crawled') return 'Page analysed';
  if (event.type === 'check_completed') return 'Checks completed';
  if (event.type === 'audit_completed_with_warnings') return 'Report generated with warnings';
  if (event.type === 'audit_completed') return 'Report generated';
  if (event.type === 'audit_failed') return 'Audit stopped safely';
  return event.type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AuditActivityButton({ unread, onOpen }: { unread: number; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="fixed bottom-5 right-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-accent/30 hover:bg-muted active:translate-y-px sm:right-6" aria-label={`Open audit activity${unread ? `, ${unread} unread updates` : ''}`}>
      <Activity className="h-4 w-4 text-accent" /> Activity
      {unread > 0 && <span className="min-w-5 rounded-full bg-accent px-1.5 py-0.5 text-center text-[11px] text-white" aria-live="polite">{Math.min(99, unread)}</span>}
    </button>
  );
}

export function AuditActivityDrawer({ events, open, onClose }: { events: ResourceAuditEvent[]; open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => restoreFocusRef.current?.focus();
  }, [open]);

  if (!open) return null;
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return createPortal(<>
    <button type="button" className="fixed inset-0 z-[70] bg-slate-950/35 md:hidden" onClick={onClose} aria-label="Close audit activity" />
    <aside ref={panelRef} onKeyDown={onKeyDown} role="dialog" aria-modal="true" aria-labelledby="audit-activity-title" className="fixed inset-x-0 bottom-0 z-[80] flex max-h-[86dvh] flex-col rounded-t-lg border border-border bg-card shadow-sm md:inset-y-[5rem] md:left-auto md:right-4 md:w-[min(460px,calc(100vw-2rem))] md:rounded-lg">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div><h2 id="audit-activity-title" className="font-semibold">Audit activity</h2><p className="mt-0.5 text-xs text-muted-foreground">Specific page updates and warning summaries</p></div>
        <button ref={closeRef} type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close activity panel"><X className="h-5 w-5" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {events.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Waiting for the first audit update.</div> : events.map((event) => {
          const message = customerSafeDiagnosticText(event.message) || 'Audit update recorded.';
          return <article key={event.id} className="border-b border-border px-3 py-3 last:border-0"><div className="flex items-start gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{readableEventTitle(event)}</h3><time className="shrink-0 text-[11px] text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</time></div><p className="mt-1 text-sm leading-5 text-muted-foreground">{message}</p>{event.affectedUrl && <p className="mt-1 truncate text-xs text-muted-foreground" title={event.affectedUrl}>{event.affectedUrl}</p>}</div><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></div></article>;
        })}
      </div>
    </aside>
  </>, document.body);
}

export default function AuditActivityPanel({ events }: { events: ResourceAuditEvent[] }) {
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem(PREFERENCE_KEY) === 'open');
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const setPreference = (next: boolean) => {
    setOpen(next);
    window.localStorage.setItem(PREFERENCE_KEY, next ? 'open' : 'closed');
    if (next) setLastSeenCount(events.length);
  };
  const unread = open ? 0 : Math.max(0, events.length - lastSeenCount);
  return <>{!open && <AuditActivityButton unread={unread} onOpen={() => setPreference(true)} />}<AuditActivityDrawer events={events} open={open} onClose={() => setPreference(false)} /></>;
}
