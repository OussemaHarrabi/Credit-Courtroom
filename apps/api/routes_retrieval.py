from fastapi import APIRouter
from apps.retrieval.policies import retrieve_policies

router = APIRouter(prefix="/retrieval", tags=["retrieval"])

@router.post("/policies")
def retrieve_policy_chunks(payload: dict):
    """
    payload = {
        "decision_text": "...",
        "top_k": 5
    }
    """
    matches = retrieve_policies(
        payload["decision_text"],
        k=payload.get("top_k", 5)
    )

    return {
        "query": payload["decision_text"],
        "matches": matches,
    }
