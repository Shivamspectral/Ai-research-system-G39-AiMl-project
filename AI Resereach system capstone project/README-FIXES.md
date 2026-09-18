Files in this zip, paste over the matching paths at your project root:

backend/app/schemas/research.py     - added ResearchStatusResponse
backend/app/api/routes_research.py - json.dumps() for all SSE yields + new GET /research/{job_id}/status route
frontend/lib/api.ts                 - added getResearchStatus()
frontend/components/progress-view.tsx - added polling fallback so it redirects even if SSE drops the final message

After pasting:
1. Restart backend: uv run uvicorn backend.app.main:app --reload --port 8000
2. Frontend picks up changes automatically (pnpm dev already running / restart if not)
