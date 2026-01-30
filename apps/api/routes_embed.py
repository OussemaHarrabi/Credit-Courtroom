from fastapi import APIRouter
from ingestion.policies.embed_policies import embed_policies

router = APIRouter(prefix="/policies", tags=["policies"])

@router.post("/embed")
def embed_policy_chunks():
    embed_policies()
    return {"message": "All policy chunks embedded"}
