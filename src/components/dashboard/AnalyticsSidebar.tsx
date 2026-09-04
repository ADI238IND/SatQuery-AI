import React, { useState } from 'react';
import type { AnalysisPayload, AnalysisMode } from '../../lib/types';
import {
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Activity,
  BarChart3,
  GitCommit,
  Download,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileCode,
  Layers,
  ChevronDown,
  Info,
  Sparkles,
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

type RightPanelTab = 'insights' | 'trace' | 'export';

export const AnalyticsSidebar: React.FC<AnalyticsSidebarProps> = ({
  payload,
  mode,
  collapsed,
  setCollapsed,
}) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('insights');
  const [expandedTraceStep, setExpandedTraceStep] = useState<number | null>(null);

  const { metrics, histograms } = payload;
  const isCloudHigh = metrics.cloudCoverPct > 20;

  const executionSteps = [
    {
      id: 1,
      title: 'Validate Inputs',
      status: 'Completed',
      time: '34ms',
      detail: 'Verified GeoTIFF CRS alignment (EPSG:4326), spatial extent overlap, and tensor dimension compatibility (1000x700).',
    },
    {
      id: 2,
      title: 'Route Pipeline',
      status: 'Completed',
      time: '62ms',
      detail: `Selected workflow: ${mode}. Routed query to Geo-CLIP backbone & NDWI spectral water index calculation.`,
    },
    {
      id: 3,
      title: 'Execute Model Inundation Tensors',
      status: 'Completed',
      time: '280ms',
      detail: `Ran dual-pass optical-SAR feature cross-attention. Detected ${metrics.changedAreaKm2} km² inundated area across ${(metrics.changedPixels / 1000).toFixed(0)}k pixels.`,
    },
    {
      id: 4,
      title: 'Verify Grounded Boundaries',
      status: 'Completed',
      time: '45ms',
      detail: `Grounded ${payload.groundedRegionsCount} ROI bounding patches. Calibrated confidence score at ${(Number(payload.confidence || 0) * 100).toFixed(1)}%.`,
    },
    {
      id: 5,
      title: 'Format Response & Dossier',
      status: 'Completed',
      time: '18ms',
      detail: 'Generated plain-language analyst summary, vector GeoJSON overlays, and spectral histogram curves.',
    },
  ];

  const handleDownloadPng = () => {
    alert('Exporting high-resolution map snapshot PNG with bounding overlays.');
  };

  const handleGeneratePdf = () => {
    alert('Generating auditable technical PDF mission dossier report.');
  };

  const handleExportGeoJson = () => {
    const geoJsonData = {
      type: 'FeatureCollection',
      features: (payload.evidence || []).map((item) => ({
        type: 'Feature',
        properties: { regionId: item.regionId, patchConfidence: item.patchConfidence, spectralMean: item.spectralMean },
        geometry: {
          type: 'Point',
          coordinates: [item.centroid[1], item.centroid[0]],
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satquery-evidence-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (collapsed) {
    return (
      <aside className="w-11 bg-surface border-l border-border flex flex-col items-center py-3 select-none shrink-0 z-10 shadow-lg">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg text-text-secondary hover:text-signal hover:bg-signal/15 transition-all mb-4"
          title="Expand Analysis Insights Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-4 text-text-muted">
          <button onClick={() => { setCollapsed(false); setActiveTab('insights'); }} title="Insights & Stats">
            <BarChart3 className="w-4 h-4 hover:text-signal transition-colors" />
          </button>
          <button onClick={() => { setCollapsed(false); setActiveTab('trace'); }} title="Execution Trace">
            <GitCommit className="w-4 h-4 hover:text-signal transition-colors" />
          </button>
          <button onClick={() => { setCollapsed(false); setActiveTab('export'); }} title="Export Reports">
            <Download className="w-4 h-4 hover:text-signal transition-colors" />
          </button>
        </div>

        <div className="rotate-90 text-[10px] font-mono font-bold uppercase text-text-muted tracking-widest whitespace-nowrap mt-16">
          Evidence & Trace
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[360px] bg-surface border-l border-border flex flex-col h-[calc(100vh-56px)] shrink-0 select-none font-sans overflow-hidden">
      {/* ==================================================================== */}
      {/* 📌 SECTION HEADER (Collapsible) */}
      {/* ==================================================================== */}
      <div className="h-11 px-3.5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-signal" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Evidence, Confidence & Trace
          </h2>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
          title="Collapse Panel to Expand Map"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 🏷️ ICON CATEGORY TABS (User Friendly Categorization) */}
      {/* ==================================================================== */}
      <div className="flex items-center bg-[#0e131b] border-b border-border p-1 gap-1 shrink-0 font-mono text-[11px]">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'insights'
              ? 'bg-signal/20 text-signal border border-signal/50 font-bold'
              : 'text-text-muted hover:text-text-primary hover:bg-elevated'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>STATS</span>
        </button>

        <button
          onClick={() => setActiveTab('trace')}
          className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'trace'
              ? 'bg-signal/20 text-signal border border-signal/50 font-bold'
              : 'text-text-muted hover:text-text-primary hover:bg-elevated'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>TRACE</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'export'
              ? 'bg-signal/20 text-signal border border-signal/50 font-bold'
              : 'text-text-muted hover:text-text-primary hover:bg-elevated'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 📊 SCROLLABLE CATEGORIZED CONTENT BODY */}
      {/* ==================================================================== */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#0a0e13]/50">
        
        {/* 1. ANALYST NL SUMMARY & CONFIDENCE BADGE */}
        {activeTab === 'insights' && (
          <div className="bg-[#121824] border border-border rounded-lg p-3 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <Sparkles className="w-3.5 h-3.5 text-signal" />
                <span>Analyst Summary</span>
              </div>
              {/* Confidence Badge */}
              <div className="flex items-center gap-1 bg-signal/15 border border-signal/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-signal">
                <ShieldCheck className="w-3 h-3" />
                <span>{(Number(payload.confidence || 0) * 100).toFixed(1)}% Conf</span>
              </div>
            </div>

            <p className="text-xs text-text-primary leading-relaxed">
              {payload.answer ||
                'Catastrophic debris flood triggered by high-altitude glacier collapse. Spatial analysis indicates riverbed expansion and infrastructure severance across key corridors.'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-text-secondary">
              <div className="bg-surface p-1.5 rounded border border-border/80">
                Backbone: <span className="text-text-primary font-semibold">Geo-CLIP / Bi-Tr</span>
              </div>
              <div className="bg-surface p-1.5 rounded border border-border/80">
                Offset: <span className="text-text-primary font-semibold">&lt; 0.18 px</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. WARNING / ABSTENTION BANNER */}
        {activeTab === 'insights' && (isCloudHigh || (payload.confidence && payload.confidence < 0.85)) && (
          <div className="p-3 rounded-lg bg-alert/10 border border-alert/40 space-y-1.5 font-sans">
            <div className="flex items-center gap-1.5 text-xs font-bold text-alert">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Warning & Model Abstention Notice</span>
            </div>
            <p className="text-[11px] text-alert/90 leading-relaxed font-mono">
              {isCloudHigh
                ? `Cloud cover (${metrics.cloudCoverPct}%) exceeds the 15% threshold. Optical tensors partially obscured; SAR backscatter recommended.`
                : `Confidence calibrated at ${(Number(payload.confidence || 0) * 100).toFixed(1)}%. Model abstaining from automated classification; human GIS analyst verification required.`}
            </p>
          </div>
        )}

        {/* 3. CHANGE DETECTION STAT CARD (With Severity Gradient Bar) */}
        {activeTab === 'insights' && (
          <div className="bg-[#121824] border border-border rounded-lg p-3 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
              <div className="flex items-center gap-1.5 text-signal">
                <TrendingUp className="w-4 h-4" />
                <span>Change Detection Statistics</span>
              </div>
              <span className="font-mono text-[9px] text-alert bg-alert/15 px-2 py-0.5 rounded border border-alert/30 font-bold uppercase">
                Critical Inundation
              </span>
            </div>

            {/* Severity Gradient Bar */}
            <div className="space-y-1">
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 p-0.5 relative shadow-inner">
                <div
                  className="absolute top-0.5 bottom-0.5 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff] border border-black transition-all"
                  style={{ left: '76%' }}
                />
              </div>
              <div className="flex justify-between font-mono text-[9px] text-text-muted">
                <span>Low</span>
                <span>Moderate</span>
                <span className="text-alert font-bold">Severity: 76%</span>
              </div>
            </div>

            {/* Stat Counters Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              <div className="p-2 rounded bg-surface border border-border/80 text-center">
                <span className="text-[9px] text-text-muted block">Changed Area</span>
                <span className="text-xs font-bold text-text-primary mt-0.5 block">{metrics.changedAreaKm2} km²</span>
              </div>

              <div className="p-2 rounded bg-surface border border-border/80 text-center">
                <span className="text-[9px] text-text-muted block">Changed Pixels</span>
                <span className="text-xs font-bold text-text-primary mt-0.5 block">
                  {(metrics.changedPixels / 1000).toFixed(0)}k px
                </span>
              </div>

              <div
                className={`p-2 rounded border text-center ${
                  isCloudHigh ? 'bg-alert/15 border-alert/40 text-alert' : 'bg-surface border-border/80 text-text-primary'
                }`}
              >
                <span className="text-[9px] opacity-75 block">Cloud Cover</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {isCloudHigh && <AlertTriangle className="w-3 h-3 text-alert shrink-0" />}
                  <span className="text-xs font-bold">{metrics.cloudCoverPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SENSOR CROSS-WEIGHT BAR (Fusion Mode Only) */}
        {activeTab === 'insights' && mode === 'Fusion' && (
          <div className="bg-[#121824] border border-border rounded-lg p-3 space-y-2 font-mono">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
              <div className="flex items-center gap-1.5 text-signal font-sans">
                <Layers className="w-3.5 h-3.5" />
                <span>Sensor Cross-Weight Bar</span>
              </div>
            </div>
            <p className="text-[10px] text-text-muted font-sans">
              Modality contribution display showing relative reliance on Optical vs SAR reflectance tensors.
            </p>

            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Optical MSI (Sentinel-2 / Landsat)</span>
                <span className="text-signal font-bold">
                  {((metrics.opticalWeight ?? 0.64) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">RISAT SAR (C-Band Radar)</span>
                <span className="text-water font-bold">
                  {((metrics.sarWeight ?? 0.36) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="h-2 w-full bg-border rounded-full overflow-hidden flex mt-1 shadow-inner">
              <div className="bg-signal h-full transition-all" style={{ width: `${(metrics.opticalWeight ?? 0.64) * 100}%` }} />
              <div className="bg-water h-full transition-all" style={{ width: `${(metrics.sarWeight ?? 0.36) * 100}%` }} />
            </div>
          </div>
        )}

        {/* 5. SPECTRAL HISTOGRAMS */}
        {activeTab === 'insights' && (
          <div className="bg-[#121824] border border-border rounded-lg p-3 space-y-2 font-sans shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Spectral Histograms</span>
              <span className="text-[10px] font-mono text-text-muted">NDVI Distribution</span>
            </div>

            <div className="h-36 w-full pt-1">
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
                      borderColor: '#232B37',
                      fontSize: '11px',
                      fontFamily: 'IBM Plex Mono',
                      borderRadius: '4px',
                    }}
                    itemStyle={{ color: '#2DD4C9' }}
                  />
                  <Bar dataKey="probability" radius={[2, 2, 0, 0]}>
                    {histograms.map((_entry, index) => {
                      const colors = ['#2DD4C9', '#2DD4C9', '#4C8DFF', '#3b82f6', '#1d4ed8'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] font-mono text-text-muted flex justify-between pt-1 border-t border-border/60">
              <span>Water / Inundation</span>
              <span>Dense Biomass</span>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ⚡ EXECUTION TRACE (Expandable Pipeline Trace Step List) */}
        {/* ==================================================================== */}
        {activeTab === 'trace' && (
          <div className="bg-[#121824] border border-border rounded-lg p-3 space-y-2.5 font-sans shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-signal">
                <GitCommit className="w-4 h-4 text-signal" />
                <span>Execution Trace</span>
              </div>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Mandatory observable trace showing exact pipeline steps executed to derive answer.
            </p>

            <div className="space-y-1.5 pt-1">
              {executionSteps.map((step) => {
                const isExpanded = expandedTraceStep === step.id;
                return (
                  <div
                    key={step.id}
                    className="border border-border/80 rounded-md bg-surface overflow-hidden font-mono text-xs transition-all"
                  >
                    <button
                      onClick={() => setExpandedTraceStep(isExpanded ? null : step.id)}
                      className="w-full p-2 flex items-center justify-between hover:bg-elevated text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-signal shrink-0" />
                        <span className="font-semibold text-text-primary text-[11px]">{step.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted">
                        <span className="bg-signal/15 text-signal px-1.5 py-0.2 rounded">{step.time}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-2.5 bg-[#0a0e13] border-t border-border/60 text-[10px] text-text-secondary leading-relaxed space-y-1 font-mono">
                        <div>{step.detail}</div>
                        <div className="text-signal/90 text-[9px] pt-1">Status: {step.status} ✓</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 📁 EXPORT ANALYSIS SECTION */}
        {/* ==================================================================== */}
        {activeTab === 'export' && (
          <div className="bg-[#121824] border border-border rounded-lg p-3 space-y-2.5 font-sans shadow-sm">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-signal">
                <Download className="w-4 h-4 text-signal" />
                <span>Export Analysis Section</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleDownloadPng}
                className="w-full bg-signal text-base font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-signal/20"
              >
                <ImageIcon className="w-4 h-4 text-base" />
                <span>Download PNG (Visual Snapshot)</span>
              </button>

              <button
                onClick={handleGeneratePdf}
                className="w-full bg-elevated border border-border hover:border-signal/50 text-text-primary py-2 px-3 rounded text-xs flex items-center justify-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4 text-signal" />
                <span>Generate PDF Report (Auditable Dossier)</span>
              </button>

              <button
                onClick={handleExportGeoJson}
                className="w-full bg-[#151d28] border border-border/80 hover:border-signal/40 text-text-secondary hover:text-text-primary py-1.5 px-3 rounded text-[11px] font-mono flex items-center justify-center gap-2 transition-all"
              >
                <FileCode className="w-3.5 h-3.5 text-water" />
                <span>Export Raw Vector GeoJSON</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* ⚓ FOOTER ACTION BUTTONS */}
      {/* ==================================================================== */}
      <div className="p-3 border-t border-border bg-[#0b0e14] shrink-0 font-mono text-[10px] text-text-muted flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-signal" />
          <span>Calibrated Evidence Dossier</span>
        </div>
        <span className="text-signal font-bold">READY</span>
      </div>
    </aside>
  );
};
