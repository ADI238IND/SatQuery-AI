import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { TopNav } from './components/dashboard/TopNav';
import { ControlSidebar, type CustomUploadedScene } from './components/dashboard/ControlSidebar';
import { MapCanvas } from './components/dashboard/MapCanvas';
import { AnalyticsSidebar } from './components/dashboard/AnalyticsSidebar';
import { executeMultimodalQuery } from './lib/api';
import type {
  ImagerySource,
  AnalysisMode,
  SingleSceneSubTask,
  BandSelection,
  ChatMessage,
  AnalysisPayload,
} from './lib/types';
import {
  MISSION_CATALOGS,
} from './lib/mockData';

const MainDashboard: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('Nepal Flash Floods — Trishuli River Valley');

  const [activeSource, setActiveSource] = useState<ImagerySource>('sentinel2');
  const [activeSecondarySource, setActiveSecondarySource] = useState<ImagerySource | null>(null);
  const [customScene, setCustomScene] = useState<CustomUploadedScene | null>(null);

  const [mode, setMode] = useState<AnalysisMode>('Change Detection');
  const [subTask, setSubTask] = useState<SingleSceneSubTask>('Answer question');

  const [band, setBand] = useState<BandSelection>('RGB True Color');
  const [activeTool, setActiveTool] = useState<'bbox' | 'polygon' | 'pan'>('bbox');
  const [showEvidence, setShowEvidence] = useState<boolean>(true);
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);

  const activeMission = useMemo(() => {
    return MISSION_CATALOGS[selectedProject] || MISSION_CATALOGS['Nepal Flash Floods — Trishuli River Valley'];
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
  const [error, setError] = useState<string | null>(null);

  // Dual-slot Upload State for Change Detection
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [registrationWarning, setRegistrationWarning] = useState<string | null>(null);

  // Dimension check when both URLs are present
  React.useEffect(() => {
    if (beforeUrl && afterUrl) {
      const img1 = new Image();
      const img2 = new Image();
      let img1Loaded = false;
      let img2Loaded = false;

      const checkDimensions = () => {
        if (img1Loaded && img2Loaded) {
          if (img1.width !== img2.width || img1.height !== img2.height) {
            setRegistrationWarning(`Dimensions mismatch: Before (${img1.width}x${img1.height}) vs After (${img2.width}x${img2.height})`);
          } else {
            setRegistrationWarning(null);
          }
        }
      };

      img1.onload = () => {
        img1Loaded = true;
        checkDimensions();
      };
      img2.onload = () => {
        img2Loaded = true;
        checkDimensions();
      };

      img1.src = beforeUrl;
      img2.src = afterUrl;
    } else {
      setRegistrationWarning(null);
    }
  }, [beforeUrl, afterUrl]);

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

  const handleSendMessage = async (queryText: string, attachedImages?: string[]) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      queryText,
      attachedImages: attachedImages && attachedImages.length > 0 ? attachedImages : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setError(null);

    // 🧹 Auto-clear active upload state after attaching to inquiry message
    setCustomScene(null);
    setBeforeFile(null);
    setAfterFile(null);
    setBeforeUrl(null);
    setAfterUrl(null);

    try {
      const payload = await executeMultimodalQuery({
        sceneId: customScene ? 'CUSTOM-UPLOAD-01' : activeMission.scene.id,
        queryText,
        mode,
        subTask,
        primarySource: activeSource,
        secondarySource: activeSecondarySource,
        band,
        coordinates: activeMission.center,
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        payload,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentPayload(payload);
    } catch (err) {
      console.error('Failed to execute query:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute query due to an unknown error.');
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-base text-text-primary overflow-hidden font-sans">
      <TopNav
        selectedProject={selectedProject}
        setSelectedProject={handleProjectSelect}
      />

      <div className="flex flex-1 overflow-hidden">
        <ControlSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          streamingEnabled={streamingEnabled}
          setStreamingEnabled={setStreamingEnabled}
          mode={mode}
          setMode={setMode}
          subTask={subTask}
          setSubTask={setSubTask}
          activeSource={activeSource}
          setActiveSource={setActiveSource}
          activeSecondarySource={activeSecondarySource}
          setActiveSecondarySource={setActiveSecondarySource}
          band={band}
          setBand={setBand}
          customScene={customScene}
          setCustomScene={setCustomScene}
          error={error}
          beforeFile={beforeFile}
          setBeforeFile={setBeforeFile}
          afterFile={afterFile}
          setAfterFile={setAfterFile}
          beforeUrl={beforeUrl}
          setBeforeUrl={setBeforeUrl}
          afterUrl={afterUrl}
          setAfterUrl={setAfterUrl}
        />

        <MapCanvas
          activeSource={activeSource}
          setActiveSource={setActiveSource}
          activeSecondarySource={activeSecondarySource}
          setActiveSecondarySource={setActiveSecondarySource}
          scene={activeMission.scene}
          center={activeMission.center}
          zoom={activeMission.zoom}
          rois={activeMission.rois}
          mode={mode}
          setMode={setMode}
          band={band}
          setBand={setBand}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          showEvidence={showEvidence}
          setShowEvidence={setShowEvidence}
          customScene={customScene}
          setCustomScene={setCustomScene}
          beforeUrl={beforeUrl}
          afterUrl={afterUrl}
          registrationWarning={registrationWarning}
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
