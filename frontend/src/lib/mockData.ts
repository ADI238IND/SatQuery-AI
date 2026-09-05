import type {
  ImagerySource,
  SensorMetadata,
  SceneMetadata,
  AnalysisPayload,
  ChatMessage,
  CompatibilityCheck,
  BoundingBox,
} from './types';

export const SOURCE_IMAGERY: Record<ImagerySource, SensorMetadata> = {
  sentinel2: {
    id: 'sentinel2',
    label: 'Sentinel-2',
    kind: 'optical',
    platform: 'Copernicus Sentinel-2B MSI',
    gsdMeters: 10.0,
    bands: ['B2 (Blue 490nm)', 'B3 (Green 560nm)', 'B4 (Red 665nm)', 'B8 (VNIR 842nm)'],
    incidenceOrSunElevation: 'Sun Elev: 61.4°',
    crs: 'EPSG:32645 (UTM Zone 45N)',
    description: 'Level-2A Bottom-Of-Atmosphere (BOA) reflectance with atmospheric correction.',
    mockUrl: '/mock-scenes/nepal_sentinel2_l2a.tif',
  },
  landsat: {
    id: 'landsat',
    label: 'LANDSAT',
    kind: 'optical',
    platform: 'USGS/NASA Landsat 9 OLI-2',
    gsdMeters: 30.0,
    bands: ['B2 (Blue)', 'B3 (Green)', 'B4 (Red)', 'B5 (NIR)', 'B6 (SWIR-1)'],
    incidenceOrSunElevation: 'Sun Elev: 58.2°',
    crs: 'EPSG:32645 (UTM Zone 45N)',
    description: 'Collection 2 Level-2 Surface Reflectance with 15m pan-sharpened overlay.',
    mockUrl: '/mock-scenes/nepal_landsat9_c2.tif',
  },
  risat: {
    id: 'risat',
    label: 'RISAT (SAR)',
    kind: 'sar',
    platform: 'ISRO RISAT-1A (EOS-04) SAR',
    gsdMeters: 3.0,
    bands: ['C-Band (5.35 GHz)', 'RH/RV Hybrid Pol', 'HH/HV Coherent Backscatter'],
    incidenceOrSunElevation: 'Incidence Angle: 38.5°',
    crs: 'EPSG:32645 (UTM Zone 45N)',
    description: 'Fine Resolution Stripmap (FRS-1) calibrated backscatter in Gamma0 (dB).',
    mockUrl: '/mock-scenes/nepal_risat1a_cband.tif',
  },
};

export interface MissionCatalogItem {
  id: string;
  name: string;
  category: 'Golden Benchmark' | 'State & Region' | 'Disaster Zone';
  state: string;
  center: [number, number];
  zoom: number;
  scene: SceneMetadata;
  rois: BoundingBox[];
  payload: AnalysisPayload;
  initialQuery: string;
}

export const MISSION_CATALOGS: Record<string, MissionCatalogItem> = {
  'Nepal Flash Floods — Trishuli River Valley': {
    id: 'SCN-2026-NPL-0827',
    name: 'Nepal Flash Floods — Trishuli River Valley',
    category: 'Golden Benchmark',
    state: 'Bagmati Province, Nepal',
    center: [27.9850, 85.1680],
    zoom: 13,
    scene: {
      id: 'SCN-2026-NPL-0827',
      title: 'Trishuli River Flash Flood & Glacier Collapse',
      location: 'Trishuli & Langtang Basin, Rasuwa / Nuwakot, Nepal',
      targetBbox: '27.8810° N, 85.0520° E to 28.1240° N, 85.3120° E',
      captureDatePre: '2026-08-12 05:15 UTC',
      captureDatePost: '2026-08-27 05:20 UTC',
      sunElevation: 67.4,
      satellitePlatform: 'Copernicus Sentinel-2B MSI',
      gsdMeters: 10.0,
      crs: 'EPSG:32645 (UTM Zone 45N)',
    },
    rois: [
      { id: 'roi-npl-1', label: 'ROI 01 — Trishuli Riverbed Sediment Surge', category: 'water', coordinates: { x: 34, y: 24, width: 32, height: 46 }, metric: '+78% Surge Width' },
      { id: 'roi-npl-2', label: 'ROI 02 — Betrawati Bridge & Highway Washout', category: 'infrastructure', coordinates: { x: 52, y: 48, width: 18, height: 18 }, metric: 'Road Severed' },
    ],
    initialQuery: 'Compare Sentinel-2 12 Aug vs 27 Aug passes to quantify sediment deposition and riverbed widening along Trishuli valley.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Catastrophic debris flood triggered by high-altitude glacier collapse along Langtang Lirung. Copernicus Sentinel-2 comparison reveals the Trishuli river course widened by 78%, depositing heavy pale-brown sediment across the valley floor and severing the Betrawati transport corridor.',
      confidence: 0.98,
      groundedRegionsCount: 56,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32645 / 99% overlap', details: { mission: 'Copernicus Sentinel-2B', crs: 'EPSG:32645', overlap_pct: 99.2 } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'detect_glacier_flash_flood', details: { basin: 'Trishuli River', province: 'Bagmati' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'NDWI_Silt_Index, CVA_Sediment', details: { tools: ['NDWI_Thresholding', 'Change_Vector_Analysis'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 98%', details: { f1_score: 0.978, support_regions: 56 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 310 } },
      ],
      evidence: [],
      warnings: ['Post-event imagery contains 28% monsoonal cumulus cloud patches over southern ridges.'],
      metrics: { changedAreaKm2: 18.64, changedPixels: 186400, cloudCoverPct: 28.4, opticalWeight: 0.7, sarWeight: 0.3, ndwiShift: 0.62 },
      histograms: [
        { bin: '-0.4 to -0.2', probability: 0.48, baseline: 0.08 },
        { bin: '-0.2 to 0.0', probability: 0.28, baseline: 0.12 },
        { bin: '0.0 to 0.2', probability: 0.12, baseline: 0.22 },
        { bin: '0.2 to 0.4', probability: 0.08, baseline: 0.34 },
        { bin: '0.4 to 0.8', probability: 0.04, baseline: 0.24 },
      ],
    },
  },
};

export const ACTIVE_SCENE = MISSION_CATALOGS['Nepal Flash Floods — Trishuli River Valley'].scene;
export const INITIAL_PAYLOAD = MISSION_CATALOGS['Nepal Flash Floods — Trishuli River Valley'].payload;
export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'user',
    timestamp: '10:14:02',
    queryText: MISSION_CATALOGS['Nepal Flash Floods — Trishuli River Valley'].initialQuery,
  },
  {
    id: 'msg-init-2',
    sender: 'assistant',
    timestamp: '10:14:05',
    payload: MISSION_CATALOGS['Nepal Flash Floods — Trishuli River Valley'].payload,
  },
];

export const generateCompatibilityChecks = (
  primary: ImagerySource,
  secondary: ImagerySource | null,
  isFusion: boolean
): CompatibilityCheck[] => {
  const sensor1 = SOURCE_IMAGERY[primary];
  const sensor2 = secondary ? SOURCE_IMAGERY[secondary] : null;

  return [
    {
      id: 'chk-fmt',
      name: 'Raster Format',
      status: 'pass',
      value: 'Cloud Optimized GeoTIFF ✓',
      details: 'COG with internal overviews and standard tile dimensions (512x512).',
      critical: true,
    },
    {
      id: 'chk-crs',
      name: 'CRS Match',
      status: 'pass',
      value: `${sensor1.crs.split(' ')[0]} ✓`,
      details: 'Coordinate reference match between active sensor layers.',
      critical: true,
    },
    {
      id: 'chk-bands',
      name: 'Band Schema',
      status: 'pass',
      value: isFusion && sensor2 ? 'VNIR + C-Band Coherence ✓' : `${sensor1.kind.toUpperCase()} Schema ✓`,
      details: `Active sensor: ${sensor1.platform} (${sensor1.bands.slice(0, 2).join(', ')}).`,
      critical: true,
    },
    {
      id: 'chk-overlap',
      name: 'Geographic Overlap',
      status: 'pass',
      value: 'Overlap: 99.2% ✓',
      details: 'Footprint intersection exceeds required 80% threshold.',
      critical: true,
    },
    {
      id: 'chk-registration',
      name: 'Sub-Pixel Registration',
      status: primary === 'risat' ? 'warn' : 'pass',
      value: primary === 'risat' ? '1.1px Offset ⚠' : '0.3px Sub-pixel ✓',
      details:
        primary === 'risat'
          ? 'SAR foreshortening along steep slopes introduces minor geocoding offset.'
          : 'Optical tie points co-registered within sub-pixel bounds.',
      critical: false,
    },
  ];
};
