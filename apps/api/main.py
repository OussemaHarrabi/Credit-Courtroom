from fastapi import FastAPI
from apps.api.routes_health import router as health_router
from configs.settings import settings

app = FastAPI(title="Credit Courtroom API", version="0.1.0")
app.include_router(health_router)

@app.get("/health")
def health():
    return {"status": "ok", "env": settings.app_env}
