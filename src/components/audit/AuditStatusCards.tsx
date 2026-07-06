import React from 'react';
import { Activity, ShieldAlert, CheckCircle, Search, AlertTriangle, Info } from 'lucide-react';

interface Props {
  pagesDiscovered: number;
  pagesCrawled: number;
  checksCompleted: number;
  issuesFound: number;
  severityCounts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export function AuditStatusCards({ pagesDiscovered, pagesCrawled, checksCompleted, issuesFound, severityCounts }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Pages</p>
          <p className="text-xl font-semibold text-gray-900">{pagesCrawled} <span className="text-sm text-gray-400 font-normal">/ {pagesDiscovered || pagesCrawled}</span></p>
        </div>
      </div>
      
      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Checks Run</p>
          <p className="text-xl font-semibold text-gray-900">{checksCompleted}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Issues Found</p>
          <p className="text-xl font-semibold text-gray-900">{issuesFound}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Critical / High</p>
          <p className="text-xl font-semibold text-gray-900">
            {severityCounts?.critical || 0} <span className="text-sm text-gray-400 font-normal">/ {severityCounts?.high || 0}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
