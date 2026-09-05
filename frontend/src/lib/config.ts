/**
 * ============================================================================
 * SATQUERY AI — BACKEND, ML & DATABASE CONFIGURATION
 * ============================================================================
 * 
 * 📌 TO YOUR TEAMMATES:
 * Copy `.env.example` to `.env` and set `VITE_USE_MOCK_API=false` 
 * to connect your real Python / FastAPI server.
 */

export const CONFIG = {
  // 🔌 BACKEND TEAM: Your FastAPI / Flask / Node.js base URL
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',

  // 🔌 BACKEND TEAM: Your TiTiler / Cloud-Optimized GeoTIFF Tile Server URL
  TILE_SERVER_URL: import.meta.env.VITE_TILE_SERVER_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

  // 🧠 ML TEAM: Set to 'false' in .env to disable mock data and run real GPU models
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'false' ? false : true,

  // 🗄️ DATABASE TEAM: Supabase / PostgreSQL Credentials
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOi...',
};
