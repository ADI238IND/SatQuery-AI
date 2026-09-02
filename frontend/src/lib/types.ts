/**
 * ============================================================================
 * SATQUERY AI — SHARED TYPE DEFINITIONS & INTEGRATION CONTRACTS
 * ============================================================================
 * 
 * 📌 DEVELOPER REFERENCE FOR TEAMMATES:
 * - 🧠 ML Team: Review Section 3 (AnalysisPayload, TraceStep, MetricSummary)
 * - 🔌 Backend Team: Review Section 1 & 3 (Request/Response schemas for FastAPI)
 * - 🗄️ Database Team: Review Section 2 & 4 (PostGIS table schema mappings)
 */

// ============================================================================
// SECTION 1: SENSOR MODALITIES & RASTER METADATA (🔌 Backend & Data Pipeline)
// ============================================================================

export type OpticalSource = 'sentinel2' | 'landsat';
export type SarSource = 'risat';
export type ImagerySource = OpticalSource | SarSource;

export type AnalysisMode = 'Single Scene VQA' | 'Change Detection' | 'Fusion';
export type SingleSceneSubTask = 'Answer question' | 'Caption scene' | 'Highlight region';
export type BandSelection = 'RGB True Color' | 'False Color NIR' | 'NDVI' | 'SAR Coherence';

/**
 * Metadata for supported Earth Observation platforms
 * 🔌 BACKEND TEAM: Used when indexing new STAC satellite catalogs
 */
export interface SensorMetadata {
  id: ImagerySource;
  label: string;
  kind: 'optical' | 'sar';
  platform: string;
  gsdMeters: number;                   // Ground Sample Distance (spatial resolution in meters)
  bands: string[];                     // Spectral bands available in this asset
  incidenceOrSunElevation: string;
  crs: string;                         // EPSG coordinate system string
  description: string;
  mockUrl: string;                     // 🔌 BACKEND: Replace with TiTiler / Cloud-Optimized GeoTIFF endpoint
}

// ============================================================================
// SECTION 2: SPATIAL ANNOTATIONS & ROI GROUNDING (🧠 ML SAM & 🗄️ PostGIS)
// ============================================================================

/**
 * Bounding box drawn by the analyst or detected by the model
 * 🗄️ DATABASE TEAM: Maps to `geom GEOMETRY(Polygon, 4326)` in PostgreSQL/PostGIS
 * 🧠 ML TEAM: Passed into SAM (Segment Anything Model) as spatial box prompts
 */
export interface BoundingBox {
  id: string;
  label: string;
  category: 'water' | 'infrastructure' | 'vegetation' | 'hazard';
  coordinates: { x: number; y: number; width: number; height: number }; // Percentage offsets [0-100]
  metric?: string;                     // e.g. "+64% Inundation", "Severed Road"
}

/**
 * Evidence point / patch grounding vector
 * 🧠 ML TEAM: Centroids and confidence of image patches activated by VQA cross-attention
 */
export interface GroundedEvidence {
  id: string;
  regionId: string;
  centroid: [number, number];          // [latitude, longitude]
  patchConfidence: number;             // Model attention score [0.0 - 1.0]
  spectralMean: number;
}

// ============================================================================
// SECTION 3: ML INFERENCE, TRACE & TELEMETRY CONTRACTS (🧠 ML & 🔌 FastAPI)
// ============================================================================

/**
 * Quantitative remote sensing metrics calculated by specialist algorithms
 * 🧠 ML TEAM: Populate from NDWI, NDVI, and Change Vector Analysis (CVA) modules
 */
export interface MetricSummary {
  changedAreaKm2: number;              // Total surface area change in square kilometers
  changedPixels: number;               // Pixel count exceeding anomaly threshold
  cloudCoverPct: number;               // Cloud occlusion mask percentage
  opticalWeight?: number;              // Modality cross-weight for Optical (0.0 to 1.0)
  sarWeight?: number;                  // Modality cross-weight for SAR (0.0 to 1.0)
  ndwiShift?: number;                  // Mean Normalized Difference Water Index delta
}

/**
 * Spectral histogram distribution bins for NDVI / NDWI / Backscatter
 * 🧠 ML TEAM: Output from NumPy / PyTorch histogram binning
 */
export interface HistogramBin {
  bin: string;                         // Range string, e.g. "-0.2 to 0.0"
  probability: number;                 // Frequency density [0.0 - 1.0]
  baseline: number;                    // Historical un-flooded baseline density
}

/**
 * Observable step-by-step trace of the AI inference engine
 * 🧠 ML TEAM: Populate each execution step (CRS validation -> routing -> tool dispatch -> verification -> response)
 */
export interface TraceStep {
  id: string;
  stepNumber: number;                  // 1 to 5
  name: string;                        // e.g. "Validated input", "Executed specialist tool(s)"
  status: 'done' | 'running' | 'warning' | 'failed';
  summary: string;                     // One-line summary
  details: Record<string, any>;        // Raw JSON parameters visible when analyst expands the step
}

/**
 * Pre-inference compatibility checks (Format, CRS, overlap, geocoding)
 * 🔌 BACKEND TEAM: Validated before dispatching GPU inference jobs
 */
export interface CompatibilityCheck {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value: string;
  details: string;
  critical: boolean;                   // If true and status == 'fail', query execution is blocked
}

/**
 * Complete Multimodal Inference Response Contract
 * 🧠 ML TEAM: This is the exact return JSON structure expected from `POST /api/v1/inference`
 */
export interface AnalysisPayload {
  task: AnalysisMode;
  subTask?: SingleSceneSubTask;
  chipLabel?: 'VQA' | 'Caption' | 'Grounding' | 'Change' | 'Fusion';
  answer: string;                      // Plain-language analyst summary
  confidence: number;                  // Calibrated model confidence [0.0 - 1.0]
  groundedRegionsCount: number;        // Count of evidence regions
  trace: TraceStep[];                  // 5-step observable execution pipeline trace
  evidence: GroundedEvidence[];        // Spatial grounding points
  warnings: string[];                  // Quality / abstention warnings (e.g. shadow misalignment)
  metrics: MetricSummary;              // Quantitative area and pixel metrics
  histograms: HistogramBin[];          // Spectral NDVI/NDWI probability distribution
}

// ============================================================================
// SECTION 4: DIALOGUE & DATABASE SCENE MODELS (🗄️ Database & Supabase)
// ============================================================================

/**
 * Dialogue history message item
 * 🗄️ DATABASE TEAM: Maps to `analyses` table in PostgreSQL
 */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  queryText?: string;
  payload?: AnalysisPayload;
}

/**
 * Mission Scene Metadata
 * 🗄️ DATABASE TEAM: Maps to `scenes` table in PostGIS
 */
export interface SceneMetadata {
  id: string;                          // Primary key, e.g. "SCN-2024-UTT-0914"
  title: string;
  location: string;
  targetBbox: string;                  // Bounding coordinates string
  captureDatePre: string;              // ISO Timestamp string
  captureDatePost: string;             // ISO Timestamp string
  sunElevation: number;
  satellitePlatform: string;
  gsdMeters: number;
  crs: string;                         // e.g. "EPSG:32643 (UTM Zone 44N)"
}