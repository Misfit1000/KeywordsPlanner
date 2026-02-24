import React, { memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { motion } from "motion/react";
import { Globe, Loader2 } from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  currentLocation?: string;
  onLocationSelect: (countryCode: string) => void;
  loading?: boolean;
  regionalInterest?: { country: string; volume: number; percentage: number }[];
}

const WorldMap = ({
  currentLocation,
  onLocationSelect,
  loading,
  regionalInterest = [],
}: WorldMapProps) => {
  // Create a map for quick lookup
  const interestMap = new Map(
    regionalInterest.map((item) => [item.country.toLowerCase(), item]),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden"
    >
      {loading && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <Globe className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-white">Global Interest Map</h3>
        <p className="text-sm text-slate-400 ml-auto">
          Click a country to view regional data
        </p>
      </div>

      <div className="w-full h-[300px] md:h-[400px] bg-slate-950/50 rounded-2xl overflow-hidden border border-white/5 relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 20],
          }}
          width={800}
          height={400}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const isCurrent =
                    currentLocation &&
                    countryName.toLowerCase() === currentLocation.toLowerCase();
                  const interestData = interestMap.get(
                    countryName.toLowerCase(),
                  );

                  // Calculate fill color based on interest data
                  let fill = "#1e293b";
                  if (isCurrent) {
                    fill = "#3b82f6";
                  } else if (interestData) {
                    // Simple color scale based on percentage
                    if (interestData.percentage > 20)
                      fill = "#1d4ed8"; // blue-700
                    else if (interestData.percentage > 10)
                      fill = "#2563eb"; // blue-600
                    else if (interestData.percentage > 5)
                      fill = "#3b82f6"; // blue-500
                    else fill = "#60a5fa"; // blue-400
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      data-tooltip-id="world-map-tooltip"
                      data-tooltip-html={`
                        <div class="text-center">
                          <div class="font-bold text-white mb-1">${countryName}</div>
                          ${
                            interestData
                              ? `
                            <div class="text-blue-400 text-sm">Volume: ${interestData.volume.toLocaleString()}</div>
                            <div class="text-slate-400 text-xs">${interestData.percentage}% of global</div>
                          `
                              : '<div class="text-slate-500 text-xs">No data available</div>'
                          }
                        </div>
                      `}
                      onClick={() => {
                        onLocationSelect(countryName);
                      }}
                      style={{
                        default: {
                          fill: fill,
                          stroke: "#334155",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: "#93c5fd",
                          stroke: "#334155",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: "#2563eb",
                          stroke: "#334155",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        <Tooltip
          id="world-map-tooltip"
          className="!bg-slate-900/90 !backdrop-blur-md !border !border-white/10 !rounded-xl !shadow-2xl !p-3 !z-50"
        />
      </div>
    </motion.div>
  );
};

export default memo(WorldMap);
