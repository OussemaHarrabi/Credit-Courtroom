from fastapi import APIRouter, UploadFile, File, HTTPException
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

router = APIRouter( tags=["cases"])

# -------- In-memory store (MVP) --------
CASES: Dict[str, Dict[str, Any]] = {}
DOCUMENTS: Dict[str, List[Dict[str, Any]]] = {}
AUDIT: Dict[str, List[Dict[str, Any]]] = {}
RUNS_BY_CASE: Dict[str, str] = {}

def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"

def _audit(case_id: str, event_type: str, metadata: Dict[str, Any]):
    AUDIT.setdefault(case_id, []).append({
        "event_id": f"evt_{uuid.uuid4().hex}",
        "case_id": case_id,
        "event_type": event_type,
        "timestamp": _now(),
        "metadata": metadata or {},
    })

def _case_shape(case_id: str) -> Dict[str, Any]:
    c = CASES[case_id]
    return {
        "case_id": c["case_id"],
        "status": c["status"],
        "created_at": c["created_at"],
        "updated_at": c["updated_at"],
        "applicant": c.get("applicant"),
        "documents": DOCUMENTS.get(case_id, []),
        "retrieval": c.get("retrieval"),
        "debate": c.get("debate"),
        "decision": c.get("decision"),
        "fraud_signals": c.get("fraud_signals"),
    }

@router.post("/cases")
def create_case(payload: Dict[str, Any] = {}):
    case_id = f"case_{uuid.uuid4().hex[:8]}"
    now = _now()
    CASES[case_id] = {
        "case_id": case_id,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
        "applicant": payload.get("applicant"),
        "documents": [],
        "retrieval": None,
        "debate": None,
        "decision": None,
        "fraud_signals": None,
    }
    DOCUMENTS[case_id] = []
    _audit(case_id, "created_case", {"source": "api"})
    return {"case": _case_shape(case_id)}

@router.get("/cases")
def list_cases(query: Optional[str] = None, status: Optional[str] = None, limit: int = 20, offset: int = 0):
    items = list(CASES.values())

    if query:
        q = query.lower()
        def _match(c: Dict[str, Any]) -> bool:
            if q in c["case_id"].lower():
                return True
            app = c.get("applicant") or {}
            lp = str(app.get("loan_purpose", "")).lower()
            return q in lp
        items = [c for c in items if _match(c)]

    if status:
        items = [c for c in items if c.get("status") == status]

    total = len(items)
    items = items[offset: offset + limit]
    return {"items": [_case_shape(c["case_id"]) for c in items], "total": total}

@router.get("/cases/{case_id}")
def get_case(case_id: str):
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"case": _case_shape(case_id)}

@router.patch("/cases/{case_id}/applicant")
def update_applicant(case_id: str, payload: Dict[str, Any]):
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")

    existing = CASES[case_id].get("applicant") or {}
    existing.update(payload)

    CASES[case_id]["applicant"] = existing
    CASES[case_id]["updated_at"] = _now()

    # auto status
    CASES[case_id]["status"] = "ready"

    _audit(case_id, "updated_applicant", {"fields": list(payload.keys())})
    return {"case": _case_shape(case_id)}

@router.post("/cases/{case_id}/documents")
async def upload_document(case_id: str, file: UploadFile = File(...)):
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")

    content = await file.read()
    doc_id = f"doc_{uuid.uuid4().hex[:10]}"
    doc = {
        "document_id": doc_id,
        "case_id": case_id,
        "filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "status": "uploaded",
        "extracted_fields": None,
        "created_at": _now(),
        "size": len(content),
    }
    DOCUMENTS.setdefault(case_id, []).append(doc)
    CASES[case_id]["updated_at"] = _now()
    _audit(case_id, "uploaded_docs", {"document_id": doc_id, "filename": file.filename})
    return {"document": doc}

@router.get("/cases/{case_id}/documents")
def list_documents(case_id: str):
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"items": DOCUMENTS.get(case_id, [])}

@router.get("/cases/{case_id}/audit")
def get_audit(case_id: str):
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")
    return AUDIT.get(case_id, [])

@router.get("/cases/{case_id}/fraud-signals")
def get_fraud_signals(case_id: str):
    # placeholder for neo4j later
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")
    now = _now()
    signals = {
        "shared_device_count": 0,
        "shared_ip_count": 0,
        "shared_merchant_count": 0,
        "known_fraud_neighbor_count": 0,
        "fraud_cluster_score": 0.0,
        "fraud_flags": [],
        "computed_at": now,
    }
    CASES[case_id]["fraud_signals"] = signals
    return {"fraud_signals": signals}

@router.get("/cases/{case_id}/policy-evidence")
def get_policy_evidence(case_id: str):
    # placeholder (later: from judge policy refs)
    if case_id not in CASES:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"clauses": []}
