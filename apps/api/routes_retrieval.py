from fastapi import APIRouter
from apps.retrieval.policies import retrieve_policies

router = APIRouter(prefix="/retrieval", tags=["retrieval"])

@router.post("/policies")
def retrieve_policy_chunks(payload: dict):
    decision_text = payload["decision_text"]
    return retrieve_policies(decision_text)