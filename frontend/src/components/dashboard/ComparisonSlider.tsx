import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { SyntheticSatelliteRaster } from './SyntheticSatelliteRaster';
import type { ImagerySource, BandSelection } from '../../lib/types';

interface ComparisonSliderProps {
  source: ImagerySource;
  band: BandSelection;
  preDateLabel: string;
  postDateLabel: string;
  sliderPos: number;
  setSliderPos: (val: number) => void;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  source,
  band,
  preDateLabel,
  postDateLabel,
  sliderPos,
  setSliderPos,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = () => setIsDragging(true);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPos(percentage);
    },
    [isDragging, setSliderPos]
  );

  const handlePointerUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-full h-full select-none overflow-hidden touch-none"
    >
      {/* Background: Post-Event Raster for active source */}
      <div className="absolute inset-0 w-full h-full">
        <SyntheticSatelliteRaster variant="after" source={source} band={band} />
      </div>

      {/* Foreground: Pre-Event Raster clipped by slider handle */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
      >
        <SyntheticSatelliteRaster variant="before" source={source} band={band} />
      </div>

      {/* Draggable Divider Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-signal cursor-ew-resize transition-all"
        style={{ left: `${sliderPos}%` }}
        onPointerDown={handlePointerDown}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-surface border border-signal rounded px-1.5 py-1 flex items-center gap-1 shadow-2xl">
          <ChevronsLeftRight className="w-3.5 h-3.5 text-signal" />
        </div>
      </div>

      {/* Temporal Labels */}
      <div className="absolute top-3 left-3 bg-surface/90 border border-border px-2 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-sm pointer-events-none">
        <span className="text-text-muted mr-1.5">BEFORE:</span>
        <span>{preDateLabel}</span>
      </div>
      <div className="absolute top-3 right-3 bg-surface/90 border border-border px-2 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-sm pointer-events-none">
        <span className="text-text-muted mr-1.5">AFTER:</span>
        <span>{postDateLabel}</span>
      </div>
    </div>
  );
};
