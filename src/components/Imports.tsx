import React, { useState, useRef } from "react"; 
import { Upload, Database, CheckCircle2, AlertTriangle } from "lucide-react"; 
import Papa from 'papaparse';

export default function Imports() { 
  const [keywordData, setKeywordData] = useState<any[]>([]);
  const [backlinkData, setBacklinkData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const kwFileRef = useRef<HTMLInputElement>(null);
  const blFileRef = useRef<HTMLInputElement>(null);

  const handleKwUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(results.errors[0].message);
        } else {
          setKeywordData(results.data);
          setError(null);
        }
      }
    });
  };

  const handleBlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(results.errors[0].message);
        } else {
          setBacklinkData(results.data);
          setError(null);
        }
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Data Imports</h1>
      <p className="text-muted-foreground">Import CSV files containing real volume, CPC, difficulty, or backlink data.</p>
      
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl flex gap-2">
          <AlertTriangle className="w-5 h-5"/> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-card p-6 border border-border rounded-2xl text-center space-y-4">
          <Database className="w-8 h-8 mx-auto text-accent" />
          <h3 className="font-bold text-lg">Keyword Metrics CSV</h3>
          <p className="text-sm text-muted-foreground">Expected headers: keyword, volume, cpc, difficulty, position, url</p>
          <input type="file" accept=".csv" className="hidden" ref={kwFileRef} onChange={handleKwUpload} />
          
          {keywordData.length > 0 ? (
            <div className="text-green-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <p>{keywordData.length} rows imported successfully</p>
            </div>
          ) : (
            <button onClick={() => kwFileRef.current?.click()} className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium">
              Select CSV File
            </button>
          )}
        </div>
        
        <div className="bg-card p-6 border border-border rounded-2xl text-center space-y-4">
          <Database className="w-8 h-8 mx-auto text-accent" />
          <h3 className="font-bold text-lg">Backlinks CSV</h3>
          <p className="text-sm text-muted-foreground">Expected headers: source_url, target_url, anchor, status, domain_rating</p>
          <input type="file" accept=".csv" className="hidden" ref={blFileRef} onChange={handleBlUpload} />
          
          {backlinkData.length > 0 ? (
            <div className="text-green-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <p>{backlinkData.length} rows imported successfully</p>
            </div>
          ) : (
            <button onClick={() => blFileRef.current?.click()} className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium">
              Select CSV File
            </button>
          )}
        </div>
      </div>

      {(keywordData.length > 0 || backlinkData.length > 0) && (
        <div className="bg-card border border-border rounded-2xl p-6 mt-6 overflow-x-auto">
          <h3 className="font-bold mb-4">Preview</h3>
          {keywordData.length > 0 && (
            <table className="w-full text-left text-sm mb-6">
               <thead className="bg-muted/50">
                 <tr>
                   <th className="p-2 font-medium">Keyword</th>
                   <th className="p-2 font-medium">Volume</th>
                   <th className="p-2 font-medium">CPC</th>
                   <th className="p-2 font-medium">Difficulty</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border">
                 {keywordData.slice(0, 5).map((row, i) => (
                   <tr key={i}>
                     <td className="p-2">{row.keyword || '-'}</td>
                     <td className="p-2">{row.volume || '-'}</td>
                     <td className="p-2">{row.cpc || '-'}</td>
                     <td className="p-2">{row.difficulty || '-'}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  ); 
}
