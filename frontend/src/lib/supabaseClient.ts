/**
 * ============================================================================
 * SATQUERY AI — DATABASE & AUTHENTICATION CLIENT (SUPABASE)
 * ============================================================================
 * 
 * 🗄️ DATABASE TEAM INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Run the SQL schema from `database/schema.sql` in your Supabase SQL Editor.
 * 3. Add your real keys to `.env`:
 *    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
 *    VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
 */

import { createClient } from '@supabase/supabase-js';
import type { AnalysisPayload, BoundingBox } from './types';

// Load environment variables with safe fallback for local frontend development
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://mock-instance.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummyKey';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 🗄️ DATABASE HELPER FUNCTIONS (PostgreSQL / PostGIS Queries)
// ============================================================================

/**
 * 🗄️ DB TEAM: Save an AI analysis query & execution trace to the `analyses` table
 */
export async function saveAnalysisLog(
  sceneId: string,
  userId: string | undefined,
  queryText: string,
  payload: AnalysisPayload
) {
  // If in mock/demo mode, skip network call
  if (supabaseUrl.includes('mock-instance') || supabaseUrl.includes('xyzcompany')) {
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await supabase.from('analyses').insert([
      {
        scene_id: sceneId,
        user_id: userId || null,
        query_text: queryText,
        task_mode: payload.task,
        confidence: payload.confidence,
        grounded_regions_count: payload.groundedRegionsCount,
        changed_area_km2: payload.metrics.changedAreaKm2,
        cloud_cover_pct: payload.metrics.cloudCoverPct,
        optical_weight: payload.metrics.opticalWeight || null,
        sar_weight: payload.metrics.sarWeight || null,
        trace_steps: payload.trace,
        answer_text: payload.answer,
      },
    ]);

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase DB Error] Failed to save analysis log:', err);
    return { success: false, error: err };
  }
}

/**
 * 🗄️ DB TEAM: Save user-drawn bounding boxes / annotations to the database
 */
export async function saveUserAnnotations(
  sceneId: string,
  userId: string | undefined,
  rois: BoundingBox[]
) {
  if (supabaseUrl.includes('mock-instance')) return { success: true, mock: true };

  try {
    const { data, error } = await supabase.from('annotations').insert(
      rois.map((box) => ({
        scene_id: sceneId,
        user_id: userId || null,
        label: box.label,
        category: box.category,
        coordinates: box.coordinates,
      }))
    );

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase DB Error] Failed to save annotations:', err);
    return { success: false, error: err };
  }
}