import React, { useEffect, useRef } from 'react';
import { AuditLiveEvent } from '../../lib/audit/events';
import { Check, Search, ShieldAlert, FileText, AlertTriangle, Play, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  events: AuditLiveEvent[];
  autoScroll?: boolean;
}

export function AuditTimeline({ events, autoScroll = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const getIcon = (type: string, severity?: string) => {
    if (type.includes('started')) return <Play className="w-3 h-3" />;
    if (type === 'issue_found') {
      if (severity === 'critical') return <ShieldAlert className="w-3 h-3 text-red-500" />;
      if (severity === 'high') return <AlertTriangle className="w-3 h-3 text-orange-500" />;
      if (severity === 'medium') return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      return <Info className="w-3 h-3 text-blue-500" />;
    }
    if (type.includes('crawled')) return <Search className="w-3 h-3" />;
    if (type.includes('completed')) return <Check className="w-3 h-3 text-green-500" />;
    if (type.includes('score')) return <Activity className="w-3 h-3 text-indigo-500" />;
    return <ChevronRight className="w-3 h-3" />;
  };

  const Info = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Event Timeline</h3>
        <span className="text-xs text-gray-500">{events.length} events</span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {events.map((ev, i) => (
            <motion.div 
              key={ev.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start group"
            >
              <div className="flex-shrink-0 w-16 text-xs text-gray-400 mt-0.5">
                {new Date(ev.timestamp || Date.now()).toLocaleTimeString([], { hour12: false })}
              </div>
              
              <div className="flex-shrink-0 mt-1 mr-3 relative">
                <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm z-10 relative">
                  {getIcon(ev.type, ev.severity)}
                </div>
                {i !== events.length - 1 && (
                  <div className="absolute top-5 left-1/2 -ml-px w-px h-full bg-gray-200 -z-0" />
                )}
              </div>
              
              <div className="flex-1 pb-2">
                <div className="text-gray-900 font-medium">
                  {ev.message}
                </div>
                {ev.affectedUrl && (
                  <div className="text-xs text-blue-600 mt-1 break-all truncate max-w-md" title={ev.affectedUrl}>
                    {ev.affectedUrl}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {events.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            Waiting for events...
          </div>
        )}
      </div>
    </div>
  );
}
