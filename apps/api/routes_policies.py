from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from core.supabase_client import supabase
from ingestion.policies.embed_policies import embed_policies
from ingestion.policies.ingest_policies import ingest_policy


router = APIRouter(prefix="/policies", tags=["policies"])


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _try_insert_policy_row(row: Dict[str, Any]) -> None:
    """Best-effort insert into a `policies` table if it exists in Supabase."""
    try:
        supabase.table("policies").insert(row).execute()
    except Exception:
        # Schema might not be present; ingestion still works via policy_chunks.
        return


def _try_update_policy_row(policy_id: str, updates: Dict[str, Any]) -> None:
    try:
        supabase.table("policies").update(updates).eq("policy_id", policy_id).execute()
    except Exception:
        return


def _count_policy_chunks_by_name(policy_name: str) -> int:
    """Count chunks for a policy; falls back to fetching ids if count isn't supported."""
    try:
        # supabase-py doesn't consistently support exact count across versions.
        rows = (
            supabase.table("policy_chunks")
            .select("id")
            .eq("policy_name", policy_name)
            .execute()
            .data
        )
        return len(rows or [])
    except Exception:
        return 0


def _ingest_and_embed_policy(policy_id: str, policy_name: str, bucket: str, filename: str) -> None:
    """Background job: chunk policy and embed its chunks."""
    # 1) chunk into policy_chunks
    ingest_policy(bucket=bucket, file_name=filename, policy_name=policy_name, policy_id=policy_id)

    # 2) embed only this policy's chunks
    embed_policies(policy_name=policy_name)

    # 3) update clauses_count (best-effort)
    clauses_count = _count_policy_chunks_by_name(policy_name)
    _try_update_policy_row(policy_id, {"clauses_count": clauses_count})

@router.post("/upload")
async def upload_policy(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(""),
    document_type: str = Form("eligibility"),
):
    bucket = "bank-policies"
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    # For ingestion we currently support PDF and (optionally) DOCX.
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in {"pdf", "docx", "doc"}:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")
    if ext == "doc":
        raise HTTPException(status_code=400, detail=".doc is not supported yet. Please upload PDF or DOCX.")

    policy_id = f"policy_{uuid.uuid4().hex[:12]}"
    filename = f"{policy_id}_{uuid.uuid4().hex[:8]}_{file.filename}"
    content = await file.read()

    supabase.storage.from_(bucket).upload(
        filename,
        content,
        {"content-type": file.content_type},
    )

    policy_name = (name or file.filename).strip()
    now = _now()

    policy_row = {
        "policy_id": policy_id,
        "name": policy_name,
        "document_type": document_type,
        "filename": filename,
        "version": "v1.0",
        "uploaded_at": now,
        "clauses_count": 0,
        "status": "active",
    }

    # Persist metadata if the table exists
    _try_insert_policy_row(policy_row)

    # Ingest chunks synchronously so GET /policies can show it immediately
    # (even when we are falling back to aggregating from policy_chunks).
    try:
        ingest_policy(bucket=bucket, file_name=filename, policy_name=policy_name, policy_id=policy_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Policy ingestion failed: {e}")

    # Embed in background (can be slower)
    background.add_task(embed_policies, policy_name)

    # Update clauses_count best-effort
    clauses_count = _count_policy_chunks_by_name(policy_name)
    _try_update_policy_row(policy_id, {"clauses_count": clauses_count})
    policy_row["clauses_count"] = clauses_count

    # Frontend expects a raw Policy object
    return policy_row


@router.post("/ingest")
def ingest_policy_endpoint(payload: dict):
    """
    payload = {
        "bucket": "bank-policies",
        "file_name": "uuid_policy.pdf",
        "policy_name": "Bank Policy v1"
    }
    """
    ingest_policy(
        bucket=payload.get("bucket", "bank-policies"),
        file_name=payload["file_name"],
        policy_name=payload["policy_name"],
    )

    return {
        "message": "Policy ingested and chunked",
        "policy_name": payload["policy_name"],
    }


@router.post("/embed")
def embed_policy_chunks():
    embed_policies()
    return {
        "message": "All policy chunks embedded"
    }