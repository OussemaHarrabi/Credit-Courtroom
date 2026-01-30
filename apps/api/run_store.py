from typing import Dict, Any, List, Optional
from datetime import datetime

RUNS: Dict[str, Dict[str, Any]] = {}

def _now():
    return datetime.utcnow().isoformat() + "Z"

def set_run_status(run_id: str, case_id: str, status: str, stage: str, progress: int):
    run = RUNS.setdefault(run_id, {
        "run_id": run_id,
        "case_id": case_id,
        "status": status,
        "stage": stage,
        "progress": progress,
        "messages": [],
        "retrieval": None,
        "decision": None,
        "updated_at": _now(),
    })
    run.update({"status": status, "stage": stage, "progress": progress, "updated_at": _now()})

def append_message(run_id: str, message: Dict[str, Any]):
    run = RUNS.setdefault(run_id, {"messages": []})
    run.setdefault("messages", []).append(message)
    run["updated_at"] = _now()

def set_run_retrieval(run_id: str, retrieval: Any):
    RUNS.setdefault(run_id, {})["retrieval"] = retrieval
    RUNS[run_id]["updated_at"] = _now()

def set_run_decision(run_id: str, decision: Any):
    RUNS.setdefault(run_id, {})["decision"] = decision
    RUNS[run_id]["updated_at"] = _now()

def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    return RUNS.get(run_id)
