import React from 'react';
import type { AnalysisPayload, AnalysisMode } from '../../lib/types';
import { ExecutionTrace } from './ExecutionTrace';
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Activity,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface AnalyticsSidebarProps {
  payload: AnalysisPayload;
  mode: AnalysisMode;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const AnalyticsSidebar: React.FC<AnalyticsSidebarProps> = ({
  payload,
  mode,
  collapsed,
  setCollapsed,
}) => {
  const { metrics, histograms } = payload;
  const isCloudHigh = metrics.cloudCoverPct > 15;

  const handleDownloadPng = () => {
    alert('Exporting active raster canvas view as high-resolution PNG.');
  };

  const handleGeneratePdf = () => {
    alert('Generating technical mission dossier with spectral distribution curves and ROI bounding logs.');
  };

  if (collapsed) {
    return (
      <aside className="w-10 bg-surface border-l border-border flex flex-col items-center py-3 select-none shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1 text-text-secondary hover:text-signal mb-4"
          title="Expand Intelligence Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="rotate-90 text-[11px] font-mono uppercase text-text-muted tracking-wider whitespace-nowrap mt-8">
          Inference & Insights
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[380px] bg-surface border-l border-border flex flex-col h-[calc(100vh-56px)] shrink-0 select-none overflow-y-auto">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-border flex items-center justify-between shrink-0 bg-elevated/40">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-signal" />
          <h2 className="text-xs font-semibold text-text-primary">Intelligence & Telemetry Dossier</h2>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 text-text-secondary hover:text-text-primary"
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5 flex-1">
        {/* 1. EXECUTION PIPELINE TRACE & INTELLIGENCE CARD (Points 2, 3, 4, 5) */}
        <div className="bg-elevated border border-border rounded p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-signal" />
              <span className="text-[11px] font-mono uppercase text-text-primary font-semibold">
                Inference Trace
              </span>
              {payload.chipLabel && (
                <span className="bg-signal/20 text-signal border border-signal/40 px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase">
                  {payload.chipLabel}
                </span>
              )}
            </div>
            {/* Confidence Badge (Point 3) */}
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="text-text-muted">Confidence:</span>
              <span className="text-signal font-bold bg-signal/15 px-1.5 py-0.5 rounded border border-signal/30">
                {(Number(payload.confidence || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Warning / Abstention Banner (Point 4) */}
          {payload.warnings && payload.warnings.length > 0 && (
            <div className="p-2.5 rounded bg-thermal/10 border border-thermal/30 text-thermal text-[11px] space-y-1">
              <div className="text-[10px] font-mono uppercase font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-thermal shrink-0" />
                <span>Abstention / Quality Warning</span>
              </div>
              {payload.warnings.map((w, idx) => (
                <p key={idx} className="leading-snug">{w}</p>
              ))}
            </div>
          )}

          {/* 5-Step Execution Trace (Point 2) */}
          {payload.trace && <ExecutionTrace trace={payload.trace} />}

          {/* Analyst Summary (Point 5) */}
          <div className="pt-2 border-t border-border/80 space-y-1">
            <div className="text-[10px] font-mono uppercase text-text-muted">Analyst NL Summary</div>
            <p className="text-xs text-text-primary leading-relaxed bg-base/80 p-2.5 rounded border border-border/80">
              {payload.answer}
            </p>
          </div>

          {/* Spatial Grounding count */}
          <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary pt-1">
            <span>Spatial Grounding Support:</span>
            <span className="text-text-primary font-medium">{payload.groundedRegionsCount} ROI regions</span>
          </div>
        </div>

        {/* 2. SENSOR CROSS-WEIGHT BAR (Point 1 - Only in Fusion mode) */}
        {mode === 'Fusion' && metrics.opticalWeight !== undefined && (
          <div className="bg-elevated border border-border rounded p-3 space-y-2 text-xs font-mono">
            <div className="text-[11px] uppercase text-text-muted flex items-center justify-between">
              <span>Sensor Cross-Weight</span>
              <span className="text-signal text-[10px] font-semibold">Active Fusion Modality</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Optical MSI Index</span>
              <span className="text-signal font-semibold">
                {(metrics.opticalWeight * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">RISAT SAR Backscatter</span>
              <span className="text-water font-semibold">
                {(metrics.sarWeight! * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full bg-border rounded overflow-hidden flex mt-1">
              <div className="bg-signal h-full" style={{ width: `${metrics.opticalWeight * 100}%` }} />
              <div className="bg-water h-full" style={{ width: `${metrics.sarWeight! * 100}%` }} />
            </div>
          </div>
        )}

        {/* 3. CHANGE TELEMETRY CARD */}
        <div className="bg-elevated border border-border rounded p-3 space-y-3">
          <div className="text-[11px] font-mono uppercase text-text-muted flex items-center justify-between">
            <span>Change Telemetry</span>
            <span className="text-signal font-semibold">Verified Surface</span>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
              <span>Stable (0.0)</span>
              <span>Moderate</span>
              <span>Severe (1.0)</span>
            </div>
            <div className="h-2 w-full rounded-sm bg-gradient-to-r from-signal via-thermal to-alert" />
          </div>

          <div className="space-y-2 pt-1 border-t border-border/80">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary">Changed Area</span>
              <span className="text-text-primary font-medium">{metrics.changedAreaKm2} km²</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary">Changed Pixels</span>
              <span className="text-text-primary font-medium">
                {metrics.changedPixels.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary">Cloud Cover</span>
              <div className="flex items-center gap-1.5">
                {isCloudHigh && <AlertTriangle className="w-3.5 h-3.5 text-thermal" />}
                <span className={isCloudHigh ? 'text-thermal font-semibold' : 'text-text-primary'}>
                  {metrics.cloudCoverPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SPECTRAL HISTOGRAM CARD */}
        <div className="bg-elevated border border-border rounded p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase text-text-muted">Spectral Histogram</div>
            <span className="text-[10px] font-mono text-text-secondary">NDVI Density</span>
          </div>

          <div className="h-40 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histograms} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="bin"
                  stroke="#5B6472"
                  fontSize={9}
                  tickLine={false}
                  fontFamily="IBM Plex Mono"
                />
                <YAxis
                  stroke="#5B6472"
                  fontSize={9}
                  tickLine={false}
                  fontFamily="IBM Plex Mono"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171D26',
                    borderColor: '#2E3846',
                    fontSize: '11px',
                    fontFamily: 'IBM Plex Mono',
                    borderRadius: '4px',
                  }}
                  itemStyle={{ color: '#2DD4C9' }}
                />
                <Bar dataKey="probability" radius={[2, 2, 0, 0]}>
                  {histograms.map((_entry, index) => {
                    const colors = ['#2DD4C9', '#2DD4C9', '#4C8DFF', '#F5A623', '#FB7185'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] font-mono text-text-muted flex justify-between pt-1 border-t border-border/80">
            <span>Water / Inundation</span>
            <span>Dense Canopy</span>
          </div>
        </div>
      </div>

      {/* 5. EXPORT CONTROLS */}
      <div className="p-3.5 border-t border-border bg-surface space-y-2 shrink-0">
        <div className="text-[11px] font-mono uppercase text-text-muted mb-1">Export Analysis</div>
        <button
          onClick={handleDownloadPng}
          className="w-full bg-signal text-base font-semibold py-2 px-3 rounded text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Download PNG
        </button>
        <button
          onClick={handleGeneratePdf}
          className="w-full bg-elevated border border-border hover:border-border-strong text-text-primary py-2 px-3 rounded text-xs flex items-center justify-center gap-2"
        >
          <FileText className="w-3.5 h-3.5 text-text-secondary" />
          Generate PDF Report
        </button>
      </div>
    </aside>
  );
};
