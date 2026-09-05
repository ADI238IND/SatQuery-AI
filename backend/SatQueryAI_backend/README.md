# Satquery

A high-performance Python + FastAPI application designed for satellite imagery querying, specialist reasoning (Visual Question Answering, Change Detection), and data management with Supabase.

---

## Project Structure

```
d:/SatQueryAI/
├── app/
│   ├── main.py                      # FastAPI app entry point & lifespan
│   ├── api/
│   │   └── routes/                  # API endpoints (health, etc.)
│   ├── schemas/                     # Pydantic request & response schemas
│   ├── services/                    # Core business logic
│   ├── router/                      # Specialist routing & orchestration
│   ├── specialists/                 # Specialist adapters
│   │   ├── base.py                  # Abstract base specialist interface
│   │   ├── vqa_adapter.py           # Visual Question Answering adapter
│   │   └── change_detection_adapter.py # Change detection adapter
│   ├── repositories/                # Data access & persistence layer
│   ├── integrations/                # External services
│   │   └── supabase.py              # Supabase client singleton helper
│   └── core/                        # Application infrastructure
│       ├── config.py                # Environment configuration (pydantic-settings)
│       ├── logging.py               # Centralized logging configuration
│       └── exceptions.py            # Custom exceptions & global handlers
├── tests/                           # Pytest test suite
│   └── test_health.py               # Health check and error handling tests
├── .env                             # Environment variables (local config)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore file
├── requirements.txt                 # Project dependencies
└── README.md                        # Documentation
```

---

## Phase 1 Deliverables

- [x] **FastAPI Foundation**: App factory with CORS, lifecycle management, and Swagger/OpenAPI support.
- [x] **Health Check Endpoint**: `/health` (and `/api/v1/health`) returning operational status, service metadata, and server timestamp.
- [x] **Environment Configuration**: Robust configuration via `pydantic-settings` reading `.env` with fallback defaults.
- [x] **Supabase Credentials**: Configured in `.env` with placeholders ready for user keys.
- [x] **Logging**: Centralized, formatted standard output logging across all application components.
- [x] **Error Handling**: Standardized error responses via `SatqueryException` and global exception handlers.
- [x] **Interactive Documentation**: Swagger UI active at `/docs` and ReDoc active at `/redoc`.
- [x] **Unit Testing**: Pytest suite verifying endpoints, docs, and error handling.

---

## Setup & Quickstart

### 1. Prerequisites
- Python 3.10+ (tested with Python 3.13)

### 2. Create and Activate Virtual Environment

```powershell
# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Configure Environment Variables

The project includes a `.env` file pre-configured with defaults. Review and update your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-supabase-anon-or-service-role-key"
```

### 5. Start the Development Server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will start on `http://127.0.0.1:8000`.

### 6. Interactive Documentation (Swagger / OpenAPI)

Open your browser to:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI Schema**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

### 7. Run Tests

```powershell
pytest
```
