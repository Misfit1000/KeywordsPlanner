import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon, MapPin, Loader2, Navigation } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface LocalResult {
  title: string;
  uri: string;
}

export default function LocalMapResults({ keyword, location, latLng }: { keyword: string, location?: string, latLng?: {latitude: number, longitude: number} | null }) {
  const [results, setResults] = useState<LocalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchMapData = async () => {
      try {
        const prompt = `Find the top local businesses or places related to "${keyword}" in ${location || 'the world'}.`;
        
        const config: any = {
          tools: [{ googleMaps: {} }],
        };

        if (latLng) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: latLng.latitude,
                longitude: latLng.longitude
              }
            }
          };
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config
        });

        if (!isMounted) return;

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const mapResults: LocalResult[] = [];

        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.maps) {
              mapResults.push({
                title: chunk.maps.title || 'Unknown Place',
                uri: chunk.maps.uri || '#',
              });
            }
          });
        }

        // Filter out duplicates based on URI
        const uniqueResults = Array.from(new Map(mapResults.map(item => [item.uri, item])).values());

        setResults(uniqueResults);
        setLoading(false);
      } catch (err) {
        if (isMounted) {
          console.error("Map data error:", err);
          setError("Failed to load local map results.");
          setLoading(false);
        }
      }
    };

    fetchMapData();

    return () => { isMounted = false; };
  }, [keyword, location, latLng]);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Finding local map results...</p>
      </div>
    );
  }

  if (error || results.length === 0) {
    return null; // Hide if no results or error
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <MapIcon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-white">Local Map Results</h3>
        {location && (
          <span className="text-sm text-slate-400 ml-auto flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {location}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.slice(0, 6).map((result, i) => (
          <motion.a
            key={i}
            href={result.uri}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -5, scale: 1.02 }}
            className="flex flex-col p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-blue-500/30 transition-all group"
          >
            <h4 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
              {result.title}
            </h4>
            <div className="mt-auto flex items-center justify-between text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1 text-blue-400/80 group-hover:text-blue-400">
                <Navigation className="w-3 h-3" /> View on Maps
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
