import React, { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { motion } from "motion/react";
import { Globe, Loader2, Plus, Minus, RotateCcw, Info } from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  currentLocation?: string;
  onLocationSelect: (countryCode: string) => void;
  loading?: boolean;
  regionalInterest?: { 
    country: string; 
    volume: number; 
    percentage: number;
    cities?: {
      name: string;
      state: string;
      volume: number;
      percentage: number;
      coordinates: [number, number];
    }[];
  }[];
}

const WorldMap = ({
  currentLocation,
  onLocationSelect,
  loading,
  regionalInterest = [],
}: WorldMapProps) => {
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  // Create a map for quick lookup
  const interestMap = React.useMemo(() => new Map(
    regionalInterest.map((item) => [item.country.toLowerCase(), item]),
  ), [regionalInterest]);

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  };

  const handleMoveEnd = (newPosition: { coordinates: [number, number]; zoom: number }) => {
    setPosition(newPosition);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden shadow-sm"
    >
      {loading && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
      <div className="flex flex-col mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Global Interest Map</h3>
          <p className="text-sm text-slate-400 ml-auto hidden sm:block">
            Click a country to view regional data
          </p>
        </div>
        <p className="text-slate-500 text-xs mt-2">Geographic distribution of search volume across the globe.</p>
      </div>

      <div className="w-full h-[300px] md:h-[400px] bg-muted/50 rounded-2xl overflow-hidden border border-border relative">
        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
          <button 
            onClick={handleZoomIn}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors shadow-sm"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors shadow-sm"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={handleReset}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors shadow-sm"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
          }}
          width={800}
          height={400}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup 
            zoom={position.zoom} 
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            maxZoom={5}
            minZoom={1}
            translateExtent={[
              [0, 0],
              [800, 400]
            ]}
          >
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
                  let hoverFill = "#334155";
                  if (isCurrent) {
                    fill = "#3b82f6";
                    hoverFill = "#60a5fa";
                  } else if (interestData) {
                    hoverFill = "#00FF00"; // Prominent highlight for countries with data
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
                      data-tooltip-content={JSON.stringify({
                        type: 'country',
                        countryName,
                        volume: interestData?.volume,
                        percentage: interestData?.percentage,
                        hasData: !!interestData
                      })}
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
                          fill: hoverFill,
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
            {/* Render City Markers */}
            {regionalInterest.flatMap((country) => 
              (country.cities || []).map((city, index) => (
                <Marker 
                  key={`${country.country}-${city.name}-${index}`} 
                  coordinates={city.coordinates}
                >
                  <circle 
                    r={position.zoom > 2 ? 3 / position.zoom : 2} 
                    fill="#00FF00" 
                    stroke="#1e293b" 
                    strokeWidth={0.5}
                    data-tooltip-id="world-map-tooltip"
                    data-tooltip-content={JSON.stringify({
                      type: 'city',
                      cityName: city.name,
                      stateName: city.state,
                      countryName: country.country,
                      volume: city.volume,
                      percentage: city.percentage,
                      hasData: true
                    })}
                    className="cursor-pointer hover:fill-white transition-colors"
                  />
                </Marker>
              ))
            )}
          </ZoomableGroup>
        </ComposableMap>

        <Tooltip
          id="world-map-tooltip"
          className="!bg-card/95 !backdrop-blur-md !border !border-border !rounded-xl !shadow-lg !p-4 !z-50 !opacity-100"
          render={({ content }) => {
            if (!content) return null;
            try {
              const data = JSON.parse(content);
              return (
                <div className="min-w-[200px]">
                  <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                    <div className="flex flex-col">
                      <p className="text-foreground font-medium">
                        {data.type === 'city' ? `${data.cityName}, ${data.stateName}` : data.countryName}
                      </p>
                      {data.type === 'city' && (
                        <p className="text-xs text-muted-foreground">{data.countryName}</p>
                      )}
                    </div>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {data.hasData ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#00FF00]" />
                            Search Volume
                          </span>
                          <span className="font-bold text-foreground" style={{ color: "#00FF00" }}>
                            {data.volume.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, data.percentage)}%`, backgroundColor: "#00FF00" }} 
                          />
                        </div>
                        <div className="text-right text-xs text-muted-foreground mt-1">
                          {data.percentage}% of global
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs text-center py-2">No data available</div>
                  )}
                </div>
              );
            } catch (e) {
              return null;
            }
          }}
        />
      </div>
    </motion.div>
  );
};

export default memo(WorldMap);
