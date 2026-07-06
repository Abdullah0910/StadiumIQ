import React, { useState } from 'react';
import { StadiumLocation } from '../types';
import { MapPin, Utensils, DoorOpen, Flame, Activity, ShieldAlert, Zap, Filter, HelpCircle } from 'lucide-react';

interface InteractiveMapProps {
  locations: StadiumLocation[];
  selectedLocation: StadiumLocation | null;
  onSelectLocation: (location: StadiumLocation) => void;
  optimizedRoutePath?: { instructions: string[]; estimatedMinutes: number; pathPoints?: [number, number][] };
}

const InteractiveMap = React.memo(function InteractiveMap({
  locations,
  selectedLocation,
  onSelectLocation,
  optimizedRoutePath
}: InteractiveMapProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredLocations = React.useMemo(() => {
    return locations.filter(loc => {
      if (activeFilter === 'all') return true;
      return loc.type === activeFilter;
    });
  }, [locations, activeFilter]);

  // Get color for density
  const getDensityColor = (density: 'low' | 'medium' | 'high') => {
    if (density === 'low') return 'fill-emerald-500/20 stroke-emerald-500';
    if (density === 'medium') return 'fill-amber-500/20 stroke-amber-500';
    return 'fill-rose-500/35 stroke-rose-600 animate-pulse';
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'food_court':
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'restroom':
        return <HelpCircle className="w-4 h-4 text-sky-400" />;
      case 'gate':
        return <DoorOpen className="w-4 h-4 text-emerald-400" />;
      case 'medical':
        return <Activity className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'merchandise':
        return <Zap className="w-4 h-4 text-purple-400" />;
      default:
        return <MapPin className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Titan Stadium Live Blueprint
          </h3>
          <p className="text-xs text-slate-400">Interactive live crowd & utility overlay</p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Markers', icon: <Filter className="w-3 h-3" /> },
            { id: 'gate', label: 'Gates', icon: <DoorOpen className="w-3 h-3" /> },
            { id: 'food_court', label: 'Food', icon: <Utensils className="w-3 h-3" /> },
            { id: 'restroom', label: 'Restrooms', icon: <HelpCircle className="w-3 h-3" /> },
            { id: 'medical', label: 'Medical', icon: <Activity className="w-3 h-3" /> },
            { id: 'merchandise', label: 'Merch Store', icon: <Zap className="w-3 h-3" /> }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setActiveFilter(btn.id)}
              aria-pressed={activeFilter === btn.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                activeFilter === btn.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-755 border border-slate-700/50'
              }`}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative flex-1 min-h-[400px] bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden p-2">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full max-h-[500px] select-none"
          id="stadium-svg-blueprint"
        >
          {/* DEFINITIONS */}
          <defs>
            <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a1e" />
              <stop offset="100%" stopColor="#0f1f10" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* OUTER BACKGROUND SECTOR SHAPES (Crowd Density Heatmap Zones) */}
          {/* Sector North-West (High Density) */}
          <path
            d="M 150 150 A 300 240 0 0 1 650 150 L 550 200 A 200 160 0 0 0 250 200 Z"
            className={`${getDensityColor('high')} stroke-[1.5] transition-all duration-500`}
          />
          {/* Sector North-East (Medium Density) */}
          <path
            d="M 650 150 A 240 300 0 0 1 650 450 L 550 370 A 160 200 0 0 0 550 230 Z"
            className={`${getDensityColor('medium')} stroke-[1.5] transition-all duration-500`}
          />
          {/* Sector South-East (Low Density) */}
          <path
            d="M 650 450 A 300 240 0 0 1 150 450 L 250 400 A 200 160 0 0 0 550 400 Z"
            className={`${getDensityColor('low')} stroke-[1.5] transition-all duration-500`}
          />
          {/* Sector South-West (High Density) */}
          <path
            d="M 150 450 A 240 300 0 0 1 150 150 L 250 230 A 160 200 0 0 0 250 370 Z"
            className={`${getDensityColor('high')} stroke-[1.5] transition-all duration-500`}
          />

          {/* INNER CONCOURSE RING */}
          <ellipse
            cx="400"
            cy="300"
            rx="180"
            ry="120"
            fill="none"
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="8 8"
          />

          {/* PLAYING FIELD */}
          <rect
            x="280"
            y="210"
            width="240"
            height="180"
            rx="12"
            fill="url(#fieldGrad)"
            stroke="#16a34a"
            strokeWidth="3"
          />
          {/* Field Lines */}
          <line x1="400" y1="210" x2="400" y2="390" stroke="#22c55e" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="400" cy="300" r="35" fill="none" stroke="#22c55e" strokeWidth="2" />
          {/* End zones */}
          <rect x="280" y="210" width="20" height="180" fill="#14532d" opacity="0.6" rx="2" />
          <rect x="500" y="210" width="20" height="180" fill="#14532d" opacity="0.6" rx="2" />
          <text x="290" y="305" fill="#22c55e" fontSize="12" fontWeight="bold" textAnchor="middle" transform="rotate(-90 290 305)" opacity="0.8">TITANS</text>
          <text x="510" y="305" fill="#22c55e" fontSize="12" fontWeight="bold" textAnchor="middle" transform="rotate(90 510 305)" opacity="0.8">WILDCATS</text>

          {/* SECTOR LABELS */}
          <text x="400" y="100" fill="#94a3b8" fontSize="14" fontWeight="semibold" textAnchor="middle">NORTH STAND (SECTOR A)</text>
          <text x="710" y="305" fill="#94a3b8" fontSize="14" fontWeight="semibold" textAnchor="middle" transform="rotate(90 710 305)">EAST STAND (SECTOR B/C)</text>
          <text x="400" y="520" fill="#94a3b8" fontSize="14" fontWeight="semibold" textAnchor="middle">SOUTH STAND (SECTOR D/E)</text>
          <text x="90" y="305" fill="#94a3b8" fontSize="14" fontWeight="semibold" textAnchor="middle" transform="rotate(-90 90 305)">WEST STAND (SECTOR F)</text>

          {/* ANIMATED OPTIMIZED ROUTE PATH (if present) */}
          {optimizedRoutePath && (
            <path
              d="M 400 240 Q 300 160 180 200 T 250 380 T 550 400"
              fill="none"
              stroke="#6366f1"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="12 6"
              className="animate-[dash_15s_linear_infinite]"
              filter="url(#glow)"
              style={{
                animation: 'dash 1.5s linear infinite'
              }}
            />
          )}

          {/* INTERACTIVE MARKERS */}
          {filteredLocations.map(loc => {
            const isSelected = selectedLocation?.id === loc.id;
            // Map percentage coordinates (x, y) to SVG scale (0-800, 0-600)
            const mapX = (loc.x / 100) * 800;
            const mapY = (loc.y / 100) * 600;

            return (
              <g
                key={loc.id}
                transform={`translate(${mapX}, ${mapY})`}
                onClick={() => onSelectLocation(loc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLocation(loc);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Stadium location: ${loc.name}. Wait time is ${loc.currentWaitTimeMinutes ?? 0} minutes. Crowd density is ${loc.density}.`}
                className="cursor-pointer group focus:outline-none"
              >
                {/* Marker outer halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? 22 : 16}
                  className={`transition-all duration-300 fill-slate-900 stroke-2 ${
                    isSelected 
                      ? 'stroke-indigo-400 scale-125' 
                      : 'stroke-slate-700 hover:stroke-indigo-500 hover:scale-110 group-focus:stroke-indigo-400 group-focus:scale-110'
                  }`}
                  shadow-sm="true"
                />

                {/* Density micro dot */}
                <circle
                  cx="12"
                  cy="-12"
                  r="5"
                  className={`${
                    loc.density === 'low'
                      ? 'fill-emerald-400'
                      : loc.density === 'medium'
                      ? 'fill-amber-400'
                      : 'fill-rose-500 animate-ping'
                  }`}
                />

                {/* Icon inside marker */}
                <foreignObject
                  x="-8"
                  y="-8"
                  width="16"
                  height="16"
                  className="pointer-events-none"
                >
                  <div className="flex items-center justify-center w-full h-full">
                    {getMarkerIcon(loc.type)}
                  </div>
                </foreignObject>

                {/* Marker label (visible on hover) */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect
                    x="-60"
                    y="-45"
                    width="120"
                    height="24"
                    rx="4"
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="-29"
                    fill="#f1f5f9"
                    fontSize="10"
                    fontWeight="medium"
                    textAnchor="middle"
                  >
                    {loc.name.length > 18 ? loc.name.substring(0, 16) + '..' : loc.name}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Legend Panel overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 shadow-md">
          <p className="font-semibold text-slate-200 mb-1.5 uppercase tracking-wider text-[10px]">Crowd Density Key</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Low Density (Clear pathways)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Moderate (5-10m queue)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>High / Congested (15m+ queue)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Route Guidance Overlay */}
        {optimizedRoutePath && (
          <div className="absolute top-3 right-3 max-w-[240px] bg-indigo-950/95 border border-indigo-800 text-indigo-100 rounded-lg p-3 shadow-lg text-xs animate-fade-in">
            <p className="font-bold flex items-center gap-1.5 text-indigo-200 uppercase tracking-wide text-[10px] mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              Gemini Optimized Route
            </p>
            <p className="font-medium text-slate-200 mb-1.5">{optimizedRoutePath.estimatedMinutes} mins walking duration</p>
            <p className="text-[11px] text-indigo-200 line-clamp-2 italic">"{optimizedRoutePath.instructions[0] || 'Optimizing path...'}"</p>
          </div>
        )}
      </div>

      {/* Styled Inline SVG Path Animation CSS */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}</style>
    </div>
  );
});

export default InteractiveMap;
