import React from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

export default function SearchData() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Search Data</h1>
          <p className="text-muted-foreground mt-2">Analyze queries, pages, clicks, impressions, CTR, and average positions.</p>
        </div>
      </div>
      
      <div className="bg-card border border-border p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm h-64">
        <BarChart3 className="w-12 h-12 text-muted-foreground/30" />
        <h3 className="text-xl font-bold font-display">No Search Data Connected</h3>
        <p className="text-muted-foreground max-w-md">
          Search Data requires importing your Google Search Console or Bing Webmaster Tools performance CSVs. 
          We do not estimate or fake search volume or live traffic.
        </p>
        <button className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors">
          Go to Data Sources
        </button>
      </div>
    </div>
  );
}
