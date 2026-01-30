from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from datetime import datetime

# import your pipeline runner (you already have something like workflow runner)
# example:
# from workflow.runner import run_full_pipeline_for_case
# OR from apps.retrieval.pipeline import run_pipeline
# We'll call it run_case_pipeline() below.

router = APIRouter(tags=["runs"])


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"

class StartRunRequest(BaseModel):
    top_k: Optional[int] = 8
    mode: Optional[str] = "standard"

@router.post("/cases/{case_id}/run")
async def start_run(case_id: str, payload: StartRunRequest, background: BackgroundTasks):
    """
    Starts the debate pipeline in the background and returns run_id immediately.
    """
    # 1) create a run_id (you probably already have run store logic)
    import uuid
    run_id = f"run_{uuid.uuid4().hex[:10]}"

    # 1b) attach run to the case so the frontend can start polling
    from apps.api.routes_cases import CASES, RUNS_BY_CASE
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")

    now = _now()
    CASES[case_id]["debate"] = {
        "run_id": run_id,
        "stage": "opening",
        "messages": [],
        "started_at": now,
        "updated_at": now,
    }
    CASES[case_id]["status"] = "running"
    CASES[case_id]["updated_at"] = now
    RUNS_BY_CASE[case_id] = run_id

    # 2) mark run as running in your in-memory store (or DB)
    # IMPORTANT: you must implement these 2 funcs in routes_runs or a shared store:
    from apps.api.run_store import set_run_status  # you create this tiny file (below)
    set_run_status(run_id, case_id, status="running", stage="opening", progress=10)

    # 3) fire background job
    background.add_task(_execute_pipeline, run_id, case_id, payload.top_k, payload.mode)

    return {"run_id": run_id, "status": "running", "case_id": case_id}

def _execute_pipeline(run_id: str, case_id: str, top_k: int, mode: str):
    """
    Runs the pipeline and updates run_store. Runs in background thread.
    """
    from apps.api.run_store import (
        set_run_status,
        append_message,
        set_run_decision,
        set_run_retrieval,
    )

    try:
        # stage updates (optional)
        set_run_status(run_id, case_id, status="running", stage="opening", progress=20)

        # ---- CALL YOUR EXISTING PIPELINE HERE ----
        # You already have debate orchestration working in terminal.
        # Wrap it into a function that returns:
        # - transcript messages
        # - retrieval summary
        # - final decision
        #
        # Example signature:
        # result = run_case_pipeline(case_id=case_id, top_k=top_k, mode=mode)

        from apps.api.pipeline_adapter import run_case_pipeline  # you create this (below)
        result = run_case_pipeline(case_id=case_id, top_k=top_k, mode=mode)

        # result expected:
        # {
        #   "messages": [...],
        #   "retrieval": {...},
        #   "decision": {...},
        # }

        for msg in result.get("messages", []):
            append_message(run_id, msg)

        set_run_retrieval(run_id, result.get("retrieval"))
        set_run_decision(run_id, result.get("decision"))

        # Persist outputs onto the case object for the Case Detail page
        from apps.api.routes_cases import CASES
        if case_id in CASES:
            now = _now()
            CASES[case_id]["retrieval"] = result.get("retrieval")
            CASES[case_id]["decision"] = result.get("decision")
            CASES[case_id]["status"] = "decided"
            CASES[case_id]["updated_at"] = now

            debate = CASES[case_id].get("debate") or {}
            debate.update({
                "run_id": run_id,
                "stage": "done",
                "messages": result.get("messages", []),
                "updated_at": now,
            })
            CASES[case_id]["debate"] = debate

        set_run_status(run_id, case_id, status="decided", stage="done", progress=100)

    except Exception as e:
        set_run_status(run_id, case_id, status="failed", stage="done", progress=100)
        append_message(run_id, {
            "role": "MODERATOR",
            "content": f"Run failed: {e}",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "stage": "done",
        })

        # Reflect failure on the case too
        from apps.api.routes_cases import CASES
        if case_id in CASES:
            now = _now()
            CASES[case_id]["status"] = "failed"
            CASES[case_id]["updated_at"] = now

            debate = CASES[case_id].get("debate") or {}
            debate.update({
                "run_id": run_id,
                "stage": "done",
                "updated_at": now,
            })
            CASES[case_id]["debate"] = debate
