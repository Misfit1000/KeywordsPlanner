import React, { useEffect, useState } from 'react';
import { LiveAuditClient } from '../../lib/audit/live-client';
import { AuditLiveEvent } from '../../lib/audit/events';
import { AuditStatusCards } from './AuditStatusCards';
import { CurrentCheckPanel } from './CurrentCheckPanel';
import { AuditTimeline } from './AuditTimeline';
import { IssueFeed } from './IssueFeed';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  auditId: string;
  onComplete: () => void;
}

export function LiveAuditProgress({ auditId, onComplete }: Props) {
  const [events, setEvents] = useState<AuditLiveEvent[]>([]);
  const [status, setStatus] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new LiveAuditClient(auditId, {
      onEvent: (ev) => {
        setEvents(prev => {
          if (prev.some(p => p.id === ev.id)) return prev;
          return [...prev, ev];
        });
      },
      onStatusUpdate: (s) => setStatus(s),
      onError: (err) => setError(err),
      onComplete: () => onComplete()
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [auditId, onComplete]);

  const latestEvent = events[events.length - 1];
  const progress = latestEvent?.progress ?? status?.progress ?? 0;
  const currentStep = latestEvent?.step ?? status?.currentStep ?? 'Initializing';
  const affectedUrl = latestEvent?.affectedUrl;
  const message = latestEvent?.message ?? '';

  const issues = events.filter(e => e.type === 'issue_found');
  const severityCounts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
    info: issues.filter(i => i.severity === 'info').length,
  };

  const pagesDiscovered = status.pagesDiscovered || latestEvent?.pagesDiscovered || 0;
  const pagesCrawled = status.pagesCrawled || latestEvent?.pagesCrawled || 0;
  const checksCompleted = status.checksCompleted || latestEvent?.checksCompleted || 0;

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <h3 className="font-semibold text-lg mb-2">Audit Failed</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Audit in Progress</h2>
          <span className="text-indigo-600 font-mono font-medium">{Math.round(progress)}%</span>
        </div>
        
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-indigo-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          />
        </div>
      </div>

      <AuditStatusCards 
        pagesDiscovered={pagesDiscovered}
        pagesCrawled={pagesCrawled}
        checksCompleted={checksCompleted}
        issuesFound={issues.length}
        severityCounts={severityCounts}
      />

      <CurrentCheckPanel 
        currentStep={currentStep}
        affectedUrl={affectedUrl}
        message={message}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <AuditTimeline events={events} />
        <IssueFeed events={events} />
      </div>
      
    </div>
  );
}
