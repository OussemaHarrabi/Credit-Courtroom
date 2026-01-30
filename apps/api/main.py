from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from apps.api.routes_health import router as health_router
from apps.api.routes_retrieval import router as retrieval_router
from apps.api.routes_embed import router as embed_router
from apps.api.routes_policies import router as policies_router


from apps.api.routes_cases import router as cases_router
from apps.api.routes_runs import router as runs_router
from apps.api.routes_case_run import router as case_run_router
from apps.api.routes_dashboard import router as dashboard_router
from apps.api.routes_policies_list import router as policies_list_router

app = FastAPI(title="credit courtroom API", version="0.1.0")

# CORS (so Vite on :5173 can call FastAPI on :8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(health_router)
api_v1.include_router(cases_router)
api_v1.include_router(case_run_router)
api_v1.include_router(runs_router)
api_v1.include_router(dashboard_router)

api_v1.include_router(policies_router)       # POST /policies/upload (your existing)
api_v1.include_router(policies_list_router)
api_v1.include_router(embed_router)
api_v1.include_router(retrieval_router)

app.include_router(api_v1)

@app.get("/health")
def health():
    return {"status": "ok"}
