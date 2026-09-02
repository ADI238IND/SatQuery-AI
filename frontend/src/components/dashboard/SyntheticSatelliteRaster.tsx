import React from 'react';
import type { ImagerySource, BandSelection } from '../../lib/types';

interface SyntheticSatelliteRasterProps {
  variant: 'before' | 'after' | 'fusion';
  source: ImagerySource;
  band?: BandSelection;
  label?: string;
  className?: string;
}

export const SyntheticSatelliteRaster: React.FC<SyntheticSatelliteRasterProps> = ({
  variant,
  source,
  band = 'RGB True Color',
  label,
  className = '',
}) => {
  const isPost = variant === 'after';
  const isFusion = variant === 'fusion';
  const isSar = source === 'risat' || isFusion;
  const isLandsat = source === 'landsat';
  const isSentinel = source === 'sentinel2';

  const isNir = band === 'False Color NIR';
  const isNdvi = band === 'NDVI';

  // 1. Color palettes for different sensors
  let baseTerrain = '#1a3324'; // Sentinel-2 optical green
  let mountainColor = '#2b3a32';
  let riverColor = isPost ? '#6b5335' : '#1e385b'; // Silt flood vs deep water
  let floodColor = '#524028';

  if (isLandsat) {
    // Landsat 9 OLI-2: wider regional perspective, slightly deeper forest tones
    baseTerrain = isNdvi ? '#143d1a' : isNir ? '#701a1a' : '#1b2f2b';
    mountainColor = isNir ? '#881313' : '#283633';
    riverColor = isPost ? '#5c482d' : '#19334f';
    floodColor = '#4a3721';
  } else if (isSar && !isFusion) {
    // RISAT-1A SAR C-Band: Grayscale Radar Backscatter (Gamma0 in dB)
    // SAR has high layover highlights on ridge slopes and dark specular water absorption
    baseTerrain = '#1b2129';
    mountainColor = '#4b5563'; // Bright foreshortening radar return
    riverColor = '#0b0f14';    // Specular flat water surface reflects signal away (dark)
    floodColor = '#1e2631';
  } else if (isFusion) {
    // Fusion: Dual-pol SAR texture blended over Optical NIR/RGB
    baseTerrain = '#1e3328';
    mountainColor = '#3f4f46';
    riverColor = '#3e4f63';
    floodColor = '#504434';
  } else if (isNir) {
    baseTerrain = '#7f1d1d';
    mountainColor = '#991b1b';
    floodColor = '#451a1a';
  } else if (isNdvi) {
    baseTerrain = '#166534';
    mountainColor = '#14532d';
    floodColor = '#365314';
  }

  return (
    <div className={`relative w-full h-full bg-[#080d12] overflow-hidden select-none ${className}`}>
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radar Speckle Pattern (only for SAR and Fusion) */}
          {isSar && (
            <pattern id={`sar-speckle-${source}-${variant}`} width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill={baseTerrain} />
              <circle cx="5" cy="5" r="1.2" fill="#94a3b8" opacity="0.35" />
              <circle cx="18" cy="12" r="0.9" fill="#e2e8f0" opacity="0.45" />
              <circle cx="12" cy="24" r="1.4" fill="#0f172a" opacity="0.6" />
              <circle cx="26" cy="22" r="1.0" fill="#64748b" opacity="0.3" />
            </pattern>
          )}

          {/* Graticule Grid Ticks */}
          <pattern id="grid-ticks-pattern" width="125" height="125" patternUnits="userSpaceOnUse">
            <path d="M 125 0 L 0 0 0 125" fill="none" stroke="#2dd4c9" strokeWidth="0.5" strokeOpacity="0.12" />
          </pattern>
        </defs>

        {/* Base Terrain Fill */}
        <rect
          width="1000"
          height="700"
          fill={isSar && !isFusion ? `url(#sar-speckle-${source}-${variant})` : baseTerrain}
        />

        {/* Topography: Mountain Ridges */}
        <path
          d="M0,0 L430,0 L370,170 L220,310 L0,390 Z"
          fill={mountainColor}
          opacity={isSar ? 0.9 : 0.85}
        />
        <path
          d="M610,0 L1000,0 L1000,470 L820,330 L700,180 Z"
          fill={mountainColor}
          opacity={isSar ? 0.85 : 0.8}
        />
        <path
          d="M0,530 L320,430 L470,700 L0,700 Z"
          fill={mountainColor}
          opacity={isSar ? 0.9 : 0.75}
        />
        <path
          d="M670,520 L1000,420 L1000,700 L580,700 Z"
          fill={mountainColor}
          opacity={isSar ? 0.85 : 0.85}
        />

        {/* SAR Layover Radar Bright Facets (only on SAR sensors) */}
        {isSar && (
          <g opacity="0.65">
            <path d="M370,170 L430,0 L410,0 L350,165 Z" fill="#e2e8f0" />
            <path d="M820,330 L1000,470 L980,480 L805,340 Z" fill="#e2e8f0" />
            <path d="M320,430 L470,700 L455,700 L305,435 Z" fill="#e2e8f0" />
          </g>
        )}

        {/* Inundated Silt Floodplain (Visible in Post-Event and Change mode) */}
        {isPost && (
          <path
            d="M340,110 Q490,260 520,380 T480,590 T430,700 L580,700 Q620,560 590,390 T540,190 T430,0 L320,0 Z"
            fill={floodColor}
            opacity={isSar ? "0.75" : "0.92"}
          />
        )}

        {/* Main River Channel Corridor */}
        <path
          d={
            isPost
              ? "M380,0 Q470,180 500,320 T520,510 T460,700 L540,700 Q600,520 560,330 T510,160 T430,0 Z"
              : "M400,0 Q450,180 470,320 T480,510 T450,700 L490,700 Q520,510 510,320 T480,180 T440,0 Z"
          }
          fill={riverColor}
        />

        {/* Optical Vegetation Patches (Hidden in SAR mode) */}
        {!isSar && (
          <g opacity="0.7">
            <rect x="220" y="240" width="55" height="40" fill={isNdvi ? "#22c55e" : isNir ? "#ef4444" : "#4d7c0f"} />
            <rect x="280" y="260" width="45" height="35" fill={isNdvi ? "#16a34a" : isNir ? "#dc2626" : "#3f6212"} />
            <rect x="690" y="260" width="60" height="50" fill={isNdvi ? "#22c55e" : isNir ? "#ef4444" : "#4d7c0f"} />
            <rect x="740" y="320" width="50" height="40" fill={isNdvi ? "#15803d" : isNir ? "#b91c1c" : "#365314"} />
          </g>
        )}

        {/* Coordinate Grid Graticules */}
        <rect width="1000" height="700" fill="url(#grid-ticks-pattern)" pointerEvents="none" />

        {/* Telemetry Overlays on Canvas */}
        <text x="18" y="28" fill="#2dd4c9" opacity="0.8" fontSize="11" fontFamily="IBM Plex Mono">
          {source.toUpperCase()} // 30°24'12"N 79°28'44"E
        </text>
        <text x="18" y="685" fill="#8b95a6" opacity="0.7" fontSize="10" fontFamily="IBM Plex Mono">
          {isSar
            ? 'SENSOR: RISAT-1A C-BAND SAR // POL: RH-RV // GAMMA0 BACKSCATTER'
            : isLandsat
            ? 'SENSOR: LANDSAT-9 OLI-2 // 30m MULTISPECTRAL // BOA REFLECTANCE'
            : 'SENSOR: SENTINEL-2B MSI // 10m VNIR // L2A ORTHORECTIFIED'}
        </text>
      </svg>

      {/* Label Badge */}
      {label && (
        <div className="absolute bottom-3 right-3 bg-surface/90 border border-border px-2 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-sm pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
};
