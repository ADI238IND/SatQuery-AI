import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import type {
  ImagerySource,
  SceneMetadata,
  AnalysisMode,
  BandSelection,
  BoundingBox,
} from '../../lib/types';
import type { CustomUploadedScene } from './ControlSidebar';
import { SOURCE_IMAGERY } from '../../lib/mockData';
import {
  Maximize2,
  Minimize2,
  Crosshair,
  Pentagon,
  Square,
  Move,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronsLeftRight,
  MapPin,
  Trash2,
  Undo2,
  X,
  Check,
  Satellite,
  History,
} from 'lucide-react';

interface MapCanvasProps {
  activeSource: ImagerySource;
  activeSecondarySource: ImagerySource | null;
  scene: SceneMetadata;
  center: [number, number];
  zoom: number;
  rois: BoundingBox[];
  mode: AnalysisMode;
  band: BandSelection;
  activeTool: 'bbox' | 'polygon' | 'pan';
  setActiveTool: (t: 'bbox' | 'polygon' | 'pan') => void;
  showEvidence: boolean;
  setShowEvidence: (s: boolean) => void;
  customScene: CustomUploadedScene | null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  activeSource,
  activeSecondarySource,
  scene,
  center,
  zoom,
  rois,
  mode,
  band,
  activeTool,
  setActiveTool,
  showEvidence,
  setShowEvidence,
  customScene,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layers
  const archiveLayerRef = useRef<L.TileLayer | null>(null);
  const liveSatelliteLayerRef = useRef<L.TileLayer | null>(null);

  const sliderHandleRef = useRef<HTMLDivElement>(null);
  const clipLayerRef = useRef<HTMLDivElement>(null);
  const isDraggingSliderRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  const aiEvidenceLayerRef = useRef<L.LayerGroup | null>(null);
  const userDrawLayerRef = useRef<L.LayerGroup | null>(null);
  const tempDrawLayerRef = useRef<L.LayerGroup | null>(null);
  const customOverlayLayerRef = useRef<L.ImageOverlay | null>(null);

  const isDrawingRef = useRef(false);
  const drawStartLatLngRef = useRef<L.LatLng | null>(null);
  const polygonPointsRef = useRef<L.LatLng[]>([]);

  // Toggle between 2024 Event Archive vs 2026 Live Orbit Stream
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(false);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoadingSource, setIsLoadingSource] = useState<boolean>(false);
  const [userShapesCount, setUserShapesCount] = useState<number>(0);
  const [activePolygonPointsCount, setActivePolygonPointsCount] = useState<number>(0);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({
    lat: `${center[0].toFixed(4)}° N`,
    lng: `${center[1].toFixed(4)}° E`,
  });

  const activeSensorMeta = SOURCE_IMAGERY[activeSource];
  const secondarySensorMeta = activeSecondarySource ? SOURCE_IMAGERY[activeSecondarySource] : null;

  // Real-time Dynamic Dates for Live Orbit Mode
  const now = new Date();
  const latestDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // T-1d
  const revisitDays = activeSource === 'sentinel2' ? 5 : activeSource === 'landsat' ? 8 : 7;
  const previousDate = new Date(now.getTime() - (revisitDays + 1) * 24 * 60 * 60 * 1000); // T-6d

  const liveLatestString = `${latestDate.toISOString().slice(0, 10)} 05:44 UTC`;
  const livePreviousString = `${previousDate.toISOString().slice(0, 10)} 05:42 UTC`;

  // 1. Initialize Map with Archive & Live Layers
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // 2024 Historical Event Satellite Layer
    const archiveLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, maxNativeZoom: 18 }
    ).addTo(map);
    archiveLayerRef.current = archiveLayer;

    // Real-Time Satellite Stream Layer
    const liveLayer = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      { maxZoom: 18, maxNativeZoom: 18 }
    );
    liveSatelliteLayerRef.current = liveLayer;

    aiEvidenceLayerRef.current = L.layerGroup().addTo(map);
    userDrawLayerRef.current = L.layerGroup().addTo(map);
    tempDrawLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: `${e.latlng.lat.toFixed(4)}° N`,
        lng: `${e.latlng.lng.toFixed(4)}° E`,
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Real-Time Layer Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !archiveLayerRef.current || !liveSatelliteLayerRef.current) return;

    setIsLoadingSource(true);

    if (isLiveFeed) {
      map.removeLayer(archiveLayerRef.current);
      liveSatelliteLayerRef.current.addTo(map);
    } else {
      map.removeLayer(liveSatelliteLayerRef.current);
      archiveLayerRef.current.addTo(map);
    }

    const timer = setTimeout(() => {
      setIsLoadingSource(false);
      map.invalidateSize();
    }, 380);

    return () => clearTimeout(timer);
  }, [isLiveFeed, activeSource, center]);

  // 3. Custom Uploaded Image Overlay Handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (customOverlayLayerRef.current) {
      map.removeLayer(customOverlayLayerRef.current);
      customOverlayLayerRef.current = null;
    }

    if (customScene && customScene.singleUrl) {
      const bounds = L.latLngBounds(
        [center[0] - 0.015, center[1] - 0.020],
        [center[0] + 0.015, center[1] + 0.020]
      );
      const overlay = L.imageOverlay(customScene.singleUrl, bounds, { opacity: 0.95 });
      overlay.addTo(map);
      customOverlayLayerRef.current = overlay;
      map.flyToBounds(bounds);
    }
  }, [customScene, center]);

  // 4. Render AI Evidence Tooltips
  useEffect(() => {
    if (!mapInstanceRef.current || !aiEvidenceLayerRef.current) return;

    aiEvidenceLayerRef.current.clearLayers();

    if (showEvidence && !customScene && !isLiveFeed) {
      const bounds1 = L.latLngBounds(
        [center[0] - 0.005, center[1] - 0.005],
        [center[0] + 0.005, center[1] + 0.005]
      );
      const rect1 = L.rectangle(bounds1, {
        color: '#F5A623',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#F5A623',
        fillOpacity: 0.08,
      }).bindTooltip(
        `<div class="font-mono text-xs text-white bg-[#171D26] px-2.5 py-1 rounded border border-[#F5A623] shadow-xl">
          <span class="w-1.5 h-1.5 rounded-full inline-block bg-[#F5A623] mr-1.5"></span>
          <b>AI Evidence:</b> ${rois[0]?.label || 'River Corridor Inundation'} <span class="text-[#2DD4C9] font-semibold">${rois[0]?.metric || '(+64%)'}</span>
        </div>`,
        { permanent: false, sticky: true, direction: 'top' }
      );

      const bounds2 = L.latLngBounds(
        [center[0] + 0.001, center[1] + 0.006],
        [center[0] + 0.006, center[1] + 0.012]
      );
      const rect2 = L.rectangle(bounds2, {
        color: '#4C8DFF',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#4C8DFF',
        fillOpacity: 0.08,
      }).bindTooltip(
        `<div class="font-mono text-xs text-white bg-[#171D26] px-2.5 py-1 rounded border border-[#4C8DFF] shadow-xl">
          <span class="w-1.5 h-1.5 rounded-full inline-block bg-[#4C8DFF] mr-1.5"></span>
          <b>AI Evidence:</b> ${rois[1]?.label || 'Submerged Pier Embankment'}
        </div>`,
        { permanent: false, sticky: true, direction: 'top' }
      );

      aiEvidenceLayerRef.current.addLayer(rect1);
      aiEvidenceLayerRef.current.addLayer(rect2);
    }
  }, [center, rois, showEvidence, customScene, isLiveFeed]);

  // 5. Ultra-Smooth Slider Handlers
  const handleSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSliderRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSliderRef.current || !mapContainerRef.current) return;

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    const clientX = e.clientX;
    animationFrameIdRef.current = requestAnimationFrame(() => {
      if (!mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;

      if (sliderHandleRef.current) {
        sliderHandleRef.current.style.left = `${percentage}%`;
      }
      if (clipLayerRef.current) {
        clipLayerRef.current.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
      }
    });
  };

  const handleSliderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingSliderRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
  };

  // Drawing Handlers
  const updateTempPolygonVisuals = () => {
    tempDrawLayerRef.current?.clearLayers();
    if (polygonPointsRef.current.length > 1) {
      const polyline = L.polyline(polygonPointsRef.current, {
        color: '#F5A623',
        weight: 2,
        dashArray: '4, 4',
      });
      tempDrawLayerRef.current?.addLayer(polyline);
    }
    polygonPointsRef.current.forEach((pt) => {
      const circle = L.circleMarker(pt, {
        radius: 4.5,
        color: '#F5A623',
        fillColor: '#fff',
        fillOpacity: 1,
      });
      tempDrawLayerRef.current?.addLayer(circle);
    });
    setActivePolygonPointsCount(polygonPointsRef.current.length);
  };

  const cancelActivePolygon = () => {
    polygonPointsRef.current = [];
    tempDrawLayerRef.current?.clearLayers();
    setActivePolygonPointsCount(0);
  };

  const undoLastPolygonPoint = () => {
    if (polygonPointsRef.current.length > 0) {
      polygonPointsRef.current.pop();
      updateTempPolygonVisuals();
    }
  };

  const finishPolygon = () => {
    if (polygonPointsRef.current.length < 3) return;
    tempDrawLayerRef.current?.clearLayers();

    const shapeNumber = userShapesCount + 1;
    const poly = L.polygon(polygonPointsRef.current, {
      color: '#F5A623',
      weight: 2,
      fillColor: '#F5A623',
      fillOpacity: 0.18,
    }).bindTooltip(
      `<div class="font-mono text-xs text-white bg-[#171D26] px-2 py-1 rounded border border-[#F5A623] shadow-xl">
        <span class="w-1.5 h-1.5 rounded-full inline-block bg-[#F5A623] mr-1"></span>
        <b>User ROI #${shapeNumber}</b> (Custom Polygon)
      </div>`,
      { permanent: false, sticky: true, direction: 'top' }
    );

    userDrawLayerRef.current?.addLayer(poly);
    setUserShapesCount((c) => c + 1);
    polygonPointsRef.current = [];
    setActivePolygonPointsCount(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelActivePolygon();
      } else if (e.key === 'Backspace' && activeTool === 'polygon') {
        undoLastPolygonPoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    cancelActivePolygon();

    if (activeTool === 'pan') {
      map.dragging.enable();
      map.getContainer().style.cursor = 'grab';
    } else {
      map.dragging.disable();
      map.getContainer().style.cursor = 'crosshair';
    }

    const handleBBoxMouseDown = (e: L.LeafletMouseEvent) => {
      if (activeTool !== 'bbox') return;
      isDrawingRef.current = true;
      drawStartLatLngRef.current = e.latlng;
      tempDrawLayerRef.current?.clearLayers();
    };

    const handleBBoxMouseMove = (e: L.LeafletMouseEvent) => {
      if (activeTool !== 'bbox' || !isDrawingRef.current || !drawStartLatLngRef.current) return;
      tempDrawLayerRef.current?.clearLayers();
      const currentBounds = L.latLngBounds(drawStartLatLngRef.current, e.latlng);
      const tempRect = L.rectangle(currentBounds, {
        color: '#2DD4C9',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#2DD4C9',
        fillOpacity: 0.15,
      });
      tempDrawLayerRef.current?.addLayer(tempRect);
    };

    const handleBBoxMouseUp = (e: L.LeafletMouseEvent) => {
      if (activeTool !== 'bbox' || !isDrawingRef.current || !drawStartLatLngRef.current) return;
      isDrawingRef.current = false;
      tempDrawLayerRef.current?.clearLayers();

      const finalBounds = L.latLngBounds(drawStartLatLngRef.current, e.latlng);
      if (drawStartLatLngRef.current.distanceTo(e.latlng) > 15) {
        const shapeNumber = userShapesCount + 1;
        const newRect = L.rectangle(finalBounds, {
          color: '#2DD4C9',
          weight: 2,
          fillColor: '#2DD4C9',
          fillOpacity: 0.18,
        }).bindTooltip(
          `<div class="font-mono text-xs text-white bg-[#171D26] px-2 py-1 rounded border border-[#2DD4C9] shadow-xl">
            <span class="w-1.5 h-1.5 rounded-full inline-block bg-[#2DD4C9] mr-1"></span>
            <b>User ROI #${shapeNumber}</b> (Spatial Bounding Box)
          </div>`,
          { permanent: false, sticky: true, direction: 'top' }
        );

        userDrawLayerRef.current?.addLayer(newRect);
        setUserShapesCount((c) => c + 1);
      }
      drawStartLatLngRef.current = null;
    };

    const handlePolygonClick = (e: L.LeafletMouseEvent) => {
      if (activeTool !== 'polygon') return;
      polygonPointsRef.current.push(e.latlng);
      updateTempPolygonVisuals();
    };

    const handlePolygonDblClick = () => {
      if (activeTool !== 'polygon') return;
      finishPolygon();
    };

    map.on('mousedown', handleBBoxMouseDown);
    map.on('mousemove', handleBBoxMouseMove);
    map.on('mouseup', handleBBoxMouseUp);
    map.on('click', handlePolygonClick);
    map.on('dblclick', handlePolygonDblClick);

    return () => {
      map.off('mousedown', handleBBoxMouseDown);
      map.off('mousemove', handleBBoxMouseMove);
      map.off('mouseup', handleBBoxMouseUp);
      map.off('click', handlePolygonClick);
      map.off('dblclick', handlePolygonDblClick);
    };
  }, [activeTool, userShapesCount]);

  const handleClearUserDrawings = () => {
    userDrawLayerRef.current?.clearLayers();
    tempDrawLayerRef.current?.clearLayers();
    polygonPointsRef.current = [];
    setActivePolygonPointsCount(0);
    setUserShapesCount(0);
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
      setCursorCoords({
        lat: `${center[0].toFixed(4)}° N`,
        lng: `${center[1].toFixed(4)}° E`,
      });
    }
  }, [center, zoom, scene.id]);

  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo(center, zoom, { duration: 1 });
  };

  const getFilterStyle = (): React.CSSProperties => {
    if (activeSource === 'risat' && mode !== 'Fusion') {
      return { filter: 'grayscale(100%) contrast(220%) brightness(82%)' };
    }
    if (band === 'False Color NIR') {
      return { filter: 'hue-rotate(140deg) saturate(260%) contrast(125%)' };
    }
    if (band === 'NDVI') {
      return { filter: 'hue-rotate(55deg) saturate(340%) contrast(145%) brightness(92%)' };
    }
    if (mode === 'Fusion') {
      return { filter: 'contrast(165%) saturate(145%) brightness(105%)' };
    }
    return { filter: 'saturate(115%) contrast(110%)' };
  };

  return (
    <main
      className={`flex-1 flex flex-col bg-base overflow-hidden relative ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-56px)]'
      }`}
    >
      {/* Header Bar */}
      <div className="h-10 bg-surface/95 border-b border-border px-3.5 flex items-center justify-between text-xs z-20 select-none">
        <div className="flex items-center gap-2 text-text-primary">
          <span className="font-mono text-signal text-[11px]">{customScene ? 'CUSTOM-GEO-01' : scene.id}</span>
          <span className="text-border">/</span>
          <span className="font-medium truncate">{customScene ? customScene.fileName : scene.title}</span>
          <span className="hidden lg:inline text-[11px] font-mono text-text-muted">
            ({customScene ? customScene.fileFormat : activeSensorMeta.platform} · {scene.crs})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 2024 Historical Event vs 2026 Live Satellite Stream Switcher */}
          {!customScene && (
            <div className="flex items-center bg-elevated rounded border border-border p-0.5 text-[10px] font-mono">
              <button
                onClick={() => setIsLiveFeed(false)}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  !isLiveFeed
                    ? 'bg-surface text-signal font-semibold border border-border'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="2024 Historical Disaster Ground-Truth"
              >
                <History className="w-3 h-3" />
                <span>2024 Event Archive</span>
              </button>
              <button
                onClick={() => setIsLiveFeed(true)}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  isLiveFeed
                    ? 'bg-signal/20 text-signal font-bold border border-signal/40 shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Stream Live Satellite Orbital Pass (2026)"
              >
                <Satellite className="w-3 h-3 text-signal animate-pulse" />
                <span>Live Orbit Stream (2026)</span>
              </button>
            </div>
          )}

          {mode === 'Fusion' && secondarySensorMeta && !customScene && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-elevated border border-border rounded text-[11px] font-mono">
              <span className="text-text-muted">Active Fusion:</span>
              <span className="text-signal">{activeSensorMeta.label} (65%)</span>
              <span className="text-border">+</span>
              <span className="text-water">{secondarySensorMeta.label} (35%)</span>
            </div>
          )}

          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            className="p-1 text-text-secondary hover:text-text-primary"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-[#06090c] overflow-hidden select-none">
        {isLoadingSource && (
          <div className="absolute inset-0 bg-base/75 z-30 flex flex-col items-center justify-center gap-2 backdrop-blur-xs font-mono pointer-events-none">
            <div className="w-9 h-9 rounded bg-signal/15 border border-signal/40 flex items-center justify-center text-signal animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="text-xs text-text-primary flex items-center gap-2">
              <span>
                {isLiveFeed
                  ? `Streaming live downlinked satellite pass for ${liveLatestString}...`
                  : `Loading ${scene.title}...`}
              </span>
            </div>
            <span className="text-[10px] text-text-muted">{scene.crs} · Level-2A Orthorectified</span>
          </div>
        )}

        {/* Real Satellite Map */}
        <div ref={mapContainerRef} className="w-full h-full" style={getFilterStyle()} />

        {/* Change Detection Before/After Split Comparison Slider */}
        {mode === 'Change Detection' && (
          <>
            <div
              ref={clipLayerRef}
              className="absolute inset-0 pointer-events-none overflow-hidden z-10 will-change-[clip-path]"
              style={{
                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              }}
            >
              <div className="w-full h-full bg-[#3b2a1a]/25 backdrop-sepia-50 mix-blend-color-burn pointer-events-none" />
            </div>

            <div
              ref={sliderHandleRef}
              className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-20 touch-none will-change-[left]"
              style={{ left: '50%' }}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
            >
              <div className="w-0.5 h-full bg-signal shadow-[0_0_10px_rgba(45,212,201,0.5)]" />
              <div className="absolute top-1/2 -translate-y-1/2 bg-surface border border-signal rounded px-1.5 py-1 flex items-center gap-1 shadow-2xl pointer-events-none">
                <ChevronsLeftRight className="w-3.5 h-3.5 text-signal" />
              </div>
            </div>

            <div className="absolute top-3 left-3 bg-surface/90 border border-border px-2.5 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-sm pointer-events-none z-10 shadow-md">
              <span className="text-text-muted mr-1.5">
                {isLiveFeed ? 'PREVIOUS ORBIT (T-5d):' : 'PRE-EVENT PASS:'}
              </span>
              <span className="text-signal">{isLiveFeed ? livePreviousString : scene.captureDatePre}</span>
            </div>
            <div className="absolute top-3 right-3 bg-surface/90 border border-border px-2.5 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-sm pointer-events-none z-10 shadow-md">
              <span className="text-text-muted mr-1.5">
                {isLiveFeed ? 'LATEST ORBIT PASS:' : 'POST-EVENT PASS:'}
              </span>
              <span className="text-signal">{isLiveFeed ? liveLatestString : scene.captureDatePost}</span>
            </div>
          </>
        )}

        {/* Floating Polygon Actions HUD */}
        {activeTool === 'polygon' && activePolygonPointsCount > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface/95 border border-thermal px-3 py-1.5 rounded shadow-2xl backdrop-blur-sm z-30 flex items-center gap-2 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-thermal animate-ping" />
            <span className="text-text-primary">{activePolygonPointsCount} point(s) placed</span>
            <div className="h-3 w-px bg-border mx-1" />
            
            <button
              onClick={finishPolygon}
              disabled={activePolygonPointsCount < 3}
              className="px-2 py-0.5 rounded bg-thermal text-base font-semibold disabled:opacity-30 hover:opacity-90 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Finish
            </button>

            <button
              onClick={undoLastPolygonPoint}
              className="px-2 py-0.5 rounded bg-elevated border border-border text-text-secondary hover:text-text-primary flex items-center gap-1"
            >
              <Undo2 className="w-3 h-3" /> Undo
            </button>

            <button
              onClick={cancelActivePolygon}
              className="px-2 py-0.5 rounded bg-elevated border border-alert/30 text-alert hover:bg-alert/10 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        )}

        {/* Floating Annotation Toolbar */}
        <div className="absolute top-12 right-3 bg-surface/95 border border-border rounded p-1.5 flex flex-col gap-1 shadow-2xl backdrop-blur-sm z-20 select-none">
          {activeTool !== 'pan' && (
            <div className="text-[10px] font-mono bg-signal/15 text-signal px-2 py-1 rounded border border-signal/30 mb-0.5 text-center">
              {activeTool === 'bbox' ? 'Click & Drag BBox' : 'Click points / Esc to cancel'}
            </div>
          )}

          <button
            onClick={() => setActiveTool('bbox')}
            className={`p-2 rounded text-xs flex items-center justify-between gap-2 transition-all ${
              activeTool === 'bbox'
                ? 'bg-signal/20 text-signal border border-signal/40 font-semibold ring-1 ring-signal/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
            }`}
          >
            <div className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              <span className="text-[11px]">BBox Tool</span>
            </div>
            {activeTool === 'bbox' && <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ping" />}
          </button>

          <button
            onClick={() => setActiveTool('polygon')}
            className={`p-2 rounded text-xs flex items-center justify-between gap-2 transition-all ${
              activeTool === 'polygon'
                ? 'bg-thermal/20 text-thermal border border-thermal/40 font-semibold ring-1 ring-thermal/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
            }`}
          >
            <div className="flex items-center gap-2">
              <Pentagon className="w-4 h-4" />
              <span className="text-[11px]">Polygon Draw</span>
            </div>
            {activeTool === 'polygon' && <span className="w-1.5 h-1.5 rounded-full bg-thermal animate-ping" />}
          </button>

          <button
            onClick={() => setActiveTool('pan')}
            className={`p-2 rounded text-xs flex items-center gap-2 transition-all ${
              activeTool === 'pan'
                ? 'bg-elevated text-text-primary border border-border font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
            }`}
          >
            <Move className="w-4 h-4" />
            <span className="text-[11px]">Zoom / Pan</span>
          </button>

          <div className="h-px bg-border my-0.5" />

          <button
            onClick={() => setShowEvidence(!showEvidence)}
            title="Toggle AI Evidence Outlines"
            className={`p-2 rounded text-xs flex items-center gap-2 transition-colors ${
              showEvidence
                ? 'bg-signal/15 text-signal border border-signal/30'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {showEvidence ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-[11px]">
              {showEvidence ? 'AI Evidence: On' : 'AI Evidence: Off'}
            </span>
          </button>

          {userShapesCount > 0 && (
            <button
              onClick={handleClearUserDrawings}
              title="Delete all your custom drawn boxes & polygons"
              className="p-2 rounded text-xs flex items-center gap-2 text-alert hover:bg-alert/10 transition-colors border border-alert/20"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[11px]">Clear Drawn ({userShapesCount})</span>
            </button>
          )}
        </div>

        {/* Recenter Button */}
        <div className="absolute bottom-6 right-4 flex flex-col items-end gap-2 z-20">
          <button
            onClick={handleRecenter}
            className="p-2 bg-surface/95 border border-border rounded text-text-secondary hover:text-signal shadow-xl flex items-center gap-1.5 text-xs font-mono"
            title="Recenter Map"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Recenter</span>
          </button>
        </div>

        {/* Coordinates Readout */}
        <div className="absolute bottom-2 left-3 bg-surface/85 border border-border px-2.5 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-sm pointer-events-none select-none z-10 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-signal">
            <MapPin className="w-3.5 h-3.5" />
            <span>{cursorCoords.lat}, {cursorCoords.lng}</span>
          </div>
          <span className="text-border">|</span>
          <span className="text-text-muted">{customScene ? customScene.fileName : scene.location}</span>
          <span className="text-border">|</span>
          <span className={isLiveFeed ? 'text-signal font-bold' : 'text-text-secondary'}>
            {customScene ? 'CUSTOM UPLOAD ACTIVE' : isLiveFeed ? 'LIVE 2026 SATELLITE STREAM (NRT PASS)' : '2024 DISASTER ARCHIVE'}
          </span>
        </div>
      </div>
    </main>
  );
};
