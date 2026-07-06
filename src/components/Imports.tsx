import React, { useState, useRef } from "react"; 
import { Upload, Database, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react"; 
import Papa from 'papaparse';

export default function Imports() {   
  const [keywordData, setKeywordData] = useState<any[]>([]);  
  const [backlinkData, setBacklinkData] = useState<any[]>([]);  
  const [gscData, setGscData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);  
  const kwFileRef = useRef<HTMLInputElement>(null);  
  const blFileRef = useRef<HTMLInputElement>(null);  
  const gscFileRef = useRef<HTMLInputElement>(null);

  const handleCsv = (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    const file = e.target.files?.[0];    
    if (!file) return;        
    Papa.parse(file, {      
      header: true,      
      skipEmptyLines: true,      
      complete: (results) => {        
        if (results.errors.length > 0) {          
          setError(results.errors[0].message);        
        } else {          
          setter(results.data);          
          setError(null);        
        }      
      }    
    });  
  };  

  return (    
    <div className="max-w-6xl mx-auto space-y-6">      
      <div>
        <h1 className="text-3xl font-bold font-display">Data Sources & Imports</h1>      
        <p className="text-muted-foreground">Import CSV files containing real performance data, search volume, or backlink data.</p>
        <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border text-sm">
          <strong>Free Real Data Alternatives:</strong> Instead of paying for expensive third-party APIs, SEOIntel relies on your own first-party data. Import <strong>Google Search Console (GSC)</strong> data, <strong>Bing Webmaster Tools</strong> CSVs, or public discovery sources like <strong>Common Crawl</strong>. Note: GSC/Bing data only works for verified/imported sites. No fake data is generated.
        </div>
      </div>            
      
      {error && (        
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl flex gap-2">          
          <AlertTriangle className="w-5 h-5"/> {error}        
        </div>      
      )}      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">        
        
        {/* GSC Import */}
        <div className="bg-card p-6 border border-border rounded-2xl text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">          
          <FileSpreadsheet className="w-8 h-8 mx-auto text-accent" />          
          <h3 className="font-bold text-lg font-display">GSC / Bing Import</h3>          
          <p className="text-sm text-muted-foreground">Import Query or Page performance CSVs from Search Console.</p>          
          <input type="file" accept=".csv" className="hidden" ref={gscFileRef} onChange={e => handleCsv(e, setGscData)} />                    
          {gscData.length > 0 ? (            
            <div className="text-green-500 flex flex-col items-center gap-2">              
              <CheckCircle2 className="w-6 h-6" />              
              <p className="text-sm font-medium">{gscData.length} rows imported</p>            
            </div>          
          ) : (            
            <button onClick={() => gscFileRef.current?.click()} className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium">              
              Select CSV File            
            </button>          
          )}        
        </div>

        {/* Keywords Import */}
        <div className="bg-card p-6 border border-border rounded-2xl text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">          
          <Database className="w-8 h-8 mx-auto text-accent" />          
          <h3 className="font-bold text-lg font-display">Keyword Metrics CSV</h3>          
          <p className="text-sm text-muted-foreground">Import Google Keyword Planner or Rank snapshot CSVs.</p>          
          <input type="file" accept=".csv" className="hidden" ref={kwFileRef} onChange={e => handleCsv(e, setKeywordData)} />                    
          {keywordData.length > 0 ? (            
            <div className="text-green-500 flex flex-col items-center gap-2">              
              <CheckCircle2 className="w-6 h-6" />              
              <p className="text-sm font-medium">{keywordData.length} rows imported</p>            
            </div>          
          ) : (            
            <button onClick={() => kwFileRef.current?.click()} className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium">              
              Select CSV File            
            </button>          
          )}        
        </div>                
        
        {/* Backlinks Import */}
        <div className="bg-card p-6 border border-border rounded-2xl text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">          
          <Database className="w-8 h-8 mx-auto text-accent" />          
          <h3 className="font-bold text-lg font-display">Backlinks CSV</h3>          
          <p className="text-sm text-muted-foreground">Import links from Common Crawl or Generic SEO CSV.</p>          
          <input type="file" accept=".csv" className="hidden" ref={blFileRef} onChange={e => handleCsv(e, setBacklinkData)} />                    
          {backlinkData.length > 0 ? (            
            <div className="text-green-500 flex flex-col items-center gap-2">              
              <CheckCircle2 className="w-6 h-6" />              
              <p className="text-sm font-medium">{backlinkData.length} rows imported</p>            
            </div>          
          ) : (            
            <button onClick={() => blFileRef.current?.click()} className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium">              
              Select CSV File            
            </button>          
          )}        
        </div>      
      </div>      
      
      {(keywordData.length > 0 || backlinkData.length > 0 || gscData.length > 0) && (        
        <div className="bg-card border border-border rounded-2xl p-6 mt-6 overflow-x-auto shadow-sm">          
          <h3 className="font-bold mb-4 font-display">Data Preview</h3>          
          
          {gscData.length > 0 && (            
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Search Console Data</h4>
              <table className="w-full text-left text-sm">               
                <thead className="bg-muted/50 text-muted-foreground">                 
                  <tr>                   
                    {Object.keys(gscData[0] || {}).slice(0, 5).map(k => <th key={k} className="p-3 font-medium">{k}</th>)}
                  </tr>               
                </thead>               
                <tbody className="divide-y divide-border">                 
                  {gscData.slice(0, 5).map((row, i) => (                   
                    <tr key={i} className="hover:bg-muted/20">                     
                      {Object.keys(gscData[0] || {}).slice(0, 5).map(k => <td key={k} className="p-3 truncate max-w-[200px]">{row[k] || '-'}</td>)}
                    </tr>                 
                  ))}               
                </tbody>            
              </table>          
            </div>
          )}

          {keywordData.length > 0 && (            
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Imported Keywords Data</h4>
              <table className="w-full text-left text-sm">               
                <thead className="bg-muted/50 text-muted-foreground">                 
                  <tr>                   
                    <th className="p-3 font-medium">Keyword</th>                   
                    <th className="p-3 font-medium">Volume</th>                   
                    <th className="p-3 font-medium">CPC</th>                   
                    <th className="p-3 font-medium">Difficulty</th>                 
                  </tr>               
                </thead>               
                <tbody className="divide-y divide-border">                 
                  {keywordData.slice(0, 5).map((row, i) => (                   
                    <tr key={i} className="hover:bg-muted/20">                     
                      <td className="p-3 font-medium">{row.keyword || '-'}</td>                     
                      <td className="p-3">{row.volume || '-'}</td>                     
                      <td className="p-3">{row.cpc || '-'}</td>                     
                      <td className="p-3">
                        {row.difficulty ? <span className="px-2 py-1 bg-muted rounded-md text-xs">{row.difficulty}</span> : '-'}
                      </td>                   
                    </tr>                 
                  ))}               
                </tbody>            
              </table>
            </div>          
          )}        
        </div>      
      )}    
    </div>  
  ); 
}
