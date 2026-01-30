from fastapi import APIRouter, HTTPException
from apps.api.run_store import get_run

router = APIRouter(tags=["runs"])

@router.get("/runs/{run_id}/status")
def run_status(run_id: str):
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "run_id": run["run_id"],
        "case_id": run["case_id"],
        "status": run["status"],
        "stage": run["stage"],
        "progress": run["progress"],
    }

@router.get("/runs/{run_id}/transcript")
def run_transcript(run_id: str):
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "messages": run.get("messages", []),
        "stage": run.get("stage", "opening"),
        "updated_at": run.get("updated_at"),
    }

@router.get("/runs/{run_id}/decision")
def run_decision(run_id: str):
    run = get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.get("decision") or not run.get("retrieval"):
        raise HTTPException(status_code=409, detail="Decision not ready")
    return {
        "decision": run["decision"],
        "retrieval": run["retrieval"],
    }
