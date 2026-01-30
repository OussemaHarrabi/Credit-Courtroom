from fastapi import APIRouter
from apps.api.routes_cases import CASES

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def dashboard_stats():
    items = list(CASES.values())
    total = len(items)

    approvals = 0
    rejects = 0
    manual_reviews = 0
    draft = 0
    running = 0

    for c in items:
        if c["status"] == "draft":
            draft += 1
        if c["status"] == "running":
            running += 1
        if c.get("decision"):
            v = c["decision"].get("verdict")
            if v == "approve":
                approvals += 1
            elif v == "reject":
                rejects += 1
            elif v == "manual_review":
                manual_reviews += 1

    return {
        "total_cases": total,
        "approvals": approvals,
        "rejects": rejects,
        "manual_reviews": manual_reviews,
        "draft_cases": draft,
        "running_cases": running,
    }
