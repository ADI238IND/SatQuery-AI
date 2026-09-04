import React, { useState, useEffect, useRef } from 'react';
import type {
  ChatMessage,
  AnalysisMode,
  SingleSceneSubTask,
  ImagerySource,
  BandSelection,
} from '../../lib/types';
import {
  Send,
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  Zap,
  MessageSquare,
  Compass,
  UploadCloud,
  FileCheck,
  X,
  AlertTriangle,
  Satellite,
  Layers,
  Target,
  Palette,
  Check,
  Info,
  SlidersHorizontal,
  FolderUp,
} from 'lucide-react';
import { PairedUploadZone } from './PairedUploadZone';
import { SOURCE_IMAGERY } from '../../lib/mockData';

export interface CustomUploadedScene {
  singleUrl?: string;
  preUrl?: string;
  postUrl?: string;
  fileName: string;
  fileSize: string;
  fileFormat: string;
}

export interface ControlSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, attachedImages?: string[]) => void;
  isStreaming: boolean;
  streamingEnabled: boolean;
  setStreamingEnabled: (s: boolean) => void;
  mode: AnalysisMode;
  setMode: (m: AnalysisMode) => void;
  subTask: SingleSceneSubTask;
  setSubTask: (st: SingleSceneSubTask) => void;
  activeSource: ImagerySource;
  setActiveSource: (src: ImagerySource) => void;
  activeSecondarySource: ImagerySource | null;
  setActiveSecondarySource: (src: ImagerySource | null) => void;
  band: BandSelection;
  setBand: (b: BandSelection) => void;
  customScene: CustomUploadedScene | null;
  setCustomScene: (s: CustomUploadedScene | null) => void;
  error?: string | null;
  beforeFile?: File | null;
  setBeforeFile?: (file: File | null) => void;
  afterFile?: File | null;
  setAfterFile?: (file: File | null) => void;
  beforeUrl?: string | null;
  setBeforeUrl?: (url: string | null) => void;
  afterUrl?: string | null;
  setAfterUrl?: (url: string | null) => void;
}

type FeatureTab = 'source' | 'mode' | 'subtask' | 'band' | 'chat';

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  messages,
  onSendMessage,
  isStreaming,
  streamingEnabled,
  setStreamingEnabled,
  mode,
  setMode,
  subTask,
  setSubTask,
  activeSource,
  setActiveSource,
  activeSecondarySource,
  setActiveSecondarySource,
  band,
  setBand,
  customScene,
  setCustomScene,
  error,
  beforeFile,
  setBeforeFile,
  afterFile,
  setAfterFile,
  beforeUrl,
  setBeforeUrl,
  afterUrl,
  setAfterUrl,
}) => {
  const [activeTab, setActiveTab] = useState<FeatureTab>('chat');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Ensure Fusion mode sets both Optical and SAR simultaneously
  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    if (newMode === 'Fusion') {
      if (activeSource === 'risat') {
        setActiveSource('sentinel2');
      }
      if (!activeSecondarySource) {
        setActiveSecondarySource('risat');
      }
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setCustomScene({
        singleUrl: url,
        preUrl: url,
        postUrl: url,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileFormat: file.name.endsWith('.tif') || file.name.endsWith('.tiff') ? 'GeoTIFF (COG)' : 'Satellite Raster',
      });
    } else if (files.length >= 2) {
      const file1 = files[0];
      const file2 = files[1];
      setCustomScene({
        singleUrl: URL.createObjectURL(file2),
        preUrl: URL.createObjectURL(file1),
        postUrl: URL.createObjectURL(file2),
        fileName: `${file1.name} + ${file2.name}`,
        fileSize: `${((file1.size + file2.size) / (1024 * 1024)).toFixed(1)} MB`,
        fileFormat: 'Paired Temporal Rasters',
      });
    }
    setIsDraggingFile(false);
  };

  const getPromptChips = () => {
    if (customScene || beforeFile || afterFile) {
      return ['Analyze uploaded raster', 'Detect water bodies', 'Assess change boundaries'];
    }
    if (mode === 'Fusion') {
      return ['Penetrate cloud with SAR', 'Cross-sensor flood agreement', 'Coherence loss'];
    }
    if (mode === 'Single Scene VQA') {
      if (subTask === 'Caption scene') {
        return ['Describe landcover morphology', 'Summarize drainage basin'];
      }
      if (subTask === 'Highlight region') {
        return ['Highlight inundation polygons', 'Locate breached embankment'];
      }
      return ['Is bridge pier submerged?', 'Identify sediment plumes'];
    }
    return ['Detect flood boundaries', 'Quantify changed area', 'Assess road severance'];
  };

  const handleChipClick = (prompt: string) => {
    setInputText(prompt);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const getActiveAttachedImages = (): string[] => {
    const imgs: string[] = [];
    if (mode === 'Change Detection') {
      if (beforeUrl || customScene?.preUrl) imgs.push(beforeUrl || customScene?.preUrl!);
      if (afterUrl || customScene?.postUrl) imgs.push(afterUrl || customScene?.postUrl!);
    } else {
      if (customScene?.singleUrl) imgs.push(customScene.singleUrl);
    }
    return imgs;
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const currentImages = getActiveAttachedImages();
    onSendMessage(inputText, currentImages);
    setInputText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper badge text for icons
  const getSourceBadge = () => {
    if (mode === 'Fusion') return 'OPT+SAR';
    if (activeSource === 'sentinel2') return 'S-2';
    if (activeSource === 'landsat') return 'L-9';
    return 'SAR';
  };

  const getModeBadge = () => {
    if (mode === 'Single Scene VQA') return 'VQA';
    if (mode === 'Change Detection') return 'CHG';
    return 'FUS';
  };

  const getSubTaskBadge = () => {
    if (subTask === 'Answer question') return 'VQA';
    if (subTask === 'Caption scene') return 'CAP';
    return 'ROI';
  };

  const getBandBadge = () => {
    if (band === 'RGB True Color') return 'RGB';
    if (band === 'False Color NIR') return 'NIR';
    if (band === 'NDVI') return 'NDVI';
    if (band === 'NDWI') return 'NDWI';
    return 'SAR';
  };

  return (
    <aside className="w-[410px] bg-surface border-r border-border flex h-[calc(100vh-56px)] shrink-0 select-none overflow-hidden font-sans">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".tif,.tiff,.png,.jpg,.jpeg"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* 🚀 LEFT ICON NAVIGATION RAIL (58px) - FEATURE DOCK */}
      {/* ==================================================================== */}
      <div className="w-[58px] bg-[#0b0e14] border-r border-border/80 flex flex-col items-center py-3 gap-3 shrink-0 z-20 shadow-lg">
        {/* Feature 1: Input Imagery Source Selector */}
        <button
          onClick={() => setActiveTab('source')}
          className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
            activeTab === 'source'
              ? 'bg-signal/20 text-signal border border-signal/60 shadow-[0_0_12px_rgba(45,212,201,0.2)]'
              : 'text-text-muted hover:text-text-primary hover:bg-elevated/70 border border-transparent'
          }`}
          title="Input Imagery Source Selector (Sentinel-2, LANDSAT, RISAT SAR)"
        >
          <Satellite className="w-5 h-5" />
          <span className="text-[9px] font-mono font-bold uppercase mt-0.5 tracking-tight text-signal">
            {getSourceBadge()}
          </span>
          <div className="absolute left-[62px] bg-[#141b24] text-text-primary border border-border px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
            Input Imagery Source
          </div>
        </button>

        {/* Feature 2: Mode Selector */}
        <button
          onClick={() => setActiveTab('mode')}
          className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
            activeTab === 'mode'
              ? 'bg-signal/20 text-signal border border-signal/60 shadow-[0_0_12px_rgba(45,212,201,0.2)]'
              : 'text-text-muted hover:text-text-primary hover:bg-elevated/70 border border-transparent'
          }`}
          title="Mode Selector (Single Scene VQA / Change Detection / Fusion)"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[9px] font-mono font-bold uppercase mt-0.5 tracking-tight text-signal">
            {getModeBadge()}
          </span>
          <div className="absolute left-[62px] bg-[#141b24] text-text-primary border border-border px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
            Workflow Mode
          </div>
        </button>

        {/* Feature 3: Single-scene Sub-task Selector */}
        <button
          onClick={() => setActiveTab('subtask')}
          className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
            activeTab === 'subtask'
              ? 'bg-signal/20 text-signal border border-signal/60 shadow-[0_0_12px_rgba(45,212,201,0.2)]'
              : mode === 'Single Scene VQA'
              ? 'text-text-secondary hover:text-text-primary hover:bg-elevated/70 border border-signal/30'
              : 'text-text-muted/50 hover:text-text-muted hover:bg-elevated/40 border border-transparent'
          }`}
          title="Single-scene Sub-task Selector (VQA / Caption / Grounding)"
        >
          <Target className="w-5 h-5" />
          <span className="text-[9px] font-mono font-bold uppercase mt-0.5 tracking-tight text-signal">
            {getSubTaskBadge()}
          </span>
          <div className="absolute left-[62px] bg-[#141b24] text-text-primary border border-border px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
            Single-Scene Sub-Task
          </div>
        </button>

        {/* Feature 4: Band Combination Selector */}
        <button
          onClick={() => setActiveTab('band')}
          className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
            activeTab === 'band'
              ? 'bg-signal/20 text-signal border border-signal/60 shadow-[0_0_12px_rgba(45,212,201,0.2)]'
              : 'text-text-muted hover:text-text-primary hover:bg-elevated/70 border border-transparent'
          }`}
          title="Band Combination Selector (RGB True Color, NIR, NDVI, NDWI, SAR-change)"
        >
          <Palette className="w-5 h-5" />
          <span className="text-[9px] font-mono font-bold uppercase mt-0.5 tracking-tight text-signal">
            {getBandBadge()}
          </span>
          <div className="absolute left-[62px] bg-[#141b24] text-text-primary border border-border px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
            Band Combination
          </div>
        </button>

        <div className="w-6 h-[1px] bg-border/60 my-1" />

        {/* Feature 5: Multimodal Chat & Image Upload (Unified) */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all group ${
            activeTab === 'chat'
              ? 'bg-signal/20 text-signal border border-signal/60 shadow-[0_0_12px_rgba(45,212,201,0.2)]'
              : 'text-text-muted hover:text-text-primary hover:bg-elevated/70 border border-transparent'
          }`}
          title="Multimodal Chat & Local Image Upload Console"
        >
          <MessageSquare className="w-5 h-5 text-signal" />
          <span className="text-[9px] font-mono font-bold uppercase mt-0.5 tracking-tight text-signal">
            CHAT
          </span>
          <div className="absolute left-[62px] bg-[#141b24] text-text-primary border border-border px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl">
            Multimodal Chat & Raster Ingestion
          </div>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 🚀 MAIN SIDEBAR CONTENT BODY */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface overflow-hidden">
        {/* Top Header Strip */}
        <div className="h-11 px-3.5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-signal" />
            <span className="text-xs font-bold text-text-primary font-sans uppercase tracking-wider">
              {activeTab === 'chat'
                ? 'Multimodal Chat & Ingestion Console'
                : 'Modality Configuration'}
            </span>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer hover:text-text-primary">
            <input
              type="checkbox"
              checked={streamingEnabled}
              onChange={(e) => setStreamingEnabled(e.target.checked)}
              className="rounded bg-elevated border-border text-signal focus:ring-0 w-3 h-3"
            />
            <span>Streaming trace</span>
          </label>
        </div>

        {/* ==================================================================== */}
        {/* 🛠️ FEATURE CONFIGURATION DRAWERS (For Source, Mode, Subtask, Band) */}
        {/* ==================================================================== */}
        {activeTab !== 'chat' && (
          <div className="p-3 bg-[#0d131c] border-b border-border space-y-2.5 shrink-0">
            {/* FEATURE 1: INPUT IMAGERY SOURCE SELECTOR */}
            {activeTab === 'source' && (
              <div className="space-y-2 font-sans animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-signal">
                    <Satellite className="w-4 h-4 text-signal" />
                    <span>Input Imagery Source Selector</span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  User picks active sensor imagery; in Fusion mode, both an optical and a SAR source must be picked simultaneously before analysis can run.
                </p>

                {mode === 'Fusion' ? (
                  <div className="p-2.5 rounded-lg bg-[#141d2b] border border-signal/50 space-y-2 font-mono">
                    <div className="flex items-center gap-1.5 text-[11px] text-signal font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Fusion Mode Dual-Sensor Picker</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Optical Slot */}
                      <div className="p-2 rounded bg-surface border border-border space-y-1">
                        <div className="text-[10px] text-text-muted uppercase">1. Optical Source</div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setActiveSource('sentinel2')}
                            className={`px-2 py-1 rounded text-[11px] font-semibold text-left transition-colors flex items-center justify-between ${
                              activeSource === 'sentinel2'
                                ? 'bg-signal text-base'
                                : 'bg-elevated text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <span>Sentinel-2 (10m)</span>
                            {activeSource === 'sentinel2' && <Check className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => setActiveSource('landsat')}
                            className={`px-2 py-1 rounded text-[11px] font-semibold text-left transition-colors flex items-center justify-between ${
                              activeSource === 'landsat'
                                ? 'bg-signal text-base'
                                : 'bg-elevated text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <span>LANDSAT-9 (30m)</span>
                            {activeSource === 'landsat' && <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* SAR Slot */}
                      <div className="p-2 rounded bg-surface border border-border space-y-1">
                        <div className="text-[10px] text-text-muted uppercase">2. SAR Source</div>
                        <button
                          onClick={() => setActiveSecondarySource('risat')}
                          className={`w-full px-2 py-1 rounded text-[11px] font-semibold text-left transition-colors flex items-center justify-between ${
                            activeSecondarySource === 'risat' || activeSource === 'risat'
                              ? 'bg-signal text-base'
                              : 'bg-elevated text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <span>RISAT-1A SAR</span>
                          <Check className="w-3 h-3" />
                        </button>
                        <div className="text-[9px] text-signal font-mono">C-Band Coherence Active</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-signal/90 bg-signal/10 p-1.5 rounded border border-signal/30 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Optical + SAR sources picked simultaneously for cross-modal analysis.</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                    {(['sentinel2', 'landsat', 'risat'] as ImagerySource[]).map((src) => {
                      const meta = SOURCE_IMAGERY[src];
                      const isSelected = activeSource === src;
                      return (
                        <button
                          key={src}
                          onClick={() => setActiveSource(src)}
                          className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-signal/15 border-signal text-signal font-semibold shadow-md'
                              : 'bg-[#151c27] border-border text-text-secondary hover:border-signal/40 hover:text-text-primary'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">{meta.label}</div>
                          <div className="text-[9px] opacity-75 mt-1">{meta.kind.toUpperCase()} • {meta.gsdMeters}m</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FEATURE 2: MODE SELECTOR */}
            {activeTab === 'mode' && (
              <div className="space-y-2 font-sans animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-signal">
                    <Layers className="w-4 h-4 text-signal" />
                    <span>Mode Selector</span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Switches the entire workflow — changes active panels, map tools, and query behavior.
                </p>
                <div className="space-y-1.5 font-mono text-xs">
                  {(['Single Scene VQA', 'Change Detection', 'Fusion'] as AnalysisMode[]).map((m) => {
                    const isSelected = mode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-signal/15 border-signal text-signal font-semibold shadow-md'
                            : 'bg-[#151c27] border-border text-text-secondary hover:border-signal/40 hover:text-text-primary'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold font-sans">{m}</div>
                          <div className="text-[10px] font-mono opacity-75 mt-0.5">
                            {m === 'Single Scene VQA' && 'Analyze a single scene image with natural language VQA'}
                            {m === 'Change Detection' && 'Temporal pre (T0) vs post (T1) flood & disaster comparison'}
                            {m === 'Fusion' && 'Optical reflectance + SAR backscatter cross-modal fusion'}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-signal shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FEATURE 3: SINGLE-SCENE SUB-TASK SELECTOR */}
            {activeTab === 'subtask' && (
              <div className="space-y-2 font-sans animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-signal">
                    <Target className="w-4 h-4 text-signal" />
                    <span>Single-scene Sub-task Selector</span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Within Single Scene mode, tells the system whether the analyst wants a direct answer, a scene description, or a highlighted region.
                </p>
                {mode !== 'Single Scene VQA' && (
                  <div className="text-[10px] text-alert bg-alert/10 p-1.5 rounded border border-alert/30 font-mono">
                    Note: Switch to <b>Single Scene VQA</b> mode for sub-task routing to take effect.
                  </div>
                )}
                <div className="space-y-1.5 font-mono text-xs">
                  {(
                    [
                      { id: 'Answer question', label: 'VQA (Direct Answer)', desc: 'Direct concise response to natural language analyst query' },
                      { id: 'Caption scene', label: 'Caption (Scene Description)', desc: 'Generate landcover morphology and surface summary' },
                      { id: 'Highlight region', label: 'Grounding (Highlight Region)', desc: 'Highlight bounding polygon overlays on map' },
                    ] as Array<{ id: SingleSceneSubTask; label: string; desc: string }>
                  ).map((st) => {
                    const isSelected = subTask === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setSubTask(st.id)}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-signal/15 border-signal text-signal font-semibold shadow-md'
                            : 'bg-[#151c27] border-border text-text-secondary hover:border-signal/40 hover:text-text-primary'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold font-sans">{st.label}</div>
                          <div className="text-[10px] font-mono opacity-75 mt-0.5">{st.desc}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-signal shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FEATURE 4: BAND COMBINATION SELECTOR */}
            {activeTab === 'band' && (
              <div className="space-y-2 font-sans animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-signal">
                    <Palette className="w-4 h-4 text-signal" />
                    <span>Band Combination Selector</span>
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Changes how the raster is <i>displayed</i> on the map — purely visual, keeps display composites separate from model tensors.
                </p>
                <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
                  {(
                    [
                      { id: 'RGB True Color', label: 'RGB True Color', desc: 'Natural color composite (Red, Green, Blue)' },
                      { id: 'False Color NIR', label: 'False Color NIR', desc: 'Infrared vegetation & biomass accentuation' },
                      { id: 'NDVI', label: 'NDVI (Vegetation Index)', desc: 'Normalized Difference Vegetation Index' },
                      { id: 'NDWI', label: 'NDWI (Water Index)', desc: 'Normalized Difference Water Index' },
                      { id: 'SAR-change', label: 'SAR-change / Coherence', desc: 'C-Band radar surface change composite' },
                    ] as Array<{ id: BandSelection; label: string; desc: string }>
                  ).map((b) => {
                    const isSelected = band === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setBand(b.id)}
                        className={`w-full p-2 rounded-lg border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-signal/15 border-signal text-signal font-semibold shadow-md'
                            : 'bg-[#151c27] border-border text-text-secondary hover:border-signal/40 hover:text-text-primary'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold font-sans">{b.label}</div>
                          <div className="text-[10px] font-mono opacity-75">{b.desc}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-signal shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Active Settings Pill Summary (Always visible for quick reference) */}
        <div className="flex items-center justify-between font-mono text-[10px] bg-[#101620] px-3 py-2 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('source')}
              className={`hover:text-signal transition-colors ${activeTab === 'source' ? 'text-signal font-bold' : 'text-text-secondary'}`}
              title="Click to switch active sensor source"
            >
              SRC: <span className="text-signal font-bold">{getSourceBadge()}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('mode')}
              className={`hover:text-signal transition-colors ${activeTab === 'mode' ? 'text-signal font-bold' : 'text-text-secondary'}`}
              title="Click to switch workflow mode"
            >
              MODE: <span className="text-signal font-bold">{getModeBadge()}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('subtask')}
              className={`hover:text-signal transition-colors ${activeTab === 'subtask' ? 'text-signal font-bold' : 'text-text-secondary'}`}
              title="Click to switch sub-task"
            >
              TASK: <span className="text-signal font-bold">{getSubTaskBadge()}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('band')}
              className={`hover:text-signal transition-colors ${activeTab === 'band' ? 'text-signal font-bold' : 'text-text-secondary'}`}
              title="Click to switch band display composite"
            >
              BAND: <span className="text-signal font-bold">{getBandBadge()}</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 📥 FIXED TOP LOCAL IMAGE INGESTION CARD */}
        {/* ==================================================================== */}
        <div className="p-3 bg-[#111823] border-b border-border/80 space-y-2 font-sans shrink-0 z-10 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-signal">
              <FolderUp className="w-3.5 h-3.5 text-signal" />
              <span>Local Image Ingestion</span>
            </div>
            {(beforeFile || afterFile || customScene || beforeUrl || afterUrl) && (
              <button
                onClick={() => {
                  setCustomScene(null);
                  if (setBeforeFile) setBeforeFile(null);
                  if (setAfterFile) setAfterFile(null);
                  if (setBeforeUrl) setBeforeUrl(null);
                  if (setAfterUrl) setAfterUrl(null);
                }}
                className="text-[9px] font-mono text-text-muted hover:text-alert underline cursor-pointer"
              >
                Clear Uploads
              </button>
            )}
          </div>

          {mode === 'Change Detection' ? (
            <PairedUploadZone
              beforeFile={beforeFile || null}
              setBeforeFile={setBeforeFile || (() => {})}
              afterFile={afterFile || null}
              setAfterFile={setAfterFile || (() => {})}
              beforeUrl={beforeUrl || null}
              setBeforeUrl={setBeforeUrl || (() => {})}
              afterUrl={afterUrl || null}
              setAfterUrl={setAfterUrl || (() => {})}
            />
          ) : (
            <div className="space-y-2">
              {!customScene ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded border border-dashed cursor-pointer transition-all text-center ${
                    isDraggingFile
                      ? 'border-signal bg-signal/15 text-signal'
                      : 'border-border-strong hover:border-signal/50 bg-[#171D26]'
                  }`}
                >
                  <UploadCloud className="w-4 h-4 mx-auto text-signal mb-0.5" />
                  <div className="text-[11px] font-semibold text-text-primary font-mono">
                    Click or Drag & Drop <span className="text-signal font-bold">GeoTIFF / Image</span>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded bg-[#171D26] border border-signal/40 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-signal font-semibold">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]" title={customScene.fileName}>
                        {customScene.fileName}
                      </span>
                    </div>
                    <button
                      onClick={() => setCustomScene(null)}
                      className="text-text-muted hover:text-alert p-0.5 rounded cursor-pointer"
                      title="Remove upload"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-muted border-t border-border/40 pt-1">
                    <span>Format: {customScene.fileFormat}</span>
                    <span>Size: {customScene.fileSize}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* 💬 MULTIMODAL CHAT MESSAGE HISTORY STREAM (Scrollable) */}
        {/* ==================================================================== */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0a0e13]/50 font-sans">
          {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
                <Compass className="w-7 h-7 mb-2 opacity-30 text-signal" />
                <p className="text-xs leading-relaxed">
                  Ask about land cover, drawn regions, flood perimeters, or spectral shifts.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-1.5">
                  {msg.sender === 'user' ? (
                    <div className="bg-elevated border border-border rounded p-2.5 text-xs text-text-primary space-y-2">
                      <div className="text-[10px] font-mono text-text-muted mb-1 flex items-center justify-between">
                        <span>ANALYST INQUIRY</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      {msg.attachedImages && msg.attachedImages.length > 0 && (
                        <div className="flex items-center gap-2 py-1 overflow-x-auto">
                          {msg.attachedImages.map((imgUrl, idx) => (
                            <div key={idx} className="relative w-14 h-14 rounded border border-signal/50 overflow-hidden bg-base/80 shrink-0 shadow-md">
                              <img src={imgUrl} alt={`Attached ${idx}`} className="w-full h-full object-cover" />
                              <div className="absolute top-0.5 left-0.5 bg-base/90 text-[7px] font-mono font-bold text-signal px-1 rounded border border-signal/30">
                                {msg.attachedImages!.length > 1 ? (idx === 0 ? 'T0 BEFORE' : 'T1 AFTER') : 'RASTER'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.queryText}</p>
                    </div>
                  ) : (
                    <div className="bg-base border border-border rounded p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-medium text-text-primary">
                          <Sparkles className="w-3.5 h-3.5 text-signal" />
                          <span>Response</span>
                          {msg.payload?.chipLabel && (
                            <span className="bg-elevated text-text-secondary border border-border px-1.5 py-0.2 rounded text-[9px] font-mono uppercase">
                              {msg.payload.chipLabel}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-text-muted">{msg.timestamp}</span>
                      </div>

                      <p className="text-text-primary leading-relaxed text-xs">{msg.payload?.answer}</p>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono">
                        <span className="text-text-muted">
                          Confidence:{' '}
                          <span className="text-signal font-semibold">
                            {(Number(msg.payload?.confidence || 0) * 100).toFixed(1)}%
                          </span>
                        </span>
                        <span className="text-text-secondary">
                          Grounded: {msg.payload?.groundedRegionsCount || 0} regions
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isStreaming && (
              <div className="bg-base border border-border rounded p-3 text-xs space-y-3 animate-pulse">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium text-text-primary">
                    <Sparkles className="w-3.5 h-3.5 text-signal" />
                    <span>Response</span>
                  </div>
                  <span className="font-mono text-[10px] text-text-muted flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-signal" />
                    Processing...
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-border/80 rounded w-3/4"></div>
                  <div className="h-2 bg-border/80 rounded w-full"></div>
                  <div className="h-2 bg-border/80 rounded w-5/6"></div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-alert/10 border border-alert/30 rounded p-3 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-medium text-alert">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Inference Failed</span>
                </div>
                <p className="text-alert/90 leading-relaxed">{error}</p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

        {/* ==================================================================== */}
        {/* 🚀 MULTIMODAL QUERY CONSOLE */}
        {/* ==================================================================== */}
        <div className="p-3.5 bg-[#121924] border-t-2 border-signal/70 shadow-[0_-4px_24px_rgba(0,0,0,0.6)] space-y-2.5 shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-signal flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Multimodal Query Console
              </span>
            </div>
            {isListening && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-alert animate-pulse font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-alert" />
                Listening...
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {getPromptChips().map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-[#172230] hover:bg-signal/15 text-text-secondary hover:text-signal border border-[#233548] hover:border-signal/60 transition-all shadow-sm truncate max-w-[170px]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* 📸 SEARCH BAR ATTACHED IMAGE PREVIEW BOX */}
          {getActiveAttachedImages().length > 0 && (
            <div className="p-2 bg-[#0b0e14] border border-signal/50 rounded-md font-mono text-[10px] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-signal font-bold">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-signal" />
                  <span>ATTACHED RASTER PREVIEW</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomScene(null);
                    if (setBeforeFile) setBeforeFile(null);
                    if (setAfterFile) setAfterFile(null);
                    if (setBeforeUrl) setBeforeUrl(null);
                    if (setAfterUrl) setAfterUrl(null);
                  }}
                  className="text-[9px] text-text-muted hover:text-alert underline cursor-pointer"
                >
                  Detach
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
                {getActiveAttachedImages().map((imgUrl, idx) => (
                  <div key={idx} className="relative shrink-0 w-11 h-11 rounded border border-signal/60 overflow-hidden bg-base shadow-sm">
                    <img src={imgUrl} alt={`Attached ${idx}`} className="w-full h-full object-cover" />
                    <div className="absolute top-0.5 left-0.5 bg-base/90 text-[7px] font-mono font-bold text-signal px-0.5 rounded">
                      {getActiveAttachedImages().length > 1 ? (idx === 0 ? 'T0' : 'T1') : 'RASTER'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative rounded-md bg-[#0A0E13] border border-signal/50 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/25 transition-all shadow-inner">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                isListening
                  ? 'Listening to operator voice... speak clearly...'
                  : customScene
                  ? `Ask questions about "${customScene.fileName}"...`
                  : 'Ask about land cover, flood boundaries, or spectral shifts...'
              }
              className="w-full bg-transparent text-text-primary text-xs p-2.5 rounded-md resize-none outline-none pr-18 placeholder:text-text-muted/80 leading-relaxed font-sans"
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title={isListening ? 'Stop recording' : 'Voice input'}
                  className={`p-1.5 rounded transition-all ${
                    isListening
                      ? 'bg-alert/25 text-alert animate-pulse border border-alert/50'
                      : 'text-text-secondary hover:text-signal hover:bg-surface/50'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isStreaming}
                className="p-1.5 rounded bg-signal text-base font-bold hover:bg-signal/90 disabled:opacity-20 transition-all shadow-md shadow-signal/25"
                title="Submit query"
              >
                <Send className="w-4 h-4 text-base" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
