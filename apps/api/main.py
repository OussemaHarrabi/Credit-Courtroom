from fastapi import FastAPI
from apps.api.routes_health import router as health_router
from apps.api.routes_retrieval import router as retrieval_router
from configs.settings import settings

app = FastAPI(title="credit courtroom API", version="0.1.0")

app.include_router(health_router)
app.include_router(retrieval_router)

@app.get("/health")
def health():
    return {"status": "ok", "env": settings.app_env}  # type: ignore