import React, { useState } from "react"; 
import { PieChart, Download, Loader2, FileJson, FileSpreadsheet, Printer, ShieldCheck, AlertTriangle } from "lucide-react";
import { BarList, MetricCard, SectionHeader, SeverityStack } from './ui/visual-system';

export default function Reports() {   
  const [loading, setLoading] = useState<string | null>(null);  

  const handleExportJson = () => {    
    setLoading('json');    
    setTimeout(() => {      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({         
        report: "SEOIntel Full Audit Export",        
        date: new Date().toISOString()      
      }, null, 2));      
      const a = document.createElement('a');      
      a.href = dataStr;      
      a.download = "seo-audit-full.json";      
      document.body.appendChild(a);      
      a.click();      
      a.remove();      
      setLoading(null);    
    }, 800);  
  };  

  const handleExportCsv = (type: string) => {
    setLoading(`csv-${type}`);    
    setTimeout(() => {      
      let csvContent = "No data available";
            if (type === 'search') {
                const gsc = localStorage.getItem('seo_gsc_data');
                if (gsc) {
                    const parsed = JSON.parse(gsc);
                    if (parsed.length) {
                        csvContent = Object.keys(parsed[0]).join(',') + '\n' + parsed.map(r => Object.values(r).join(',')).join('\n');
                    }
                }
            } else if (type === 'keywords') {
                const kw = localStorage.getItem('seo_keyword_data');
                if (kw) {
                    const parsed = JSON.parse(kw);
                    if (parsed.length) {
                        csvContent = Object.keys(parsed[0]).join(',') + '\n' + parsed.map(r => Object.values(r).join(',')).join('\n');
                    }
                }
            } else {
                csvContent = "URL,Title,Issue,Severity\nhttps://example.com,Home,Missing H1,High\n"; // Placeholder for other audits
            }
            const csvStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);      
      const a = document.createElement('a');      
      a.href = csvStr;      
      a.download = `seointel-${type}-export.csv`;      
      document.body.appendChild(a);      
      a.click();      
      a.remove();      
      setLoading(null);    
    }, 800);
  }

  const handlePrint = () => {
    window.print();
  }

  return (    
    <div className="w-full space-y-8 animate-rise">
      <SectionHeader
        eyebrow="Reports"
        title="Reports & Exports"
        description="Understand audit health quickly, then export JSON, CSV, or printable reports for clients and developers."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Overall score" value="84" detail="Latest report sample" icon={<PieChart className="h-6 w-6" />} tone="green" />
        <MetricCard label="Critical issues" value="3" detail="Prioritize first" icon={<AlertTriangle className="h-6 w-6" />} tone="red" />
        <MetricCard label="Security grade" value="A-" detail="Passive checks" icon={<ShieldCheck className="h-6 w-6" />} tone="green" />
        <MetricCard label="Export formats" value="3" detail="JSON, CSV, PDF" icon={<Download className="h-6 w-6" />} tone="accent" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold">Category score bars</h2>
          <p className="mb-5 text-sm text-muted-foreground">Preview the same hierarchy used in audit reports.</p>
          <BarList items={[
            { label: 'SEO', value: 84, tone: 'green' },
            { label: 'Technical', value: 76, tone: 'accent' },
            { label: 'Performance', value: 68, tone: 'yellow' },
            { label: 'Security', value: 88, tone: 'green' },
            { label: 'Crawlability', value: 79, tone: 'accent' },
          ]} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold">Severity distribution</h2>
          <p className="mb-5 text-sm text-muted-foreground">A compact summary for client-facing reports.</p>
          <SeverityStack critical={3} high={6} medium={12} low={8} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">        
        
        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-start space-y-4 shadow-sm hover:shadow-md transition-shadow">        
          <div className="p-3 bg-accent/10 rounded-xl">
             <FileJson className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-xl font-bold font-display">Full JSON Audit</h2>        
          <p className="text-sm text-muted-foreground">Export the complete audit payload containing all issues, pages crawled, and domain statistics as a structured JSON object.</p>                
          <button onClick={handleExportJson} disabled={!!loading} className="mt-auto px-4 py-2 bg-muted hover:bg-muted/80 font-semibold rounded-lg inline-flex items-center gap-2 transition-colors">          
            {loading === 'json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}          
            Export JSON        
          </button>      
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-start space-y-4 shadow-sm hover:shadow-md transition-shadow">        
          <div className="p-3 bg-green-500/10 rounded-xl">
             <FileSpreadsheet className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-xl font-bold font-display">CSV Exports</h2>        
          <p className="text-sm text-muted-foreground">Download standard CSV sheets for specific datasets to import into Excel or Google Sheets.</p>                
          
          <div className="flex flex-wrap gap-2 mt-auto">
            <button onClick={() => handleExportCsv('issues')} disabled={!!loading} className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors">          
              {loading === 'csv-issues' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Audit Issues CSV        
            </button>      
            <button onClick={() => handleExportCsv('pages')} disabled={!!loading} className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors">          
              {loading === 'csv-pages' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Crawled Pages CSV        
            </button>
            <button onClick={() => handleExportCsv('search')} disabled={!!loading} className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors">          
              {loading === 'csv-search' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Search Data CSV        
            </button>
            <button onClick={() => handleExportCsv('keywords')} disabled={!!loading} className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors">          
              {loading === 'csv-keywords' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Keywords CSV        
            </button>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl flex flex-col items-start space-y-4 shadow-sm hover:shadow-md transition-shadow">        
          <div className="p-3 bg-purple-500/10 rounded-xl">
             <Printer className="w-6 h-6 text-purple-500" />
          </div>
          <h2 className="text-xl font-bold font-display">Printable PDF Report</h2>        
          <p className="text-sm text-muted-foreground">Generate a clean, print-ready document summarizing the project dashboard and main SEO audit issues for client delivery.</p>                
          <button onClick={handlePrint} className="mt-auto px-4 py-2 bg-muted hover:bg-muted/80 font-semibold rounded-lg inline-flex items-center gap-2 transition-colors">          
            <Printer className="w-4 h-4" />          
            Print / Save as PDF        
          </button>      
        </div>

      </div>    
    </div>  
  ); 
}
