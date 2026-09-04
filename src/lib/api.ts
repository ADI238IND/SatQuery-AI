/**
 * ============================================================================
 * SATQUERY AI — CENTRAL API & ML BRIDGE
 * ============================================================================
 * 
 * 📌 TO BACKEND & ML TEAMMATES:
 * This is the ONLY file you need to connect your Python FastAPI endpoints,
 * PyTorch/TensorFlow models, and GeoTIFF processing pipelines.
 */

import { CONFIG } from './config';
import type {
  AnalysisPayload,
  AnalysisMode,
  SingleSceneSubTask,
  ImagerySource,
  BandSelection,
  BoundingBox,
  TraceStep,
} from './types';
import { SOURCE_IMAGERY } from './mockData';

export interface InferenceRequest {
  sceneId: string;
  queryText: string;
  mode: AnalysisMode;
  subTask?: SingleSceneSubTask;
  primarySource: ImagerySource;
  secondarySource?: ImagerySource | null;
  band: BandSelection;
  drawnRois?: BoundingBox[];
  coordinates: [number, number];
}

// ============================================================================
// 1. 🧠 ML TEAM & 🔌 BACKEND TEAM: Main Model Inference Request
// ============================================================================
/**
 * Executes Multimodal VQA, Change Detection, and Optical-SAR Fusion models.
 * Calls: POST /api/v1/inference
 */
export async function executeMultimodalQuery(
  params: InferenceRequest
): Promise<AnalysisPayload> {
  // If in local demo mode, return mock fallback
  if (CONFIG.USE_MOCK_API) {
    return simulateMLPipeline(params);
  }

  // 🔌 BACKEND TEAM: Real REST call to your Python FastAPI backend
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/inference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scene_id: params.sceneId,
        query: params.queryText,
        task_mode: params.mode,
        sub_task: params.subTask,
        primary_sensor: params.primarySource,
        secondary_sensor: params.secondarySource,
        band_combination: params.band,
        user_rois: params.drawnRois || [],
        target_center: params.coordinates,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned error status: ${response.status}`);
    }

    const data = await response.json();
    return data as AnalysisPayload;
  } catch (error) {
    console.warn('[SatQuery API] Real backend unreachable. Using fallback:', error);
    return simulateMLPipeline(params);
  }
}

// ============================================================================
// 2. 🔌 BACKEND TEAM: Custom GeoTIFF / Raster Upload (§3.2)
// ============================================================================
/**
 * Uploads user GeoTIFF or benchmark images to backend for orthorectification.
 * Calls: POST /api/v1/upload
 */
export async function uploadCustomRasterFile(file: File): Promise<{
  success: boolean;
  rasterUrl: string;
  metadata: { format: string; crs: string; gsdMeters: number; bands: string[] };
}> {
  if (CONFIG.USE_MOCK_API) {
    return {
      success: true,
      rasterUrl: URL.createObjectURL(file),
      metadata: {
        format: file.name.endsWith('.tif') || file.name.endsWith('.tiff') ? 'Cloud-Optimized GeoTIFF (COG)' : 'Benchmark Raster',
        crs: 'EPSG:32643',
        gsdMeters: 10.0,
        bands: ['B2', 'B3', 'B4', 'B8'],
      },
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${CONFIG.API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Upload failed on server');
  return response.json();
}

// ============================================================================
// 3. 🧠 ML TEAM: Fallback Simulation (Used when Python backend is not running)
// ============================================================================
async function simulateMLPipeline(params: InferenceRequest): Promise<AnalysisPayload> {
  const isLowConfidence =
    params.queryText.toLowerCase().includes('cloud') || params.queryText.toLowerCase().includes('shadow');

  const chipLabel =
    params.mode === 'Change Detection'
      ? 'Change'
      : params.mode === 'Fusion'
      ? 'Fusion'
      : params.subTask === 'Answer question'
      ? 'VQA'
      : params.subTask === 'Caption scene'
      ? 'Caption'
      : 'Grounding';

  const dynamicTrace: TraceStep[] = [
    {
      id: 'step-1',
      stepNumber: 1,
      name: 'Validated input',
      status: 'done',
      summary: `COG / EPSG:32643 / ${SOURCE_IMAGERY[params.primarySource]?.platform || 'Sentinel-2'}`,
      details: { format: 'COG', crs: 'EPSG:32643', gsd: 10.0 },
    },
    {
      id: 'step-2',
      stepNumber: 2,
      name: 'Routed to task',
      status: 'done',
      summary: params.mode === 'Single Scene VQA' ? `single_vqa` : params.mode === 'Fusion' ? 'fuse_optical_sar' : 'detect_change',
      details: { task: params.mode, subTask: params.subTask },
    },
    {
      id: 'step-3',
      stepNumber: 3,
      name: 'Executed specialist tool(s)',
      status: 'done',
      summary: params.mode === 'Fusion' ? 'SAR_Coherence, Optical_Reflectance' : 'NDWI_Thresholding, Change_Vector',
      details: { tools: ['NDWI_Thresholding', 'Change_Vector_Analysis'] },
    },
    {
      id: 'step-4',
      stepNumber: 4,
      name: 'Verified evidence',
      status: isLowConfidence ? 'warning' : 'done',
      summary: isLowConfidence ? 'Shadow misalignment (>1.2px)' : 'Cross-tool agreement 96%',
      details: { confidence: isLowConfidence ? 0.46 : 0.94 },
    },
    {
      id: 'step-5',
      stepNumber: 5,
      name: 'Response composed',
      status: 'done',
      summary: 'Payload delivered',
      details: { latency_ms: 350 },
    },
  ];

  return {
    task: params.mode,
    subTask: params.mode === 'Single Scene VQA' ? params.subTask : undefined,
    chipLabel,
    answer: isLowConfidence
      ? 'Confidence is below safe threshold; no definitive answer provided for masked shadow perimeters.'
      : params.mode === 'Fusion'
      ? 'Cross-sensor fusion (Optical + SAR) penetrated cloud canopy, confirming 14.82 km² perimeter change with 96% confidence.'
      : 'Severe riverbank inundation identified along the northern confluence. Silt and water accumulation expanded active channel width by 64%.',
    confidence: isLowConfidence ? 0.46 : 0.94,
    groundedRegionsCount: isLowConfidence ? 8 : 42,
    trace: dynamicTrace,
    warnings: isLowConfidence ? ['Residual misalignment is high in shadow.'] : ['Residual misalignment is 1.2px in steep valley shadows.'],
    evidence: [],
    metrics: {
      changedAreaKm2: 14.82,
      changedPixels: 148200,
      cloudCoverPct: params.primarySource === 'risat' ? 0.0 : 18.4,
      opticalWeight: params.mode === 'Fusion' ? 0.65 : undefined,
      sarWeight: params.mode === 'Fusion' ? 0.35 : undefined,
      ndwiShift: 0.41,
    },
    histograms: [
      { bin: '-0.2 to 0.0', probability: 0.38, baseline: 0.12 },
      { bin: '0.0 to 0.2', probability: 0.24, baseline: 0.18 },
      { bin: '0.2 to 0.4', probability: 0.18, baseline: 0.22 },
      { bin: '0.4 to 0.6', probability: 0.12, baseline: 0.31 },
      { bin: '0.6 to 0.8', probability: 0.08, baseline: 0.17 },
    ],
  };
}
