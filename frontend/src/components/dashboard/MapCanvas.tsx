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
import { ComparisonSlider } from './ComparisonSlider';
import {
  Maximize2,
  Minimize2,
  Crosshair,
  Pentagon,
  Square,
  Move,
  Eye,
  EyeOff,
  ChevronsLeftRight,
  MapPin,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface MapCanvasProps {
  activeSource: ImagerySource;
  setActiveSource: (s: ImagerySource) => void;
  activeSecondarySource: ImagerySource | null;
  setActiveSecondarySource: (s: ImagerySource | null) => void;
  scene: SceneMetadata;
  center: [number, number];
  zoom: number;
  rois: BoundingBox[];
  mode: AnalysisMode;
  setMode: (m: AnalysisMode) => void;
  band: BandSelection;
  setBand: (b: BandSelection) => void;
  activeTool: 'bbox' | 'polygon' | 'pan';
  setActiveTool: (t: 'bbox' | 'polygon' | 'pan') => void;
  showEvidence: boolean;
  setShowEvidence: (s: boolean) => void;
  customScene?: CustomUploadedScene | null;
  setCustomScene?: (s: CustomUploadedScene | null) => void;
  beforeUrl?: string | null;
  afterUrl?: string | null;
  registrationWarning?: string | null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  activeSource,
  setActiveSource: _setActiveSource,
  activeSecondarySource: _activeSecondarySource,
  setActiveSecondarySource: _setActiveSecondarySource,
  scene,
  center,
  zoom,
  rois,
  mode,
  setMode: _setMode,
  band,
  setBand: _setBand,
  activeTool,
  setActiveTool,
  showEvidence,
  setShowEvidence,
  beforeUrl,
  afterUrl,
  customScene,
  registrationWarning,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const archiveLayerRef = useRef<L.TileLayer | null>(null);
  const liveStreamLayerRef = useRef<L.TileLayer | null>(null);

  const sliderHandleRef = useRef<HTMLDivElement>(null);
  const clipLayerRef = useRef<HTMLDivElement>(null);
  const isDraggingSliderRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  const aiEvidenceLayerRef = useRef<L.LayerGroup | null>(null);
  const userDrawLayerRef = useRef<L.LayerGroup | null>(null);
  const tempDrawLayerRef = useRef<L.LayerGroup | null>(null);

  const [sliderPos, setSliderPos] = useState<number>(50);
  const isDrawingRef = useRef(false);
  const drawStartLatLngRef = useRef<L.LatLng | null>(null);
  const polygonPointsRef = useRef<L.LatLng[]>([]);

  const [isLiveStream] = useState<boolean>(false);

  // Nepal Satellite Image Pan-Zoom Engine
  const [imgZoom, setImgZoom] = useState<number>(1);
  const [imgPan, setImgPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningImgRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [userDrawnBoxes, setUserDrawnBoxes] = useState<Array<{ id: string; x: number; y: number; w: number; h: number }>>([]);
  const [nepalBBoxStart, setNepalBBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [nepalBBoxCurrent, setNepalBBoxCurrent] = useState<{ x: number; y: number } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mapContainerOuterRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (mapContainerOuterRef.current?.requestFullscreen) {
          await mapContainerOuterRef.current.requestFullscreen();
        } else if ((mapContainerOuterRef.current as any)?.webkitRequestFullscreen) {
          await (mapContainerOuterRef.current as any).webkitRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (_err) {
      setIsFullscreen((prev) => !prev);
    }
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);
  const [userShapesCount, setUserShapesCount] = useState<number>(0);
  const [activePolygonPointsCount, setActivePolygonPointsCount] = useState<number>(0);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({
    lat: `${center[0].toFixed(4)}° N`,
    lng: `${center[1].toFixed(4)}° E`,
  });

  const isNepalScene = scene.id === 'SCN-2026-NPL-0827';

  const now = new Date();
  const latestPassDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const revisitDays = activeSource === 'sentinel2' ? 5 : activeSource === 'landsat' ? 8 : 7;
  const previousPassDate = new Date(now.getTime() - (revisitDays + 1) * 24 * 60 * 60 * 1000);

  const liveLatestString = `${latestPassDate.toISOString().slice(0, 10)} 05:44 UTC`;
  const livePreviousString = `${previousPassDate.toISOString().slice(0, 10)} 05:42 UTC`;

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    });

    const archiveLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, maxNativeZoom: 18 }
    ).addTo(map);
    archiveLayerRef.current = archiveLayer;

    const liveLayer = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      { maxZoom: 18, maxNativeZoom: 18 }
    );
    liveStreamLayerRef.current = liveLayer;

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

  // 2. Real-Time Layer Switcher
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !archiveLayerRef.current || !liveStreamLayerRef.current) return;

    if (isLiveStream) {
      map.removeLayer(archiveLayerRef.current);
      liveStreamLayerRef.current.addTo(map);
    } else {
      map.removeLayer(liveStreamLayerRef.current);
      archiveLayerRef.current.addTo(map);
    }

    setTimeout(() => map.invalidateSize(), 300);
  }, [isLiveStream]);

  // 3. AI Evidence Outlines
  useEffect(() => {
    if (!mapInstanceRef.current || !aiEvidenceLayerRef.current) return;
    aiEvidenceLayerRef.current.clearLayers();

    if (showEvidence && !isNepalScene) {
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
        `<div class="font-mono text-xs text-white bg-[#171D26] px-2 py-1 rounded border border-[#232B37]">
          <b>Evidence:</b> ${rois[0]?.label || 'Active Disaster Impact Zone'} <span class="text-[#2DD4C9] font-mono">${rois[0]?.metric || ''}</span>
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
        `<div class="font-mono text-xs text-white bg-[#171D26] px-2 py-1 rounded border border-[#232B37]">
          <b>Evidence:</b> ${rois[1]?.label || 'Infrastructure Severance'}
        </div>`,
        { permanent: false, sticky: true, direction: 'top' }
      );

      aiEvidenceLayerRef.current.addLayer(rect1);
      aiEvidenceLayerRef.current.addLayer(rect2);
    }
  }, [center, rois, showEvidence, isNepalScene]);

  // 4. Slider Drag Engine
  const handleSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDraggingSliderRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSliderRef.current || !containerRef.current) return;
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

    const clientX = e.clientX;
    animationFrameIdRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
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
    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    }
  };

  // 5. Interactive Pan & Zoom for Nepal Full-Frame Image Viewport
  const handleNepalWheel = (e: React.WheelEvent) => {
    if (!isNepalScene) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    setImgZoom((prev) => Math.min(8, Math.max(1, Number((prev * zoomFactor).toFixed(2)))));
  };

  const handleNepalPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isNepalScene || isDraggingSliderRef.current) return;

    if (activeTool === 'bbox') {
      const rect = e.currentTarget.getBoundingClientRect();
      setNepalBBoxStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setNepalBBoxCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }

    isPanningImgRef.current = true;
    panStartRef.current = { x: e.clientX - imgPan.x, y: e.clientY - imgPan.y };
  };

  const handleNepalPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isNepalScene || isDraggingSliderRef.current) return;

    if (activeTool === 'bbox' && nepalBBoxStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      setNepalBBoxCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }

    if (!isPanningImgRef.current) return;
    setImgPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleNepalPointerUp = () => {
    if (activeTool === 'bbox' && nepalBBoxStart && nepalBBoxCurrent) {
      const x = Math.min(nepalBBoxStart.x, nepalBBoxCurrent.x);
      const y = Math.min(nepalBBoxStart.y, nepalBBoxCurrent.y);
      const w = Math.abs(nepalBBoxCurrent.x - nepalBBoxStart.x);
      const h = Math.abs(nepalBBoxCurrent.y - nepalBBoxStart.y);

      if (w > 15 && h > 15) {
        setUserDrawnBoxes((prev) => [...prev, { id: `bbox-${Date.now()}`, x, y, w, h }]);
        setUserShapesCount((c) => c + 1);
      }
      setNepalBBoxStart(null);
      setNepalBBoxCurrent(null);
    }
    isPanningImgRef.current = false;
  };

  useEffect(() => {
    setImgZoom(1);
    setImgPan({ x: 0, y: 0 });
    setSliderPos(50);
  }, [scene.id]);

  const handleClearUserDrawings = () => {
    userDrawLayerRef.current?.clearLayers();
    tempDrawLayerRef.current?.clearLayers();
    setUserDrawnBoxes([]);
    polygonPointsRef.current = [];
    setActivePolygonPointsCount(0);
    setUserShapesCount(0);
  };

  // Drawing Handlers for Leaflet Map
  const updateTempPolygonVisuals = () => {
    tempDrawLayerRef.current?.clearLayers();
    if (polygonPointsRef.current.length > 1) {
      const polyline = L.polyline(polygonPointsRef.current, {
        color: '#2DD4C9',
        weight: 1.5,
        dashArray: '3, 3',
      });
      tempDrawLayerRef.current?.addLayer(polyline);
    }
    polygonPointsRef.current.forEach((pt) => {
      const circle = L.circleMarker(pt, {
        radius: 4,
        color: '#2DD4C9',
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
      color: '#2DD4C9',
      weight: 1.5,
      fillColor: '#2DD4C9',
      fillOpacity: 0.15,
    }).bindTooltip(
      `<div class="font-mono text-xs text-white bg-[#171D26] px-2 py-0.5 rounded border border-[#232B37]">
        Custom ROI #${shapeNumber}
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
      if (e.key === 'Escape') cancelActivePolygon();
      else if (e.key === 'Backspace' && activeTool === 'polygon') undoLastPolygonPoint();
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
        weight: 1.5,
        dashArray: '3, 3',
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
          weight: 1.5,
          fillColor: '#2DD4C9',
          fillOpacity: 0.15,
        }).bindTooltip(
          `<div class="font-mono text-xs text-white bg-[#171D26] px-2 py-0.5 rounded border border-[#232B37]">
            User BBox #${shapeNumber}
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

  useEffect(() => {
    if (mapInstanceRef.current && !isNepalScene) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
      setCursorCoords({
        lat: `${center[0].toFixed(4)}° N`,
        lng: `${center[1].toFixed(4)}° E`,
      });
    }
  }, [center, zoom, scene.id, isNepalScene]);

  const handleRecenter = () => {
    if (isNepalScene) {
      setImgZoom(1);
      setImgPan({ x: 0, y: 0 });
      setSliderPos(50);
      if (sliderHandleRef.current) sliderHandleRef.current.style.left = '50%';
      if (clipLayerRef.current) clipLayerRef.current.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
    } else {
      mapInstanceRef.current?.flyTo(center, zoom, { duration: 1 });
    }
  };

  const handleZoomIn = () => {
    if (isNepalScene) {
      setImgZoom((z) => Math.min(8, Number((z * 1.3).toFixed(2))));
    } else {
      mapInstanceRef.current?.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (isNepalScene) {
      setImgZoom((z) => Math.max(1, Number((z / 1.3).toFixed(2))));
    } else {
      mapInstanceRef.current?.zoomOut();
    }
  };

  const getFilterStyle = (): React.CSSProperties => {
    if (activeSource === 'risat' && mode !== 'Fusion') {
      return { filter: 'grayscale(100%) contrast(180%) brightness(85%)' };
    }
    if (band === 'False Color NIR') {
      return { filter: 'hue-rotate(140deg) saturate(220%) contrast(115%)' };
    }
    if (band === 'NDVI') {
      return { filter: 'hue-rotate(55deg) saturate(260%) contrast(130%) brightness(95%)' };
    }
    if (band === 'NDWI') {
      return { filter: 'hue-rotate(190deg) saturate(280%) contrast(140%) brightness(105%)' };
    }
    if (band === 'SAR-change' || band === 'SAR Coherence') {
      return { filter: 'grayscale(100%) invert(20%) contrast(200%) brightness(90%)' };
    }
    if (mode === 'Fusion') {
      return { filter: 'contrast(140%) saturate(130%) brightness(102%)' };
    }
    return { filter: 'saturate(110%) contrast(105%)' };
  };

  const currentShapesTotal = isNepalScene ? userDrawnBoxes.length : userShapesCount;

  const hasCustomUploads = Boolean(beforeUrl || afterUrl || customScene);

  let effectiveBeforeUrl: string | null = null;
  let effectiveAfterUrl: string | null = null;

  if (hasCustomUploads) {
    effectiveBeforeUrl = beforeUrl || afterUrl || customScene?.singleUrl || null;
    effectiveAfterUrl = afterUrl || beforeUrl || customScene?.singleUrl || null;
  } else if (isNepalScene) {
    effectiveBeforeUrl = '/mock-scenes/nepal_before_12aug.jpg';
    effectiveAfterUrl = '/mock-scenes/nepal_after_27aug.jpg';
  }

  const showFullFrameViewer = Boolean(effectiveBeforeUrl || effectiveAfterUrl);

  return (
    <main
      ref={mapContainerOuterRef}
      className={`flex-1 flex flex-col bg-base overflow-hidden relative ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-56px)]'
      }`}
    >
      {/* Floating Map Controls Tray */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2 pointer-events-none">
        {/* Right: Fullscreen Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
            className="p-2 rounded-lg bg-surface/95 backdrop-blur-md border border-border text-text-secondary hover:text-text-primary shadow-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-[#06090c] overflow-hidden select-none touch-none"
      >
        {/* SCENARIO A: DUAL SATELLITE FULL-FRAME IMAGE VIEWER (Nepal or Custom Uploads) */}
        {showFullFrameViewer ? (
          <div
            onWheel={handleNepalWheel}
            onPointerDown={handleNepalPointerDown}
            onPointerMove={handleNepalPointerMove}
            onPointerUp={handleNepalPointerUp}
            className={`absolute inset-0 w-full h-full bg-[#06090c] flex items-center justify-center overflow-hidden ${
              activeTool === 'bbox'
                ? 'cursor-crosshair'
                : imgZoom > 1
                ? 'cursor-grab active:cursor-grabbing'
                : 'cursor-default'
            }`}
          >
            {/* 1. Base Layer (Pre-Event T0 - Right Side) */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
              <div
                className="w-full h-full flex items-center justify-center will-change-transform"
                style={{
                  transform: `translate(${imgPan.x}px, ${imgPan.y}px) scale(${imgZoom})`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={effectiveBeforeUrl || '/mock-scenes/nepal_before_12aug.jpg'}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!hasCustomUploads && !target.src.endsWith('/nepal_before_12aug.jpg')) {
                      target.src = '/nepal_before_12aug.jpg';
                    }
                  }}
                  alt="Pre-Event Satellite Imagery (T0)"
                  className="max-w-full max-h-full object-contain select-none"
                  style={getFilterStyle()}
                />
              </div>
            </div>

            {/* 2. Screen-Level Clipped Layer (Post-Event T1 - Left Side) */}
            {mode === 'Change Detection' && (
              <div
                ref={clipLayerRef}
                className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none will-change-[clip-path]"
                style={{
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                }}
              >
                <div
                  className="w-full h-full flex items-center justify-center will-change-transform"
                  style={{
                    transform: `translate(${imgPan.x}px, ${imgPan.y}px) scale(${imgZoom})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <img
                    src={effectiveAfterUrl || '/mock-scenes/nepal_after_27aug.jpg'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!hasCustomUploads && !target.src.endsWith('/nepal_after_27aug.jpg')) {
                        target.src = '/nepal_after_27aug.jpg';
                      }
                    }}
                    alt="Post-Event Satellite Imagery (T1)"
                    className="max-w-full max-h-full object-contain select-none"
                    style={getFilterStyle()}
                  />
                </div>
              </div>
            )}

            {/* In-Progress BBox Drawing HUD */}
            {nepalBBoxStart && nepalBBoxCurrent && (
              <div
                className="absolute border-2 border-signal bg-signal/15 pointer-events-none z-30"
                style={{
                  left: Math.min(nepalBBoxStart.x, nepalBBoxCurrent.x),
                  top: Math.min(nepalBBoxStart.y, nepalBBoxCurrent.y),
                  width: Math.abs(nepalBBoxCurrent.x - nepalBBoxStart.x),
                  height: Math.abs(nepalBBoxCurrent.y - nepalBBoxStart.y),
                }}
              />
            )}

            {/* Finalized User Drawn Boxes */}
            {userDrawnBoxes.map((box, idx) => (
              <div
                key={box.id}
                className="absolute border-2 border-signal bg-signal/10 pointer-events-none z-20"
                style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
              >
                <div className="absolute -top-5 left-0 bg-[#171D26] px-1.5 py-0.5 rounded text-[9px] font-mono text-signal border border-signal/40">
                  User ROI #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* SCENARIO B: STANDARD LEAFLET SATELLITE MAP OR COMPARISON SLIDER */
          mode === 'Change Detection' ? (
            <ComparisonSlider
              source={activeSource}
              band={band}
              preDateLabel={scene.captureDatePre}
              postDateLabel={scene.captureDatePost}
              sliderPos={sliderPos}
              setSliderPos={setSliderPos}
              realBeforeUrl={beforeUrl}
              realAfterUrl={afterUrl}
              registrationWarning={registrationWarning}
            />
          ) : (
            <div ref={mapContainerRef} className="w-full h-full" style={getFilterStyle()} />
          )
        )}

        {/* Confined Slider Divider (For Nepal Scene or Custom Uploads) */}
        {showFullFrameViewer && mode === 'Change Detection' && (
          <>
            <div
              ref={sliderHandleRef}
              className="absolute top-14 bottom-10 w-10 -ml-5 flex items-center justify-center cursor-ew-resize z-25 touch-none will-change-[left]"
              style={{ left: `${sliderPos}%` }}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
            >
              <div className="w-0.5 h-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)]" />
              <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface border-2 border-white flex items-center justify-center shadow-2xl pointer-events-none text-signal">
                <ChevronsLeftRight className="w-4 h-4 text-signal" />
              </div>
            </div>

            {/* Date Pills */}
            <div className="absolute bottom-12 left-16 bg-surface/95 border border-border px-2.5 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-md pointer-events-none z-20 shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
              <span className="text-text-muted">POST-EVENT (T1):</span>
              <span className="text-signal font-semibold">
                {afterUrl
                  ? 'Uploaded T1 Image'
                  : beforeUrl
                  ? 'Awaiting T1 Upload'
                  : isNepalScene
                  ? '27 August 2026'
                  : isLiveStream
                  ? liveLatestString
                  : scene.captureDatePost}
              </span>
            </div>
            <div className="absolute bottom-12 right-4 bg-surface/95 border border-border px-2.5 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-md pointer-events-none z-20 shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
              <span className="text-text-muted">PRE-EVENT (T0):</span>
              <span className="text-text-secondary">
                {beforeUrl
                  ? 'Uploaded T0 Image'
                  : afterUrl
                  ? 'Awaiting T0 Upload'
                  : isNepalScene
                  ? '12 August 2026'
                  : isLiveStream
                  ? livePreviousString
                  : scene.captureDatePre}
              </span>
            </div>
          </>
        )}



        {/* DOCKED VERTICAL MAP TOOLBAR */}
        <div className="absolute top-16 left-4 bg-surface/95 border border-border rounded-lg p-1 flex flex-col gap-1 shadow-lg backdrop-blur-md z-25 select-none">

          <div className="relative group">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-border rounded text-[10px] font-mono text-text-primary whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Zoom In
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-border rounded text-[10px] font-mono text-text-primary whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Zoom Out
            </div>
          </div>

          <div className="h-px bg-border my-0.5" />

          <div className="relative group">
            <button
              onClick={() => setActiveTool('bbox')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'bbox'
                  ? 'bg-signal text-base font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>
            <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-border rounded text-[10px] font-mono text-text-primary whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Bounding Box ROI
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setActiveTool('polygon')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'polygon'
                  ? 'bg-signal text-base font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
              }`}
            >
              <Pentagon className="w-4 h-4" />
            </button>
            <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-border rounded text-[10px] font-mono text-text-primary whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Polygon Area Tool
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => setActiveTool('pan')}
              className={`p-2 rounded transition-colors ${
                activeTool === 'pan'
                  ? 'bg-elevated text-signal border border-border'
                  : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
              }`}
            >
              <Move className="w-4 h-4" />
            </button>
            <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-border rounded text-[10px] font-mono text-text-primary whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Pan & Inspect
            </div>
          </div>

          <div className="h-px bg-border my-0.5" />

          <div className="relative group">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className={`p-2 rounded transition-colors ${
                showEvidence ? 'text-signal bg-signal/10' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {showEvidence ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-border rounded text-[10px] font-mono text-text-primary whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {showEvidence ? 'Hide Evidence Outlines' : 'Show Evidence Outlines'}
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={handleRecenter}
              className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-border rounded text-[10px] font-mono text-text-primary whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Recenter Extents
            </div>
          </div>

          {currentShapesTotal > 0 && (
            <div className="relative group">
              <button
                onClick={handleClearUserDrawings}
                className="p-2 rounded text-alert hover:bg-alert/10 transition-colors"
                title={`Delete ${currentShapesTotal} drawn shape(s)`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="pointer-events-none absolute left-[44px] top-1/2 -translate-y-1/2 px-2 py-1 bg-elevated border border-alert/30 rounded text-[10px] font-mono text-alert whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Delete {currentShapesTotal} Drawn Shape(s)
              </div>
            </div>
          )}
        </div>

        {/* Polygon In-Progress Actions HUD */}
        {!isNepalScene && activeTool === 'polygon' && activePolygonPointsCount > 0 && (
          <div className="absolute top-16 left-16 bg-surface/95 border border-border px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md z-30 flex items-center gap-2 font-mono text-xs">
            <span className="text-text-primary">{activePolygonPointsCount} point(s) placed</span>
            <div className="h-3 w-px bg-border mx-1" />
            <button
              onClick={finishPolygon}
              disabled={activePolygonPointsCount < 3}
              className="px-2 py-0.5 rounded bg-signal text-base font-semibold disabled:opacity-30"
            >
              Close Polygon
            </button>
            <button
              onClick={undoLastPolygonPoint}
              className="px-2 py-0.5 rounded bg-elevated border border-border text-text-secondary hover:text-text-primary"
            >
              Undo
            </button>
            <button
              onClick={cancelActivePolygon}
              className="px-2 py-0.5 rounded bg-elevated border border-border text-text-muted hover:text-alert"
            >
              Cancel (Esc)
            </button>
          </div>
        )}

        {/* Bottom Coordinates & Zoom Status Bar */}
        <div className="absolute bottom-2 left-4 bg-surface/90 border border-border px-3 py-1 rounded text-[11px] font-mono text-text-primary backdrop-blur-md pointer-events-none select-none z-20 flex items-center gap-3 shadow-md">
          <div className="flex items-center gap-1.5 text-signal">
            <MapPin className="w-3 h-3" />
            <span>{isNepalScene ? '27.9850° N, 85.1680° E' : `${cursorCoords.lat}, ${cursorCoords.lng}`}</span>
          </div>
          <span className="text-border">|</span>
          <span className="text-text-muted">{scene.location}</span>
          <span className="text-border">|</span>
          <span className="text-text-secondary">
            {isNepalScene
              ? `Zoom: ${imgZoom.toFixed(1)}x • Copernicus Sentinel-2 (10m L2A)`
              : isLiveStream
              ? `LIVE REVISIT ORBIT PASS • ${liveLatestString}`
              : 'Copernicus Sentinel-2 • 10m L2A'}
          </span>
          {currentShapesTotal > 0 && (
            <>
              <span className="text-border">|</span>
              <span className="text-signal font-medium">{currentShapesTotal} Custom ROI(s)</span>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
