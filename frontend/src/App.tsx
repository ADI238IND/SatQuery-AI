import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { TopNav } from './components/dashboard/TopNav';
import { ControlSidebar, type CustomUploadedScene } from './components/dashboard/ControlSidebar';
import { MapCanvas } from './components/dashboard/MapCanvas';
import { AnalyticsSidebar } from './components/dashboard/AnalyticsSidebar';
import type {
  ImagerySource,
  AnalysisMode,
  SingleSceneSubTask,
  BandSelection,
  ChatMessage,
  AnalysisPayload,
  TraceStep,
} from './lib/types';
import {
  MISSION_CATALOGS,
  SOURCE_IMAGERY,
  generateCompatibilityChecks,
} from './lib/mockData';

const MainDashboard: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('Uttarakhand Floods — Chamoli Basin');

  // Single Source-of-Truth States
  const [activeSource, setActiveSource] = useState<ImagerySource>('sentinel2');
  const [activeSecondarySource, setActiveSecondarySource] = useState<ImagerySource | null>(null);

  // Custom Drag-and-Drop Scene State (§3.2)
  const [customScene, setCustomScene] = useState<CustomUploadedScene | null>(null);

  const [mode, setMode] = useState<AnalysisMode>('Change Detection');
  const [subTask, setSubTask] = useState<SingleSceneSubTask>('Answer question');

  const [band, setBand] = useState<BandSelection>('RGB True Color');
  const [activeTool, setActiveTool] = useState<'bbox' | 'polygon' | 'pan'>('bbox');
  const [showEvidence, setShowEvidence] = useState<boolean>(true);
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);

  const activeMission = useMemo(() => {
    return MISSION_CATALOGS[selectedProject] || MISSION_CATALOGS['Uttarakhand Floods — Chamoli Basin'];
  }, [selectedProject]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'user',
      timestamp: '10:14:02',
      queryText: activeMission.initialQuery,
    },
    {
      id: 'msg-init-2',
      sender: 'assistant',
      timestamp: '10:14:05',
      payload: activeMission.payload,
    },
  ]);

  const [currentPayload, setCurrentPayload] = useState<AnalysisPayload>(activeMission.payload);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);

  const handleProjectSelect = (project: string) => {
    setSelectedProject(project);
    setCustomScene(null);
    const mission = MISSION_CATALOGS[project];
    if (mission) {
      setCurrentPayload(mission.payload);
      setMessages([
        {
          id: `msg-${Date.now()}-1`,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          queryText: mission.initialQuery,
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          payload: mission.payload,
        },
      ]);
    }
  };

  const compatibilityChecks = useMemo(() => {
    return generateCompatibilityChecks(activeSource, activeSecondarySource, mode === 'Fusion');
  }, [activeSource, activeSecondarySource, mode]);

  const handleSendMessage = (queryText: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    setTimeout(
      () => {
        const isLowConfidence =
          queryText.toLowerCase().includes('cloud') || queryText.toLowerCase().includes('shadow');

        const chipLabel =
          mode === 'Change Detection'
            ? 'Change'
            : mode === 'Fusion'
            ? 'Fusion'
            : subTask === 'Answer question'
            ? 'VQA'
            : subTask === 'Caption scene'
            ? 'Caption'
            : 'Grounding';

        const dynamicTrace: TraceStep[] = [
          {
            id: 't-1',
            stepNumber: 1,
            name: 'Validated input',
            status: 'done',
            summary: customScene ? `Custom Upload / ${customScene.fileFormat}` : `COG / ${activeMission.scene.crs.split(' ')[0]}`,
            details: {
              file_source: customScene ? customScene.fileName : SOURCE_IMAGERY[activeSource].platform,
              file_size: customScene ? customScene.fileSize : '42 MB',
              crs: activeMission.scene.crs,
            },
          },
          {
            id: 't-2',
            stepNumber: 2,
            name: 'Routed to task',
            status: 'done',
            summary:
              mode === 'Single Scene VQA'
                ? `single_vqa_${subTask.toLowerCase().replace(/ /g, '_')}`
                : mode === 'Fusion'
                ? 'fuse_optical_sar'
                : 'detect_change',
            details: {
              active_mode: mode,
              sub_task: subTask,
              routing_confidence: 0.985,
            },
          },
          {
            id: 't-3',
            stepNumber: 3,
            name: 'Executed specialist tool(s)',
            status: 'done',
            summary: customScene ? 'Custom_Raster_Segmenter, VQA_Head' : mode === 'Fusion' ? 'SAR_Coherence, MSI_Reflectance' : 'NDWI_Thresholding, Change_Vector',
            details: {
              tools_dispatched: customScene
                ? ['Custom_COG_Reader', 'Spectral_Feature_Extractor', 'SAM_Segmentation_Head']
                : mode === 'Fusion'
                ? ['RISAT_C_Band_Interferometry', 'Sentinel2_NDWI_Index']
                : ['Change_Vector_Analysis', 'Otsu_Water_Segmentation'],
            },
          },
          {
            id: 't-4',
            stepNumber: 4,
            name: 'Verified evidence',
            status: isLowConfidence ? 'warning' : 'done',
            summary: isLowConfidence ? 'Low confidence in shadow (>1.2px)' : 'Cross-tool agreement 96%',
            details: {
              agreement_score: isLowConfidence ? 0.48 : 0.962,
            },
          },
          {
            id: 't-5',
            stepNumber: 5,
            name: 'Response composed',
            status: 'done',
            summary: 'Summary packaged with spatial bounding',
            details: {
              confidence_score: isLowConfidence ? 0.46 : 0.95,
              grounded_regions: isLowConfidence ? 8 : activeMission.payload.groundedRegionsCount,
            },
          },
        ];

        let answerText = '';
        if (isLowConfidence) {
          answerText =
            'Confidence is below the safe threshold; no definitive answer is provided for deep shadow perimeters.';
        } else if (customScene) {
          answerText = `Custom scene "${customScene.fileName}" processed successfully. Multimodal spatial feature extraction identified key geographic boundaries and terrain variance.`;
        } else if (mode === 'Fusion') {
          answerText = `Cross-sensor fusion (Optical + SAR) penetrated cloud canopy over ${activeMission.scene.location}, confirming ${activeMission.payload.metrics.changedAreaKm2} km² perimeter change with 96% confidence.`;
        } else if (mode === 'Single Scene VQA') {
          if (subTask === 'Caption scene') {
            answerText = `High-density remote sensing scene covering ${activeMission.scene.location}. Morphological analysis confirms significant spectral variance across active drainage corridors.`;
          } else if (subTask === 'Highlight region') {
            answerText = `Highlighted dominant anomaly polygons across ${activeMission.scene.title}.`;
          } else {
            answerText = activeMission.payload.answer;
          }
        } else {
          answerText = activeMission.payload.answer;
        }

        const newPayload: AnalysisPayload = {
          task: mode,
          subTask: mode === 'Single Scene VQA' ? subTask : undefined,
          chipLabel,
          answer: answerText,
          confidence: isLowConfidence ? 0.46 : activeMission.payload.confidence,
          groundedRegionsCount: isLowConfidence ? 8 : activeMission.payload.groundedRegionsCount,
          trace: dynamicTrace,
          warnings: activeMission.payload.warnings,
          evidence: currentPayload.evidence || [],
          metrics: {
            ...activeMission.payload.metrics,
            opticalWeight: mode === 'Fusion' ? 0.65 : undefined,
            sarWeight: mode === 'Fusion' ? 0.35 : undefined,
          },
          histograms: activeMission.payload.histograms,
        };

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          payload: newPayload,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setCurrentPayload(newPayload);
        setIsStreaming(false);
      },
      streamingEnabled ? 1200 : 350
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-base text-text-primary overflow-hidden">
      <TopNav
        selectedProject={selectedProject}
        setSelectedProject={handleProjectSelect}
      />

      <div className="flex flex-1 overflow-hidden">
        <ControlSidebar
          activeSource={activeSource}
          setActiveSource={setActiveSource}
          activeSecondarySource={activeSecondarySource}
          setActiveSecondarySource={setActiveSecondarySource}
          mode={mode}
          setMode={setMode}
          subTask={subTask}
          setSubTask={setSubTask}
          band={band}
          setBand={setBand}
          messages={messages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          streamingEnabled={streamingEnabled}
          setStreamingEnabled={setStreamingEnabled}
          compatibilityChecks={compatibilityChecks}
          customScene={customScene}
          setCustomScene={setCustomScene}
        />

        <MapCanvas
          activeSource={activeSource}
          activeSecondarySource={activeSecondarySource}
          scene={activeMission.scene}
          center={activeMission.center}
          zoom={activeMission.zoom}
          rois={activeMission.rois}
          mode={mode}
          band={band}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          showEvidence={showEvidence}
          setShowEvidence={setShowEvidence}
          customScene={customScene}
        />

        <AnalyticsSidebar
          payload={currentPayload}
          mode={mode}
          collapsed={analyticsCollapsed}
          setCollapsed={setAnalyticsCollapsed}
        />
      </div>
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { user } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  if (!user) {
    if (authView === 'signup') {
      return (
        <SignupPage
          onNavigateLogin={() => setAuthView('login')}
          onSuccess={() => {}}
        />
      );
    }
    return (
      <LoginPage
        onNavigateSignup={() => setAuthView('signup')}
        onSuccess={() => {}}
      />
    );
  }

  return <MainDashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
