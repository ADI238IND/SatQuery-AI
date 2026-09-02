/**
 * ============================================================================
 * SATQUERY AI — BENCHMARK CATALOG & SENSOR REGISTRY
 * ============================================================================
 * 
 * 📌 DEVELOPER REFERENCE FOR TEAMMATES:
 * - 🔌 Backend Team: Replace `SOURCE_IMAGERY` and `MISSION_CATALOGS` with:
 *     GET /api/v1/sensors
 *     GET /api/v1/scenes
 * - 🗄️ Database Team: These records represent default seed rows in PostgreSQL
 * - 🧠 ML Team: `payload` objects contain reference ground-truth outputs
 */

import type {
  ImagerySource,
  SensorMetadata,
  SceneMetadata,
  AnalysisPayload,
  ChatMessage,
  CompatibilityCheck,
  BoundingBox,
} from './types';

// ============================================================================
// 1. SATELLITE SENSOR REGISTRY
// 🔌 BACKEND TEAM: Point `mockUrl` to your TiTiler / Cloud-Optimized GeoTIFF server
// ============================================================================
export const SOURCE_IMAGERY: Record<ImagerySource, SensorMetadata> = {
  sentinel2: {
    id: 'sentinel2',
    label: 'Sentinel-2',
    kind: 'optical',
    platform: 'Copernicus Sentinel-2B MSI',
    gsdMeters: 10.0,
    bands: ['B2 (Blue 490nm)', 'B3 (Green 560nm)', 'B4 (Red 665nm)', 'B8 (VNIR 842nm)'],
    incidenceOrSunElevation: 'Sun Elev: 61.4°',
    crs: 'EPSG:32643 (UTM Zone 44N)',
    description: 'Level-2A Bottom-Of-Atmosphere (BOA) reflectance with atmospheric correction.',
    mockUrl: '/mock-scenes/uttarakhand_sentinel2_l2a.tif',
  },
  landsat: {
    id: 'landsat',
    label: 'LANDSAT',
    kind: 'optical',
    platform: 'USGS/NASA Landsat 9 OLI-2',
    gsdMeters: 30.0,
    bands: ['B2 (Blue)', 'B3 (Green)', 'B4 (Red)', 'B5 (NIR)', 'B6 (SWIR-1)'],
    incidenceOrSunElevation: 'Sun Elev: 58.2°',
    crs: 'EPSG:32643 (UTM Zone 44N)',
    description: 'Collection 2 Level-2 Surface Reflectance with 15m pan-sharpened overlay.',
    mockUrl: '/mock-scenes/uttarakhand_landsat9_c2.tif',
  },
  risat: {
    id: 'risat',
    label: 'RISAT (SAR)',
    kind: 'sar',
    platform: 'ISRO RISAT-1A (EOS-04) SAR',
    gsdMeters: 3.0,
    bands: ['C-Band (5.35 GHz)', 'RH/RV Hybrid Pol', 'HH/HV Coherent Backscatter'],
    incidenceOrSunElevation: 'Incidence Angle: 38.5°',
    crs: 'EPSG:32643 (UTM Zone 44N)',
    description: 'Fine Resolution Stripmap (FRS-1) calibrated backscatter in Gamma0 (dB).',
    mockUrl: '/mock-scenes/uttarakhand_risat1a_cband.tif',
  },
};

// ============================================================================
// 2. PAN-INDIA MISSION CATALOG & BENCHMARKS
// 🗄️ DB TEAM: Maps to `projects` and `scenes` tables in PostGIS
// ============================================================================
export interface MissionCatalogItem {
  id: string;
  name: string;
  category: 'Golden Benchmark' | 'State & Region' | 'Disaster Zone';
  state: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  scene: SceneMetadata;
  rois: BoundingBox[];
  payload: AnalysisPayload;
  initialQuery: string;
}

export const MISSION_CATALOGS: Record<string, MissionCatalogItem> = {
  'Uttarakhand Floods — Chamoli Basin': {
    id: 'SCN-2024-UTT-0914',
    name: 'Uttarakhand Floods — Chamoli Basin',
    category: 'Golden Benchmark',
    state: 'Uttarakhand',
    center: [30.4124, 79.3288],
    zoom: 14,
    scene: {
      id: 'SCN-2024-UTT-0914',
      title: 'Uttarakhand Floods — Chamoli Basin Confluence',
      location: 'Alaknanda River Basin, Chamoli, Uttarakhand',
      targetBbox: '30.3842° N, 79.3288° E to 30.5621° N, 79.5412° E',
      captureDatePre: '2024-08-11 05:42 UTC',
      captureDatePost: '2024-08-28 05:44 UTC',
      sunElevation: 61.4,
      satellitePlatform: 'Sentinel-2B MSI + RISAT-1A SAR',
      gsdMeters: 10.0,
      crs: 'EPSG:32643 (UTM Zone 44N)',
    },
    rois: [
      { id: 'roi-utt-1', label: 'ROI 01 — River Corridor Inundation Surge', category: 'water', coordinates: { x: 34, y: 28, width: 28, height: 38 }, metric: '+64% Surge' },
      { id: 'roi-utt-2', label: 'ROI 02 — Submerged Pier Embankment', category: 'infrastructure', coordinates: { x: 55, y: 46, width: 14, height: 16 }, metric: 'Severed Access' },
    ],
    initialQuery: 'Evaluate flood boundary migration and infrastructure severance along the main river corridor.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Severe riverbank inundation identified along the northern confluence. Silt and water accumulation expanded active channel width by 64% with bank terrace scouring.',
      confidence: 0.94,
      groundedRegionsCount: 42,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32643 / 94% overlap', details: { crs: 'EPSG:32643', overlap_pct: 94.2 } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'detect_change', details: { target: 'Alaknanda_Confluence' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'NDWI_Thresholding, SAR_Coherence', details: { tools: ['NDWI_Thresholding', 'Change_Vector'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 94%', details: { agreement: 0.941 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Telemetry packaged', details: { latency_ms: 382 } },
      ],
      evidence: [],
      warnings: ['Residual misalignment is 1.2px in steep valley shadows.'],
      metrics: { changedAreaKm2: 14.82, changedPixels: 148200, cloudCoverPct: 18.4, opticalWeight: 0.65, sarWeight: 0.35, ndwiShift: 0.41 },
      histograms: [
        { bin: '-0.2 to 0.0', probability: 0.38, baseline: 0.12 },
        { bin: '0.0 to 0.2', probability: 0.24, baseline: 0.18 },
        { bin: '0.2 to 0.4', probability: 0.18, baseline: 0.22 },
        { bin: '0.4 to 0.6', probability: 0.12, baseline: 0.31 },
        { bin: '0.6 to 0.8', probability: 0.08, baseline: 0.17 },
      ],
    },
  },

  'Wayanad Landslide — Meppadi Corridor': {
    id: 'SCN-2024-WAY-0802',
    name: 'Wayanad Landslide — Meppadi Corridor',
    category: 'Golden Benchmark',
    state: 'Kerala',
    center: [11.5516, 76.1264],
    zoom: 14,
    scene: {
      id: 'SCN-2024-WAY-0802',
      title: 'Wayanad Landslide — Chooralmala & Meppadi Sector',
      location: 'Iruvaiphuzha Basin, Meppadi, Wayanad, Kerala',
      targetBbox: '11.4812° N, 76.0821° E to 11.6120° N, 76.1844° E',
      captureDatePre: '2024-07-25 04:58 UTC',
      captureDatePost: '2024-08-02 05:01 UTC',
      sunElevation: 68.2,
      satellitePlatform: 'Sentinel-2B MSI + RISAT-1A SAR',
      gsdMeters: 10.0,
      crs: 'EPSG:32643 (UTM Zone 43N)',
    },
    rois: [
      { id: 'roi-way-1', label: 'ROI 01 — Debris Flow Avalanche Runout Track', category: 'hazard', coordinates: { x: 38, y: 22, width: 22, height: 48 }, metric: '3.8 km Track' },
      { id: 'roi-way-2', label: 'ROI 02 — Chooralmala Bridge Embankment Breach', category: 'infrastructure', coordinates: { x: 50, y: 52, width: 16, height: 18 }, metric: 'Severance' },
    ],
    initialQuery: 'Quantify landslide crown displacement and debris scar volume along the Mundakkai slope.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Massive slope failure identified at Vellarimala crown. Debris avalanche surged down 3.8 km along the Iruvaiphuzha riverbed, scouring plantation terraces.',
      confidence: 0.96,
      groundedRegionsCount: 38,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32643 / 98% overlap', details: { sensor: 'Sentinel-2 / RISAT' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'detect_landslide_debris', details: { region: 'Meppadi' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'NDVI_Loss, Slope_Morphology', details: { tools: ['NDVI_Anomaly', 'SAR_Coherence'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 96%', details: { f1: 0.958 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 310 } },
      ],
      evidence: [],
      warnings: ['Heavy monsoonal cloud masking penetrated via C-Band SAR.'],
      metrics: { changedAreaKm2: 6.45, changedPixels: 64500, cloudCoverPct: 74.2, opticalWeight: 0.4, sarWeight: 0.6, ndwiShift: 0.52 },
      histograms: [
        { bin: '-0.4 to -0.2', probability: 0.44, baseline: 0.08 },
        { bin: '-0.2 to 0.0', probability: 0.28, baseline: 0.12 },
        { bin: '0.0 to 0.2', probability: 0.14, baseline: 0.20 },
        { bin: '0.2 to 0.4', probability: 0.08, baseline: 0.32 },
        { bin: '0.4 to 0.8', probability: 0.06, baseline: 0.28 },
      ],
    },
  },

  'Assam Brahmaputra — Kaziranga Sector': {
    id: 'SCN-2024-ASM-0716',
    name: 'Assam Brahmaputra — Kaziranga Sector',
    category: 'Golden Benchmark',
    state: 'Assam',
    center: [26.5828, 93.1711],
    zoom: 12,
    scene: {
      id: 'SCN-2024-ASM-0716',
      title: 'Brahmaputra Floodplains — Kaziranga National Park',
      location: 'Brahmaputra Corridor, Nagaon/Golaghat, Assam',
      targetBbox: '26.4510° N, 93.0120° E to 26.7214° N, 93.3840° E',
      captureDatePre: '2024-06-28 04:30 UTC',
      captureDatePost: '2024-07-16 04:33 UTC',
      sunElevation: 63.8,
      satellitePlatform: 'Sentinel-2B MSI + LANDSAT-9',
      gsdMeters: 10.0,
      crs: 'EPSG:32646 (UTM Zone 46N)',
    },
    rois: [
      { id: 'roi-asm-1', label: 'ROI 01 — Floodplain Wetland Submergence', category: 'water', coordinates: { x: 30, y: 30, width: 44, height: 42 }, metric: '82% Inundation' },
      { id: 'roi-asm-2', label: 'ROI 02 — NH-715 Animal Corridor Bypass', category: 'infrastructure', coordinates: { x: 42, y: 68, width: 26, height: 14 }, metric: 'Submerged' },
    ],
    initialQuery: 'Delineate flooded wildlife corridors and high-ground artificial highlands submergence.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Over 82% of Kaziranga lowlands are inundated by Brahmaputra overflow. Animal migratory corridors towards Karbi Anglong hills are bisected by floodwaters.',
      confidence: 0.97,
      groundedRegionsCount: 64,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32646 / 99% overlap', details: { crs: 'EPSG:32646' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'large_scale_flood_delineation', details: { area: 'Kaziranga' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'MNDWI_Water_Index, SWIR_Penetration', details: { indices: ['MNDWI'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 97%', details: { precision: 0.972 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 360 } },
      ],
      evidence: [],
      warnings: [],
      metrics: { changedAreaKm2: 48.2, changedPixels: 482000, cloudCoverPct: 22.1, opticalWeight: 0.7, sarWeight: 0.3, ndwiShift: 0.61 },
      histograms: [
        { bin: '-0.3 to -0.1', probability: 0.52, baseline: 0.18 },
        { bin: '-0.1 to 0.1', probability: 0.22, baseline: 0.22 },
        { bin: '0.1 to 0.3', probability: 0.14, baseline: 0.24 },
        { bin: '0.3 to 0.5', probability: 0.08, baseline: 0.20 },
        { bin: '0.5 to 0.7', probability: 0.04, baseline: 0.16 },
      ],
    },
  },

  'Sikkim Glacial Lake Outburst (GLOF) — South Lhonak': {
    id: 'SCN-2023-SKM-1004',
    name: 'Sikkim Glacial Lake Outburst (GLOF) — South Lhonak',
    category: 'Disaster Zone',
    state: 'Sikkim',
    center: [27.912, 88.204],
    zoom: 13,
    scene: {
      id: 'SCN-2023-SKM-1004',
      title: 'South Lhonak Glacial Lake Breach — Teesta Basin',
      location: 'South Lhonak Glacier, North Sikkim',
      targetBbox: '27.8210° N, 88.1020° E to 28.0140° N, 88.3240° E',
      captureDatePre: '2023-09-28 04:45 UTC',
      captureDatePost: '2023-10-04 05:12 UTC',
      sunElevation: 54.2,
      satellitePlatform: 'RISAT-1A SAR + Sentinel-2',
      gsdMeters: 3.0,
      crs: 'EPSG:32645 (UTM Zone 45N)',
    },
    rois: [
      { id: 'roi-skm-1', label: 'ROI 01 — Moraine Dam Breach Scar', category: 'hazard', coordinates: { x: 32, y: 25, width: 34, height: 40 }, metric: '65% Moraine Collapse' },
      { id: 'roi-skm-2', label: 'ROI 02 — Chungthang Dam Flash Flood Track', category: 'infrastructure', coordinates: { x: 52, y: 55, width: 20, height: 20 }, metric: 'Chungthang Washout' },
    ],
    initialQuery: 'Assess moraine dam rupture boundary and downstream Teesta flash flood scar.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'South Lhonak Lake surface area shrank by 62% following lateral moraine failure. Flash flood surge rushed down Teesta-III Chungthang Dam.',
      confidence: 0.98,
      groundedRegionsCount: 46,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32645 / 96% overlap', details: { glacier: 'South Lhonak' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'glof_moraine_breach_detection', details: { elevation: '5200m' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'SAR_Backscatter, NDSI_Snow_Ice', details: { tools: ['SAR_Coherence'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 98%', details: { score: 0.982 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 340 } },
      ],
      evidence: [],
      warnings: ['High-altitude cloud cover penetrated via RISAT C-Band SAR.'],
      metrics: { changedAreaKm2: 8.92, changedPixels: 89200, cloudCoverPct: 45.0, opticalWeight: 0.35, sarWeight: 0.65, ndwiShift: 0.78 },
      histograms: [
        { bin: '-0.5 to -0.3', probability: 0.58, baseline: 0.10 },
        { bin: '-0.3 to -0.1', probability: 0.20, baseline: 0.15 },
        { bin: '-0.1 to 0.1', probability: 0.12, baseline: 0.25 },
        { bin: '0.1 to 0.3', probability: 0.06, baseline: 0.30 },
        { bin: '0.3 to 0.5', probability: 0.04, baseline: 0.20 },
      ],
    },
  },

  'Himachal Pradesh — Beas River Flash Floods': {
    id: 'SCN-2023-HP-0710',
    name: 'Himachal Pradesh — Beas River Flash Floods',
    category: 'Disaster Zone',
    state: 'Himachal Pradesh',
    center: [31.956, 77.109],
    zoom: 13,
    scene: {
      id: 'SCN-2023-HP-0710',
      title: 'Kullu-Manali Valley — Beas River Surge & Landslides',
      location: 'Beas River Basin, Kullu Valley, Himachal Pradesh',
      targetBbox: '31.8410° N, 77.0120° E to 32.1240° N, 77.2840° E',
      captureDatePre: '2023-06-25 05:20 UTC',
      captureDatePost: '2023-07-10 05:24 UTC',
      sunElevation: 64.0,
      satellitePlatform: 'Sentinel-2B MSI + LANDSAT-9',
      gsdMeters: 10.0,
      crs: 'EPSG:32643 (UTM Zone 43N)',
    },
    rois: [
      { id: 'roi-hp-1', label: 'ROI 01 — Aut-Pandoh Highway Scour', category: 'infrastructure', coordinates: { x: 36, y: 32, width: 30, height: 36 }, metric: 'NH-3 Severed' },
    ],
    initialQuery: 'Map road embankment washouts and river channel widening along Kullu highway.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Beas River channel widened by up to 210 meters in Kullu valley, washing away stretches of NH-3 and bridges.',
      confidence: 0.95,
      groundedRegionsCount: 34,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32643 / 97% overlap', details: { basin: 'Beas' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'riparian_erosion_mapping', details: { valley: 'Kullu' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'NDWI, Otsu_Thresholding', details: { tools: ['NDWI'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 95%', details: { score: 0.951 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 320 } },
      ],
      evidence: [],
      warnings: [],
      metrics: { changedAreaKm2: 11.2, changedPixels: 112000, cloudCoverPct: 15.6, opticalWeight: 0.65, sarWeight: 0.35, ndwiShift: 0.44 },
      histograms: [
        { bin: '-0.2 to 0.0', probability: 0.40, baseline: 0.12 },
        { bin: '0.0 to 0.2', probability: 0.26, baseline: 0.18 },
        { bin: '0.2 to 0.4', probability: 0.16, baseline: 0.22 },
        { bin: '0.4 to 0.6', probability: 0.10, baseline: 0.30 },
        { bin: '0.6 to 0.8', probability: 0.08, baseline: 0.18 },
      ],
    },
  },

  'Joshimath — Himalayan Land Subsidence': {
    id: 'SCN-2023-JSH-0115',
    name: 'Joshimath — Himalayan Land Subsidence',
    category: 'Disaster Zone',
    state: 'Uttarakhand',
    center: [30.556, 79.563],
    zoom: 15,
    scene: {
      id: 'SCN-2023-JSH-0115',
      title: 'Joshimath Town — Slope Deformation & Fissures',
      location: 'Joshimath, Chamoli District, Uttarakhand',
      targetBbox: '30.5310° N, 79.5410° E to 30.5840° N, 79.5920° E',
      captureDatePre: '2022-12-05 05:30 UTC',
      captureDatePost: '2023-01-15 05:32 UTC',
      sunElevation: 42.1,
      satellitePlatform: 'RISAT-1A InSAR + Sentinel-1',
      gsdMeters: 3.0,
      crs: 'EPSG:32644 (UTM Zone 44N)',
    },
    rois: [
      { id: 'roi-jsh-1', label: 'ROI 01 — Sunil & Manohar Ward Subsidence', category: 'hazard', coordinates: { x: 38, y: 35, width: 24, height: 30 }, metric: '-5.4 cm Subsidence' },
    ],
    initialQuery: 'Calculate InSAR phase coherence loss and surface displacement rates across Joshimath wards.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Differential InSAR interferometry confirms cumulative subsidence exceeding -5.4 cm across Sunil, Gandhi Nagar, and Manohar wards.',
      confidence: 0.98,
      groundedRegionsCount: 52,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'InSAR SLC Pairs / EPSG:32644', details: { mode: 'InSAR' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'insar_deformation_velocity', details: { location: 'Joshimath' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'Differential_Interferogram, Phase_Unwrapping', details: { tools: ['SNAPHU'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 98%', details: { score: 0.984 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 390 } },
      ],
      evidence: [],
      warnings: [],
      metrics: { changedAreaKm2: 3.2, changedPixels: 32000, cloudCoverPct: 2.1, opticalWeight: 0.2, sarWeight: 0.8, ndwiShift: 0.12 },
      histograms: [
        { bin: '-0.1 to 0.0', probability: 0.48, baseline: 0.14 },
        { bin: '0.0 to 0.1', probability: 0.24, baseline: 0.22 },
        { bin: '0.1 to 0.2', probability: 0.16, baseline: 0.26 },
        { bin: '0.2 to 0.3', probability: 0.08, baseline: 0.22 },
        { bin: '0.3 to 0.4', probability: 0.04, baseline: 0.16 },
      ],
    },
  },

  'Sundarbans — Mangrove Delta & Tidal Inundation': {
    id: 'SCN-2024-SBN-0522',
    name: 'Sundarbans — Mangrove Delta & Tidal Inundation',
    category: 'State & Region',
    state: 'West Bengal',
    center: [21.949, 88.892],
    zoom: 12,
    scene: {
      id: 'SCN-2024-SBN-0522',
      title: 'Sundarbans Biosphere — Estuarine Erosion & Mangrove Dieback',
      location: 'Sundarbans Delta, South 24 Parganas, West Bengal',
      targetBbox: '21.6510° N, 88.4210° E to 22.2410° N, 89.1240° E',
      captureDatePre: '2024-03-12 04:20 UTC',
      captureDatePost: '2024-05-22 04:25 UTC',
      sunElevation: 66.8,
      satellitePlatform: 'Sentinel-2B MSI + RISAT-1A SAR',
      gsdMeters: 10.0,
      crs: 'EPSG:32645 (UTM Zone 45N)',
    },
    rois: [
      { id: 'roi-sbn-1', label: 'ROI 01 — Ghoramara / Sagar Island Erosion', category: 'hazard', coordinates: { x: 30, y: 35, width: 38, height: 38 }, metric: '-1.8 km² Land Loss' },
    ],
    initialQuery: 'Quantify shoreline retreat and mangrove canopy salinity stress across Sagar island.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Cyclone surge and tidal erosion caused 1.8 km² shoreline loss along southern islands, accompanied by NDVI drops in Rhizophora mangrove stands.',
      confidence: 0.96,
      groundedRegionsCount: 58,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32645 / 98% overlap', details: { delta: 'Sundarbans' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'coastal_shoreline_extraction', details: { tidal_correction: 'MHW' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'NDVI_Delta, AWEI_Water_Index', details: { tools: ['AWEInsh'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 96%', details: { f1: 0.962 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 350 } },
      ],
      evidence: [],
      warnings: [],
      metrics: { changedAreaKm2: 34.6, changedPixels: 346000, cloudCoverPct: 18.0, opticalWeight: 0.6, sarWeight: 0.4, ndwiShift: 0.58 },
      histograms: [
        { bin: '-0.4 to -0.2', probability: 0.45, baseline: 0.12 },
        { bin: '-0.2 to 0.0', probability: 0.25, baseline: 0.18 },
        { bin: '0.0 to 0.2', probability: 0.15, baseline: 0.25 },
        { bin: '0.2 to 0.4', probability: 0.10, baseline: 0.28 },
        { bin: '0.4 to 0.6', probability: 0.05, baseline: 0.17 },
      ],
    },
  },

  'Chennai — Urban Wetland Inundation': {
    id: 'SCN-2023-CHN-1206',
    name: 'Chennai — Urban Wetland Inundation',
    category: 'Disaster Zone',
    state: 'Tamil Nadu',
    center: [13.018, 80.221],
    zoom: 13,
    scene: {
      id: 'SCN-2023-CHN-1206',
      title: 'Cyclone Michaung — Chennai Metropolitan Flood Extents',
      location: 'Adyar & Cooum River Basins, Chennai, Tamil Nadu',
      targetBbox: '12.8510° N, 80.0820° E to 13.1840° N, 80.3120° E',
      captureDatePre: '2023-11-20 04:55 UTC',
      captureDatePost: '2023-12-06 05:00 UTC',
      sunElevation: 51.5,
      satellitePlatform: 'RISAT-1A SAR + Sentinel-2',
      gsdMeters: 3.0,
      crs: 'EPSG:32644 (UTM Zone 44N)',
    },
    rois: [
      { id: 'roi-chn-1', label: 'ROI 01 — Pallikaranai Marsh Overflow', category: 'water', coordinates: { x: 38, y: 38, width: 28, height: 32 }, metric: 'Urban Spill' },
    ],
    initialQuery: 'Detect submerged urban arterial corridors and Pallikaranai marshland overflow.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'C-Band SAR backscatter penetrates cloud cover to map 22.4 km² urban waterlogging across Velachery, Pallikaranai, and Mudichur.',
      confidence: 0.97,
      groundedRegionsCount: 61,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32644 / 99% overlap', details: { city: 'Chennai' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'urban_flood_mapping', details: { sensor: 'SAR' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'SAR_Double_Bounce_Detection', details: { tools: ['SAR_Urban'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 97%', details: { score: 0.974 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 305 } },
      ],
      evidence: [],
      warnings: [],
      metrics: { changedAreaKm2: 22.4, changedPixels: 224000, cloudCoverPct: 88.0, opticalWeight: 0.2, sarWeight: 0.8, ndwiShift: 0.65 },
      histograms: [
        { bin: '-0.3 to -0.1', probability: 0.50, baseline: 0.15 },
        { bin: '-0.1 to 0.1', probability: 0.24, baseline: 0.20 },
        { bin: '0.1 to 0.3', probability: 0.14, baseline: 0.28 },
        { bin: '0.3 to 0.5', probability: 0.08, baseline: 0.22 },
        { bin: '0.5 to 0.7', probability: 0.04, baseline: 0.15 },
      ],
    },
  },

  'Rann of Kutch — Seasonal Salt Lake': {
    id: 'SCN-2024-KTC-0905',
    name: 'Rann of Kutch — Seasonal Salt Lake',
    category: 'Golden Benchmark',
    state: 'Gujarat',
    center: [23.834, 70.363],
    zoom: 11,
    scene: {
      id: 'SCN-2024-KTC-0905',
      title: 'Great Rann of Kutch — Monsoon Salt Pan Flooding',
      location: 'Great Rann, Kutch, Gujarat',
      targetBbox: '23.6120° N, 69.8410° E to 24.1280° N, 70.8240° E',
      captureDatePre: '2024-02-10 05:15 UTC',
      captureDatePost: '2024-09-05 05:18 UTC',
      sunElevation: 59.4,
      satellitePlatform: 'LANDSAT-9 OLI-2 + RISAT-1A SAR',
      gsdMeters: 30.0,
      crs: 'EPSG:32642 (UTM Zone 42N)',
    },
    rois: [
      { id: 'roi-ktc-1', label: 'ROI 01 — Seasonal Brine Inundation Playa', category: 'water', coordinates: { x: 25, y: 25, width: 50, height: 50 }, metric: '126 km² Brine' },
    ],
    initialQuery: 'Map monsoonal sea water ingress and shallow brine expansion across the salt flats.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Seasonal monsoonal flooding filled the Great Rann depression with 126.5 km² of shallow tidal and rainwater brine, submerging the dry halite crust.',
      confidence: 0.98,
      groundedRegionsCount: 52,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32642 / 96% overlap', details: { crs: 'EPSG:32642' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'playa_water_delineation', details: { sensor: 'Landsat-9 / RISAT' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'Salinity_Index, SWIR2_Reflectance', details: { tools: ['NDSI'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 98%', details: { confidence: 0.984 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Completed', details: { latency_ms: 290 } },
      ],
      evidence: [],
      warnings: [],
      metrics: { changedAreaKm2: 126.5, changedPixels: 1265000, cloudCoverPct: 4.2, opticalWeight: 0.8, sarWeight: 0.2, ndwiShift: 0.72 },
      histograms: [
        { bin: '-0.5 to -0.3', probability: 0.62, baseline: 0.05 },
        { bin: '-0.3 to -0.1', probability: 0.22, baseline: 0.15 },
        { bin: '-0.1 to 0.1', probability: 0.10, baseline: 0.40 },
        { bin: '0.1 to 0.3', probability: 0.04, baseline: 0.25 },
        { bin: '0.3 to 0.5', probability: 0.02, baseline: 0.15 },
      ],
    },
  },

  'Ladakh — Pangong Tso Trans-Himalayan Basin': {
    id: 'SCN-2024-LDK-0618',
    name: 'Ladakh — Pangong Tso Trans-Himalayan Basin',
    category: 'State & Region',
    state: 'Ladakh',
    center: [33.759, 78.667],
    zoom: 12,
    scene: {
      id: 'SCN-2024-LDK-0618',
      title: 'Pangong Tso Endorheic Lake — High Altitude Shoreline',
      location: 'Pangong Tso, Leh District, Ladakh',
      targetBbox: '33.6120° N, 78.4820° E to 33.9140° N, 78.9820° E',
      captureDatePre: '2024-05-10 05:10 UTC',
      captureDatePost: '2024-06-18 05:14 UTC',
      sunElevation: 71.0,
      satellitePlatform: 'Sentinel-2B MSI (10m VNIR)',
      gsdMeters: 10.0,
      crs: 'EPSG:32644 (UTM Zone 44N)',
    },
    rois: [
      { id: 'roi-ldk-1', label: 'ROI 01 — Glacier Meltwater Inflow Fan', category: 'water', coordinates: { x: 35, y: 30, width: 34, height: 38 }, metric: 'Melt Surge' },
    ],
    initialQuery: 'Track seasonal glacial meltwater discharge and shoreline expansion in Pangong Tso.',
    payload: {
      task: 'Change Detection',
      chipLabel: 'Change',
      answer: 'Snowmelt surge from northern ridgelines expanded Pangong Tso surface extent by 4.2 km², with clear alluvial fan deposition.',
      confidence: 0.98,
      groundedRegionsCount: 44,
      trace: [
        { id: 'step-1', stepNumber: 1, name: 'Validated input', status: 'done', summary: 'COG / EPSG:32644 / 99% overlap', details: { lake: 'Pangong Tso' } },
        { id: 'step-2', stepNumber: 2, name: 'Routed to task', status: 'done', summary: 'high_altitude_lake_monitoring', details: { elevation: '4225m' } },
        { id: 'step-3', stepNumber: 3, name: 'Executed specialist tool(s)', status: 'done', summary: 'NDWI, NDSI_Snow_Cover', details: { tools: ['NDWI', 'NDSI'] } },
        { id: 'step-4', stepNumber: 4, name: 'Verified evidence', status: 'done', summary: 'Cross-tool agreement 98%', details: { score: 0.981 } },
        { id: 'step-5', stepNumber: 5, name: 'Response composed', status: 'done', summary: 'Delivered', details: { latency_ms: 280 } },
      ],
      evidence: [],
      warnings: [],
      metrics: { changedAreaKm2: 4.2, changedPixels: 42000, cloudCoverPct: 1.2, opticalWeight: 0.9, sarWeight: 0.1, ndwiShift: 0.32 },
      histograms: [
        { bin: '-0.4 to -0.2', probability: 0.54, baseline: 0.10 },
        { bin: '-0.2 to 0.0', probability: 0.24, baseline: 0.18 },
        { bin: '0.0 to 0.2', probability: 0.12, baseline: 0.28 },
        { bin: '0.2 to 0.4', probability: 0.06, baseline: 0.26 },
        { bin: '0.4 to 0.6', probability: 0.04, baseline: 0.18 },
      ],
    },
  },
};

// Default initial state constants
export const ACTIVE_SCENE = MISSION_CATALOGS['Uttarakhand Floods — Chamoli Basin'].scene;
export const INITIAL_PAYLOAD = MISSION_CATALOGS['Uttarakhand Floods — Chamoli Basin'].payload;
export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'user',
    timestamp: '10:14:02',
    queryText: MISSION_CATALOGS['Uttarakhand Floods — Chamoli Basin'].initialQuery,
  },
  {
    id: 'msg-init-2',
    sender: 'assistant',
    timestamp: '10:14:05',
    payload: MISSION_CATALOGS['Uttarakhand Floods — Chamoli Basin'].payload,
  },
];

// ============================================================================
// 3. SENSOR COMPATIBILITY GATE CALCULATOR
// 🔌 BACKEND TEAM: Replaced by pre-flight check in `POST /api/v1/validate`
// ============================================================================
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
      value: 'Overlap: 94.2% ✓',
      details: 'Footprint intersection exceeds required 80% threshold.',
      critical: true,
    },
    {
      id: 'chk-registration',
      name: 'Sub-Pixel Registration',
      status: primary === 'risat' ? 'warn' : 'pass',
      value: primary === 'risat' ? '1.2px Offset ⚠' : '0.4px Sub-pixel ✓',
      details:
        primary === 'risat'
          ? 'SAR foreshortening along steep slopes introduces minor geocoding offset.'
          : 'Optical tie points co-registered within sub-pixel bounds.',
      critical: false,
    },
  ];
};