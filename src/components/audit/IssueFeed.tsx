import React from 'react';
import { AuditLiveEvent } from '../../lib/audit/events';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  events: AuditLiveEvent[];
}

export function IssueFeed({ events }: Props) {
  const issueEvents = events.filter(e => e.type === 'issue_found').reverse();

  if (issueEvents.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
        <CheckCircle className="w-12 h-12 mx-auto text-green-200 mb-3" />
        <p>No issues found yet.</p>
      </div>
    );
  }

  const getSeverityBadge = (severity: string = 'info') => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      info: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    const color = colors[severity as keyof typeof colors] || colors.info;
    
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${color} uppercase tracking-wider`}>
        {severity}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Live Issues Found</h3>
        <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">
          {issueEvents.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {issueEvents.map((issue) => (
            <motion.div 
              key={issue.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 border border-gray-100 rounded-lg shadow-sm bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900 text-sm">
                  {issue.message}
                </div>
                {getSeverityBadge(issue.severity)}
              </div>
              {issue.affectedUrl && (
                <div className="text-xs text-gray-500 font-mono break-all truncate" title={issue.affectedUrl}>
                  {issue.affectedUrl}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
