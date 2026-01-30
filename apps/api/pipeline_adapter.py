# apps/api/pipeline_adapter.py
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

from core.encoder_runtime import encode_applicant_payload
from retrieval.neighbors import retrieve_neighbors, summarize_neighbor_stats
from workflow.debate_workflow import CreditDebateWorkflow

# This is your in-memory case store used by routes_cases.py
# (routes_runs.py already imports CASES from routes_cases)
from apps.api.routes_cases import CASES


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _safe_float(x: Any, default: float = 0.0) -> float:
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        return default


def _normalize_similarity(x: Any) -> float:
    """Normalize various similarity/score formats into a 0..1 float for the frontend.

    - If already 0..1: keep
    - If looks like percent (1..100): divide by 100
    - Clamp otherwise
    """
    v = _safe_float(x, 0.0)
    if v <= 0.0:
        return 0.0
    if 0.0 < v <= 1.0:
        return v
    if 1.0 < v <= 100.0:
        return v / 100.0
    return 1.0


def _to_stage(frontend_stage: str) -> str:
    """
    Frontend expects stage in: opening|rebuttal|counter|final|verdict|done
    Your workflow uses: opening|rebuttal|counter|final_argument|verdict
    We'll map final_argument -> final, and keep others.
    """
    if frontend_stage == "final_argument":
        return "final"
    return frontend_stage


def _map_transcript_messages(workflow_messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Frontend expects:
      { role: 'RISK'|'ADVOCATE'|'MODERATOR'|'JUDGE', content, timestamp, stage }
    Your workflow messages appear like:
      { speaker: 'risk'|'advocate'|'moderator'|'judge', content, stage, ... }
    """
    out: List[Dict[str, Any]] = []
    for m in workflow_messages or []:
        speaker = (m.get("speaker") or "").lower().strip()
        role = {
            "risk": "RISK",
            "advocate": "ADVOCATE",
            "moderator": "MODERATOR",
            "judge": "JUDGE",
        }.get(speaker, "MODERATOR")

        stage = _to_stage((m.get("stage") or "opening").lower().strip())

        out.append({
            "role": role,
            "content": m.get("content") or "",
            "timestamp": m.get("timestamp") or _now(),  # if your create_msg already sets timestamp, it'll be used
            "stage": stage,
        })
    return out


def _map_neighbors_for_frontend(neighbors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Frontend expects RetrievalSummary.neighbors items like:
      {
        neighbor_id: string,
        similarity: number 0..1,
        outcome: 'repaid'|'default',
        highlights: string[],
        payload_preview: object
      }

    Your neighbors look like:
      {
        applicant_id, score, loan_paid_back (0/1/-1), highlights, raw
      }
    """
    out: List[Dict[str, Any]] = []
    for i, n in enumerate(neighbors or []):
        loan_paid_back = n.get("loan_paid_back")
        outcome = "repaid" if loan_paid_back == 1 else "default" if loan_paid_back == 0 else "default"

        out.append({
            "neighbor_id": str(n.get("applicant_id") or f"neighbor_{i+1}"),
            # retrieval.neighbors returns `similarity`; older code used `score`
            "similarity": _normalize_similarity(n.get("similarity") if n.get("similarity") is not None else n.get("score")),
            "outcome": outcome,
            "highlights": n.get("highlights") or [],
            "payload_preview": n.get("raw") or {},
        })
    return out


def _compute_retrieval_stats(applicant: Dict[str, Any], neighbors: List[Dict[str, Any]], stats: Dict[str, Any]) -> Dict[str, Any]:
    """
    Frontend RetrievalSummary.stats expects:
      { default_rate, average_credit_score, median_income, total_neighbors }

    We’ll compute average_credit_score + median_income from neighbor raw payload if present,
    otherwise 0 (still valid type).
    """
    total_neighbors = int(stats.get("known_labels") or len(neighbors or []))
    default_rate = _safe_float(stats.get("default_rate"), 0.0)

    credit_scores: List[float] = []
    incomes: List[float] = []

    for n in neighbors or []:
        raw = n.get("raw") or {}
        cs = raw.get("credit_score")
        inc = raw.get("annual_income")
        if cs is not None:
            credit_scores.append(_safe_float(cs))
        if inc is not None:
            incomes.append(_safe_float(inc))

    avg_cs = sum(credit_scores) / len(credit_scores) if credit_scores else 0.0

    incomes_sorted = sorted(incomes)
    if incomes_sorted:
        mid = len(incomes_sorted) // 2
        if len(incomes_sorted) % 2 == 1:
            median_income = incomes_sorted[mid]
        else:
            median_income = (incomes_sorted[mid - 1] + incomes_sorted[mid]) / 2.0
    else:
        median_income = 0.0

    return {
        "default_rate": default_rate,
        "average_credit_score": avg_cs,
        "median_income": median_income,
        "total_neighbors": total_neighbors,
    }


def _extract_verdict_from_judge_text(judge_text: str) -> str:
    """
    Your Judge message is free text; frontend expects verdict enum:
      approve|reject|manual_review
    We'll do a conservative parse.
    """
    t = (judge_text or "").lower()
    if "final decision" in t and "approve" in t:
        return "approve"
    if "final decision" in t and "reject" in t:
        return "reject"
    if "final_decision" in t and "approve" in t:
        return "approve"
    if "final_decision" in t and "reject" in t:
        return "reject"
    # default safe
    return "manual_review"


def _build_decision_payload(workflow_messages: List[Dict[str, Any]], neighbor_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Frontend expects DecisionSchema:
      { verdict, justification: string[], evidence_refs: string[], confidence: 0..1, policy_refs?: [] }

    We’ll:
    - verdict: parse from judge text
    - justification: 3 bullets extracted (simple) or fallback
    - evidence_refs: top neighbor ids
    - confidence: if judge has "confidence:" percent, parse it; else 0.6
    - policy_refs: keep empty for now (unless you already store policy refs elsewhere)
    """
    judge_msg = None
    for m in reversed(workflow_messages or []):
        if (m.get("speaker") or "").lower() == "judge":
            judge_msg = m
            break

    judge_text = (judge_msg or {}).get("content") or ""
    verdict = _extract_verdict_from_judge_text(judge_text)

    # Try parse confidence like "**confidence:** 80" or "confidence: 60"
    conf = 0.6
    import re
    m = re.search(r"confidence\W+(\d{1,3})", judge_text, flags=re.IGNORECASE)
    if m:
        val = int(m.group(1))
        conf = max(0.0, min(1.0, val / 100.0))

    # Simple justification: take first 3 bullet-ish lines from judge text
    just: List[str] = []
    for line in judge_text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("*") or line.startswith("-"):
            just.append(line.lstrip("*- ").strip())
        if len(just) >= 4:
            break
    if not just:
        just = ["Decision produced by judge based on neighbors + applicant features."]

    evidence_refs = [n["neighbor_id"] for n in neighbor_items[:3]] if neighbor_items else []

    return {
        "verdict": verdict,
        "justification": just,
        "evidence_refs": evidence_refs,
        "confidence": conf,
        "policy_refs": [],   # keep compatible
    }


def run_case_pipeline(case_id: str, top_k: int = 8, mode: str = "standard") -> Dict[str, Any]:
    """
    SYNC entrypoint used by BackgroundTasks.
    It runs the async workflow using asyncio.run safely in a background thread.

    Returns:
      { messages, retrieval, decision }
    """
    if case_id not in CASES:
        raise ValueError(f"Case not found: {case_id}")

    applicant = CASES[case_id].get("applicant")
    if not applicant:
        raise ValueError("Applicant not saved for this case_id (PATCH /cases/{caseId}/applicant first).")

    # Run async pipeline in this background thread
    return asyncio.run(_run_async_pipeline(applicant=applicant, top_k=top_k, mode=mode))


async def _run_async_pipeline(applicant: Dict[str, Any], top_k: int, mode: str) -> Dict[str, Any]:
    # 1) Encode applicant
    vec = encode_applicant_payload(applicant)

    # 2) Retrieve neighbors
    neighbors = retrieve_neighbors(vec, applicant_payload=applicant, top_k=top_k)
    stats = summarize_neighbor_stats(neighbors)

    # 3) Run debate workflow
    init_state = {
        "applicant_payload": applicant,
        "neighbors": neighbors,
        "neighbor_stats": stats,
        "messages": [],
        "debate_topic": "Should we approve this loan application?",
        "stage": "opening",
        "speaker": "risk",
        "mode": mode,  # harmless if ignored
    }

    wf = CreditDebateWorkflow()
    final_state = await wf.run(init_state)

    wf_messages = final_state.get("messages") or []

    # ---- Map to frontend shapes ----
    transcript_messages = _map_transcript_messages(wf_messages)
    neighbor_items = _map_neighbors_for_frontend(neighbors)
    retrieval_stats = _compute_retrieval_stats(applicant, neighbors, stats)

    retrieval = {
        "top_k": top_k,
        "neighbors": neighbor_items,
        "stats": retrieval_stats,
    }

    decision = _build_decision_payload(wf_messages, neighbor_items)

    return {
        "messages": transcript_messages,
        "retrieval": retrieval,
        "decision": decision,
    }
