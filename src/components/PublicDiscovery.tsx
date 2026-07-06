import React from 'react';
import { Globe, Search, Link2, AlertCircle } from 'lucide-react';

export default function PublicDiscovery() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Public Web Discovery</h1>
          <p className="text-muted-foreground mt-2">Explore backlinks and mentions discovered via Common Crawl and public datasets.</p>
        </div>
      </div>
      
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Disclaimer:</strong> Public web discovery is an incomplete dataset. This data comes from Common Crawl, imported backlinks, and public links. It does not reflect a full, live picture of all backlinks. Import your GSC or backlink CSVs for accurate data. No fake data is generated here.
        </div>
      </div>

      <div className="bg-card border border-border p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm h-64">
        <Globe className="w-12 h-12 text-muted-foreground/30" />
        <h3 className="text-xl font-bold font-display">No domains analyzed yet</h3>
        <p className="text-muted-foreground max-w-md">
          Run a full SEO audit on a domain to cross-reference our public dataset for discovered links, source URLs, target URLs, and anchor text.
        </p>
      </div>
    </div>
  );
}
