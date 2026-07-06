import React from 'react';
import { Loader2, Activity } from 'lucide-react';

interface Props {
  currentStep: string;
  affectedUrl?: string;
  message: string;
}

export function CurrentCheckPanel({ currentStep, affectedUrl, message }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center">
          <Activity className="w-4 h-4 mr-2 text-indigo-500" />
          Live Activity
        </h3>
        <div className="flex items-center text-indigo-600 text-sm font-medium">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Running
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-xs text-gray-400 uppercase font-semibold">Phase</span>
          <p className="text-gray-900 font-medium">{currentStep || 'Initializing...'}</p>
        </div>
        
        <div>
          <span className="text-xs text-gray-400 uppercase font-semibold">Action</span>
          <p className="text-gray-600 font-mono text-sm break-all">{message || 'Preparing audit environment...'}</p>
        </div>
        
        {affectedUrl && (
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold">Target</span>
            <p className="text-blue-600 font-mono text-sm break-all">{affectedUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}
