from typing import TypedDict, List, Dict, Literal, Any

Stage = Literal["opening", "rebuttal", "counter", "final_argument", "verdict"]

class DebateMessage(TypedDict):
    speaker: str
    content: str
    validated: bool
    stage: Stage

class EvidenceItem(TypedDict, total=False):
    applicant_id: str
    score: float
    loan_paid_back: int
    summary: str
    raw: Dict[str, Any]

class DebateState(TypedDict, total=False):
    # Input
    applicant_payload: Dict[str, Any]         # info of new applicant
    query_text: str                           # optional text query form
    # Retrieval
    neighbors: List[EvidenceItem]
    neighbor_stats: Dict[str, Any]
    # Debate control
    debate_topic: str
    positions: Dict[str, str]
    messages: List[DebateMessage]
    stage: Stage
    speaker: Literal["risk", "advocate", "moderator", "judge"]
    times_risk_fact_checked: int
    times_adv_fact_checked: int
    validated: bool
    judge_verdict: Dict[str, Any]
