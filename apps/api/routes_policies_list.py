from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from core.supabase_client import supabase

router = APIRouter(prefix="/policies", tags=["policies"])


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _fallback_from_chunks() -> List[Dict[str, Any]]:
    """If a `policies` table is not present, derive a list from policy_chunks."""
    try:
        rows = supabase.table("policy_chunks").select("policy_name,id").execute().data
    except Exception:
        return []

    counts: Dict[str, int] = {}
    for r in rows or []:
        pn = (r.get("policy_name") or "").strip()
        if not pn:
            continue
        counts[pn] = counts.get(pn, 0) + 1

    out: List[Dict[str, Any]] = []
    for pn, n in sorted(counts.items(), key=lambda x: x[0].lower()):
        out.append({
            "policy_id": pn,
            "name": pn,
            "document_type": "eligibility",
            "filename": "",
            "version": "v1.0",
            "uploaded_at": _now(),
            "clauses_count": n,
            "status": "active",
        })
    return out

@router.get("")
def list_policies():
    # Preferred: Supabase `policies` table
    try:
        rows = supabase.table("policies").select("*").execute().data
        items = rows or []
        return {"items": items, "total": len(items)}
    except Exception:
        # Fallback: derive from chunks
        items = _fallback_from_chunks()
        return {"items": items, "total": len(items)}

@router.get("/{policy_id}")
def get_policy(policy_id: str):
    # Preferred: Supabase `policies` table
    try:
        rows = supabase.table("policies").select("*").eq("policy_id", policy_id).execute().data
        if rows:
            return {"policy": rows[0]}
    except Exception:
        pass

    # Fallback: reconstruct from chunks
    items = _fallback_from_chunks()
    for p in items:
        if p.get("policy_id") == policy_id:
            return {"policy": p}

    raise HTTPException(status_code=404, detail="Policy not found")
