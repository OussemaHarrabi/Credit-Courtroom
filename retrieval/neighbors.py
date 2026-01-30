# retrieval/neighbors.py
from typing import Dict, Any, List, Optional
from retrieval.qdrant.client import get_qdrant, get_collection

def _qdrant_search(client, collection: str, query_vector: List[float], limit: int):
    # Newer clients: query_points()
    if hasattr(client, "query_points"):
        res = client.query_points(
            collection_name=collection,
            query=query_vector,
            limit=limit,
            with_payload=True,
        )
        # res.points contains PointStruct-like objects
        return res.points

    # Older clients: search()
    if hasattr(client, "search"):
        return client.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=limit,
            with_payload=True,
        )

    raise RuntimeError("Your qdrant-client has neither search() nor query_points(). Please upgrade it.")

def retrieve_neighbors(
    query_vector: List[float],
    applicant_payload: Optional[dict] = None,
    top_k: int = 10
) -> List[Dict[str, Any]]:
    client = get_qdrant()
    col = get_collection()

    hits = _qdrant_search(client, col, query_vector, top_k)

    out = []
    for h in hits:
        payload = getattr(h, "payload", None) or {}
        raw_score = getattr(h, "score", 0.0)
        score = float(raw_score) if raw_score is not None else 0.0
        pid = payload.get("applicant_id") or payload.get("id") or str(getattr(h, "id", ""))

        out.append({
            "applicant_id": pid,
            "similarity": score,
            "loan_paid_back": int(payload.get("loan_paid_back", -1)) if payload.get("loan_paid_back") is not None else -1,
            "summary": payload.get("summary", ""),
            "raw": payload,
            "highlights": neighbor_highlights(applicant_payload or {}, payload),
        })
    return out

def summarize_neighbor_stats(neighbors: List[Dict[str, Any]]) -> Dict[str, Any]:
    known = [n for n in neighbors if n.get("loan_paid_back") in (0, 1)]
    if not known:
        return {"n": len(neighbors), "known_labels": 0}

    paid = sum(n["loan_paid_back"] for n in known)
    defaulted = len(known) - paid
    return {
        "n": len(neighbors),
        "known_labels": len(known),
        "paid_back": paid,
        "defaulted": defaulted,
        "default_rate": defaulted / max(len(known), 1),
    }

def neighbor_highlights(applicant: dict, neighbor_payload: dict) -> List[str]:
    keys = [
        "credit_score", "debt_to_income_ratio", "loan_amount", "loan_term", "grade_subgrade",
        "employment_status", "education_level", "loan_purpose", "delinquency_history", "num_of_delinquencies"
    ]
    hits = []
    for k in keys:
        if k in applicant and k in neighbor_payload:
            if applicant[k] == neighbor_payload[k]:
                hits.append(f"{k} matches ({applicant[k]})")
    return hits[:6]
