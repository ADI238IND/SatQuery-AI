import React, { useState, useEffect, useRef } from 'react';
import type {
  ImagerySource,
  OpticalSource,
  AnalysisMode,
  SingleSceneSubTask,
  BandSelection,
  ChatMessage,
  CompatibilityCheck,
} from '../../lib/types';
import { SOURCE_IMAGERY } from '../../lib/mockData';
import { CompatibilityChecklist } from './CompatibilityChecklist';
import {
  Send,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Radio,
  Mic,
  MicOff,
  Zap,
  MessageSquare,
  UploadCloud,
  FileCheck,
  X,
} from 'lucide-react';

export interface CustomUploadedScene {
  singleUrl?: string;
  preUrl?: string;
  postUrl?: string;
  fileName: string;
  fileSize: string;
  fileFormat: string;
}

export interface ControlSidebarProps {
  activeSource: ImagerySource;
  setActiveSource: (s: ImagerySource) => void;
  activeSecondarySource: ImagerySource | null;
  setActiveSecondarySource: (s: ImagerySource | null) => void;
  mode: AnalysisMode;
  setMode: (m: AnalysisMode) => void;
  subTask: SingleSceneSubTask;
  setSubTask: (st: SingleSceneSubTask) => void;
  band: BandSelection;
  setBand: (b: BandSelection) => void;
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isStreaming: boolean;
  streamingEnabled: boolean;
  setStreamingEnabled: (s: boolean) => void;
  compatibilityChecks: CompatibilityCheck[];
  customScene: CustomUploadedScene | null;
  setCustomScene: (s: CustomUploadedScene | null) => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  activeSource,
  setActiveSource,
  activeSecondarySource,
  setActiveSecondarySource,
  mode,
  setMode,
  subTask,
  setSubTask,
  band,
  setBand,
  messages,
  onSendMessage,
  isStreaming,
  streamingEnabled,
  setStreamingEnabled,
  compatibilityChecks,
  customScene,
  setCustomScene,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Handle Drag and Drop Uploads (§3.2)
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
        fileFormat: file.name.endsWith('.tif') || file.name.endsWith('.tiff') ? 'GeoTIFF (COG)' : 'Benchmark Raster',
      });
    } else if (files.length >= 2) {
      const file1 = files[0];
      const file2 = files[1];
      setCustomScene({
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
    if (customScene) {
      return ['Analyze uploaded scene', 'Detect water bodies in custom image', 'Assess boundary changes'];
    }
    if (mode === 'Fusion') {
      return ['Penetrate cloud with SAR', 'Cross-sensor flood agreement', 'Coherence loss mapping'];
    }
    if (mode === 'Single Scene VQA') {
      if (subTask === 'Caption scene') {
        return ['Describe terrain & landcover', 'Summarize geomorphology', 'Catalog structures'];
      }
      if (subTask === 'Highlight region') {
        return ['Highlight flooded polygons', 'Ground submerged road network', 'Isolate breached embankment'];
      }
      return ['Is bridge pier submerged?', 'Identify sediment plumes', 'Assess bank slope stability'];
    }
    return ['Detect water bodies', 'Quantify flooded area', 'Road severance impact', 'Vegetation loss perimeter'];
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

  const isFusionMode = mode === 'Fusion';
  const isFusionValid = !isFusionMode || (activeSource !== 'risat' && activeSecondarySource === 'risat') || customScene !== null;
  const criticalChecksPassed = compatibilityChecks.every((c) => !c.critical || c.status !== 'fail');
  const canSubmit = isFusionValid && criticalChecksPassed && inputText.trim().length > 0 && !isStreaming;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const opticalSources: OpticalSource[] = ['sentinel2', 'landsat'];
  const modeOptions: AnalysisMode[] = ['Single Scene VQA', 'Change Detection', 'Fusion'];
  const subTaskOptions: SingleSceneSubTask[] = ['Answer question', 'Caption scene', 'Highlight region'];
  const bandOptions: BandSelection[] = ['RGB True Color', 'False Color NIR', 'NDVI'];

  return (
    <aside className="w-[380px] bg-surface border-r border-border flex flex-col h-[calc(100vh-56px)] shrink-0 select-none">
      {/* Top Controls */}
      <div className="p-3 border-b border-border space-y-2.5 shrink-0 overflow-y-auto max-h-[340px]">
        {/* Input Imagery Source Header & Prominent Upload Button */}
        <div>
          <div className="text-[11px] font-mono uppercase text-text-muted mb-2 flex items-center justify-between">
            <span className="font-semibold text-text-secondary">
              {customScene ? 'Custom Loaded Scene' : isFusionMode ? 'Fusion Modalities' : 'Input Imagery Source'}
            </span>

            {/* Highly Noticeable Upload Button */}
            <button
              onClick={() => setShowUploadZone(!showUploadZone)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm ${
                showUploadZone
                  ? 'bg-alert/20 text-alert border border-alert/50'
                  : 'bg-signal/15 hover:bg-signal/25 text-signal border border-signal/40 hover:border-signal'
              }`}
              title="Upload your own GeoTIFF or Satellite Benchmark"
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>{showUploadZone ? 'Close Dropzone' : 'Upload Scene'}</span>
            </button>
          </div>

          {/* Drag & Drop Upload Zone */}
          {showUploadZone && (
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
              className={`p-3.5 rounded-lg border-2 border-dashed cursor-pointer transition-all text-center mb-2.5 ${
                isDraggingFile
                  ? 'border-signal bg-signal/15 text-signal scale-[0.99]'
                  : 'border-signal/40 hover:border-signal bg-[#121820]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".tif,.tiff,.png,.jpg,.jpeg"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <div className="w-8 h-8 rounded-full bg-signal/15 border border-signal/30 flex items-center justify-center mx-auto mb-1.5 text-signal">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-text-primary">
                Drag & Drop <span className="text-signal">GeoTIFF / PNG / JPEG</span>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                Click to browse or drop single / paired rasters
              </p>
            </div>
          )}

          {/* Active Uploaded File Tag */}
          {customScene ? (
            <div className="p-2.5 rounded bg-signal/10 border border-signal/40 flex items-center justify-between font-mono text-xs text-text-primary mb-1">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <FileCheck className="w-4 h-4 text-signal shrink-0" />
                <div className="truncate">
                  <div className="truncate font-semibold text-signal text-[11px]">{customScene.fileName}</div>
                  <div className="text-[10px] text-text-muted">{customScene.fileFormat} • {customScene.fileSize}</div>
                </div>
              </div>
              <button
                onClick={() => setCustomScene(null)}
                className="p-1 text-text-muted hover:text-alert"
                title="Remove custom scene"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !isFusionMode ? (
            <div className="grid grid-cols-3 gap-1.5">
              {(['sentinel2', 'landsat', 'risat'] as ImagerySource[]).map((src) => {
                const meta = SOURCE_IMAGERY[src];
                const isActive = activeSource === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveSource(src)}
                    className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors text-center truncate ${
                      isActive
                        ? src === 'risat'
                          ? 'bg-water/20 border-water text-water font-semibold'
                          : 'bg-signal/15 border-signal text-signal font-semibold'
                        : 'bg-elevated border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1 bg-base/60 p-2 rounded border border-border">
              <div>
                <div className="text-[10px] font-mono text-text-muted mb-1">1. OPTICAL SCENE</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {opticalSources.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setActiveSource(opt)}
                      className={`py-1 px-2 text-xs rounded border text-center ${
                        activeSource === opt
                          ? 'bg-signal/15 border-signal text-signal font-medium'
                          : 'bg-elevated border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {SOURCE_IMAGERY[opt].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-text-muted mb-1">2. SAR SCENE (COHERENT)</div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSecondarySource(activeSecondarySource ? null : 'risat')
                  }
                  className={`w-full py-1 px-2 text-xs rounded border flex items-center justify-center gap-1.5 ${
                    activeSecondarySource === 'risat'
                      ? 'bg-water/20 border-water text-water font-medium'
                      : 'bg-elevated border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{SOURCE_IMAGERY.risat.label} (C-Band)</span>
                </button>
              </div>
            </div>
          )}

          {isFusionMode && !isFusionValid && !customScene && (
            <div className="mt-1.5 p-1.5 rounded bg-thermal/10 border border-thermal/30 text-thermal text-[10px] flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Select both Optical + SAR scenes to run fusion.</span>
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div>
          <div className="text-[11px] font-mono uppercase text-text-muted mb-1">Mode Selector</div>
          <div className="grid grid-cols-3 gap-1">
            {modeOptions.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`py-1 px-1 text-[11px] font-medium rounded border text-center truncate ${
                  mode === m
                    ? 'bg-signal/15 border-signal text-signal font-semibold'
                    : 'bg-elevated border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Task Tabs */}
        {mode === 'Single Scene VQA' && (
          <div className="p-1.5 bg-base border border-border rounded space-y-1">
            <div className="text-[10px] font-mono uppercase text-text-muted">Single-Scene Sub-Task</div>
            <div className="grid grid-cols-3 gap-1">
              {subTaskOptions.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSubTask(st)}
                  className={`py-1 px-1 text-[10px] rounded border text-center truncate ${
                    subTask === st
                      ? 'bg-signal/20 border-signal text-signal font-medium'
                      : 'bg-elevated border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {st === 'Answer question' ? 'VQA' : st === 'Caption scene' ? 'Caption' : 'Grounding'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bands */}
        <div>
          <div className="text-[11px] font-mono uppercase text-text-muted mb-1">Band Combination</div>
          <div className="grid grid-cols-3 gap-1">
            {bandOptions.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBand(b)}
                className={`py-1 px-1 text-[11px] rounded border text-center truncate ${
                  band === b
                    ? 'bg-signal/15 border-signal text-signal font-medium'
                    : 'bg-elevated border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Compatibility Checklist */}
        <CompatibilityChecklist
          checks={
            customScene
              ? [
                  { id: 'chk-1', name: 'Raster Format', status: 'pass', value: `${customScene.fileFormat} ✓`, details: customScene.fileName, critical: true },
                  { id: 'chk-2', name: 'CRS Co-registration', status: 'pass', value: 'EPSG:32643 ✓', details: 'Embedded geotags co-registered', critical: true },
                  { id: 'chk-3', name: 'Band Calibration', status: 'pass', value: 'Calibrated BOA ✓', details: 'Surface reflectance confirmed', critical: true },
                  { id: 'chk-4', name: 'Scene Resolution', status: 'pass', value: '10.0m GSD ✓', details: 'Resolution threshold met', critical: true },
                  { id: 'chk-5', name: 'Cloud Cover Gate', status: 'pass', value: '< 15% Cloud Mask ✓', details: 'Valid for VQA inference', critical: false },
                ]
              : compatibilityChecks
          }
          allPassed={criticalChecksPassed}
        />
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0a0e13]/60">
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-border/40">
          <MessageSquare className="w-3 h-3 text-signal" />
          <span>Analyst Dialogue Stream</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5">
            {msg.sender === 'user' ? (
              <div className="bg-elevated border border-border rounded p-2.5 text-xs text-text-primary">
                <div className="text-[10px] font-mono text-text-muted mb-0.5 flex items-center justify-between">
                  <span>ANALYST PROMPT</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed">{msg.queryText}</p>
              </div>
            ) : (
              <div className="bg-base border border-border-strong rounded p-2.5 text-xs space-y-1.5">
                <div className="text-[10px] font-mono text-signal flex items-center justify-between border-b border-border pb-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-signal" />
                    <span>INFERENCE ANSWER</span>
                    {msg.payload?.chipLabel && (
                      <span className="bg-signal/20 text-signal border border-signal/40 px-1 py-0.2 rounded text-[9px] font-semibold uppercase">
                        {msg.payload.chipLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-text-muted">{msg.timestamp}</span>
                </div>

                <p className="text-text-primary leading-relaxed">{msg.payload?.answer}</p>

                <div className="pt-1 text-[10px] font-mono text-signal flex items-center justify-between border-t border-border/40">
                  <span className="text-text-muted">Confidence: {(Number(msg.payload?.confidence || 0) * 100).toFixed(1)}%</span>
                  <span className="text-text-secondary">See right panel for trace →</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="bg-base border border-signal/40 rounded p-2.5 text-xs flex items-center gap-2 text-signal">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="font-mono text-[11px]">Executing specialist tools in right panel...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Pinned Bottom Multimodal Query Bar */}
      <div className="p-3 bg-[#131922] border-t-2 border-signal/40 shadow-2xl space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-signal animate-pulse" />
            <span className="text-xs font-semibold font-mono text-text-primary tracking-wide">
              ASK MULTIMODAL QUERY
            </span>
            {isListening && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-alert animate-pulse ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-alert" />
                Listening...
              </span>
            )}
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer hover:text-text-primary">
            <input
              type="checkbox"
              checked={streamingEnabled}
              onChange={(e) => setStreamingEnabled(e.target.checked)}
              className="rounded bg-elevated border-border text-signal focus:ring-0 w-3.5 h-3.5"
            />
            <span className="font-mono text-[10px]">Stream Trace</span>
          </label>
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap gap-1 items-center pb-0.5">
          <span className="text-[10px] font-mono text-signal flex items-center gap-0.5">
            <Zap className="w-3 h-3" />
          </span>
          {getPromptChips().map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface hover:bg-elevated text-text-secondary hover:text-signal border border-border hover:border-signal/50 transition-all truncate max-w-[170px]"
              title={`Auto-fill: "${chip}"`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative rounded bg-base border border-signal/40 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/20 transition-all">
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
                ? 'Listening to operator voice...'
                : isFusionMode && !isFusionValid
                ? 'Arm both Optical + SAR sources above...'
                : 'Type natural-language query or click a prompt chip...'
            }
            className="w-full bg-transparent text-text-primary text-xs p-2.5 rounded resize-none outline-none pr-16 placeholder:text-text-muted"
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? 'Stop Recording' : 'Voice Input'}
                className={`p-1.5 rounded transition-all ${
                  isListening
                    ? 'bg-alert/25 text-alert animate-pulse border border-alert/50'
                    : 'text-text-secondary hover:text-signal hover:bg-surface'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!canSubmit}
              className="p-1.5 rounded bg-signal text-base font-semibold hover:opacity-95 disabled:opacity-25 transition-all shadow-md"
              title="Submit query"
            >
              <Send className="w-4 h-4 text-base" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
