from typing import Dict, Any
from langgraph.types import Command
from langgraph.graph import END

from workflow.debate_state import DebateState
from workflow.utils import create_msg, history
from workflow.llm import build_chain
from workflow.prompts import (
    RISK_SYSTEM, RISK_HUMAN,
    ADV_SYSTEM, ADV_HUMAN,
    MOD_SYSTEM, MOD_HUMAN,
    JUDGE_SYSTEM, JUDGE_HUMAN
)

# Node names (must match debate_workflow.py)
NODE_RISK = "risk_agent"
NODE_ADV = "advocate_agent"
NODE_MOD = "moderator"
NODE_JUDGE = "judge"


def _fmt_neighbors(neighbors):
    neighbors = neighbors or []
    lines = []
    for i, n in enumerate(neighbors[:10], 1):
        score = n.get("score")
        try:
            score_s = f"{float(score):.3f}"
        except Exception:
            score_s = "n/a"

        summ = (n.get("summary") or "")[:140]
        lines.append(
            f"{i}) id={n.get('applicant_id')} score={score_s} "
            f"loan_paid_back={n.get('loan_paid_back')} summary={summ}"
        )
    return "\n".join(lines) if lines else "(no neighbors found)"


class RiskAgentNode:
    def __init__(self):
        self.chain = build_chain(RISK_SYSTEM, RISK_HUMAN, temperature=0.2)

    def __call__(self, state: DebateState) -> Dict[str, Any]:
        msgs = state.get("messages", []) or []
        stage = state.get("stage", "opening")

        out = self.chain.invoke({
            "applicant_payload": state.get("applicant_payload", {}) or {},
            "neighbor_stats": state.get("neighbor_stats", {}) or {},
            "neighbors": _fmt_neighbors(state.get("neighbors", [])),
            "debate_history": history(msgs),
            "stage": stage,
        })

        return {
            "messages": msgs + [create_msg("risk", out, stage, validated=True)]
        }


class AdvocateAgentNode:
    def __init__(self):
        self.chain = build_chain(ADV_SYSTEM, ADV_HUMAN, temperature=0.3)

    def __call__(self, state: DebateState) -> Dict[str, Any]:
        msgs = state.get("messages", []) or []
        stage = state.get("stage", "rebuttal")

        opponent = ""
        for m in reversed(msgs):
            if m.get("speaker") == "risk":
                opponent = m.get("content", "")
                break

        out = self.chain.invoke({
            "applicant_payload": state.get("applicant_payload", {}) or {},
            "neighbor_stats": state.get("neighbor_stats", {}) or {},
            "neighbors": _fmt_neighbors(state.get("neighbors", [])),
            "opponent_statement": opponent,
            "debate_history": history(msgs),
            "stage": stage,
        })

        return {
            "messages": msgs + [create_msg("advocate", out, stage, validated=True)]
        }


class ModeratorNode:
    """
    Deterministic routing (like Deb8flow's DebateModeratorNode),
    BUT implemented correctly for LangGraph using Command(goto=...).
    """
    def __init__(self):
        # You can keep this chain for “style” / narration later, but we do NOT rely on LLM for routing.
        self.chain = build_chain(MOD_SYSTEM, MOD_HUMAN, temperature=0.0)

    def __call__(self, state: DebateState) -> Command[str]:
        stage = state.get("stage", "opening")
        speaker = state.get("speaker", "risk")

        # ✅ If we already reached verdict/judge, end safely.
        if stage == "verdict" or speaker == "judge":
            return Command(goto=NODE_JUDGE if speaker == "judge" else END)

        # Deterministic schedule
        if stage == "opening" and speaker == "risk":
            return Command(update={"stage": "rebuttal", "speaker": "advocate"}, goto=NODE_ADV)

        if stage == "rebuttal" and speaker == "advocate":
            return Command(update={"stage": "counter", "speaker": "risk"}, goto=NODE_RISK)

        if stage == "counter" and speaker == "risk":
            return Command(update={"stage": "final_argument", "speaker": "advocate"}, goto=NODE_ADV)

        if stage == "final_argument" and speaker == "advocate":
            return Command(update={"stage": "verdict", "speaker": "judge"}, goto=NODE_JUDGE)

        # Fallback: if state got weird, go to judge instead of crashing
        return Command(update={"stage": "verdict", "speaker": "judge"}, goto=NODE_JUDGE)


class JudgeNode:
    def __init__(self):
        self.chain = build_chain(JUDGE_SYSTEM, JUDGE_HUMAN, temperature=0.0)

    def __call__(self, state: DebateState) -> Dict[str, Any]:
        msgs = state.get("messages", []) or []

        out = self.chain.invoke({
            "applicant_payload": state.get("applicant_payload", {}) or {},
            "neighbor_stats": state.get("neighbor_stats", {}) or {},
            "neighbors": _fmt_neighbors(state.get("neighbors", [])),
            "debate_history": history(msgs),
        })

        verdict_msg = create_msg("judge", out, "verdict", validated=True)
        return {
            "messages": msgs + [verdict_msg],
            "judge_verdict": {"raw": out},
            "stage": "verdict",
            "speaker": "judge",
        }
