from typing import Dict, Any
from langgraph.types import Command # type: ignore
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
from apps.retrieval.policies import retrieve_policies


NODE_RISK = "risk_agent"
NODE_ADV = "advocate_agent"
NODE_MOD = "moderator"
NODE_JUDGE = "judge"


def _fmt_neighbors(neighbors):
    neighbors = neighbors or []
    lines = []
    for i, n in enumerate(neighbors[:10], 1):
        sim = n.get("similarity")  # ✅ renamed from score
        try:
            sim_s = f"{float(sim):.3f}"
        except Exception:
            sim_s = "n/a"

        summ = (n.get("summary") or "")[:140]
        # ✅ explicitly disambiguate similarity vs credit_score
        lines.append(
            f"{i}) id={n.get('applicant_id')} similarity={sim_s} "
            f"(vector similarity, NOT credit score) "
            f"loan_paid_back={n.get('loan_paid_back')} summary={summ}"
        )
    return "\n".join(lines) if lines else "(no neighbors found)"



class RiskAgentNode:
    def __init__(self):
        self.chain = build_chain(RISK_SYSTEM, RISK_HUMAN, temperature=0.0)

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
        self.chain = build_chain(ADV_SYSTEM, ADV_HUMAN, temperature=0.0)

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
    def __init__(self):
        self.chain = build_chain(MOD_SYSTEM, MOD_HUMAN, temperature=0.0)

    def __call__(self, state: DebateState) -> Command[str]:
        stage = state.get("stage", "opening")
        speaker = state.get("speaker", "risk")

        if stage == "verdict" or speaker == "judge":
            return Command(goto=NODE_JUDGE if speaker == "judge" else END)

        if stage == "opening" and speaker == "risk":
            return Command(update={"stage": "rebuttal", "speaker": "advocate"}, goto=NODE_ADV)

        if stage == "rebuttal" and speaker == "advocate":
            return Command(update={"stage": "counter", "speaker": "risk"}, goto=NODE_RISK)

        if stage == "counter" and speaker == "risk":
            return Command(update={"stage": "final_argument", "speaker": "advocate"}, goto=NODE_ADV)

        if stage == "final_argument" and speaker == "advocate":
            return Command(update={"stage": "verdict", "speaker": "judge"}, goto=NODE_JUDGE)

        return Command(update={"stage": "verdict", "speaker": "judge"}, goto=NODE_JUDGE)
    

def _fmt_policy_evidence(matches):
    
    if not matches:
        return "(no relevant policy clauses retrieved)"

    lines = []
    for i, m in enumerate(matches[:8], 1):
        pid = m.get("id", "unknown")
        sim = m.get("similarity")

        try:
            sim_s = f"{float(sim):.3f}"
        except Exception:
            sim_s = "n/a"

        content = (m.get("content") or "").strip().replace("\n", " ")
        content = content[:320]

        # IMPORTANT: include id + similarity in a stable citation format
        lines.append(f"{i}) POLICY[id={pid}, sim={sim_s}]: {content}")

    return "\n".join(lines)


class JudgeNode:
    def __init__(self):
        self.chain = build_chain(JUDGE_SYSTEM, JUDGE_HUMAN, temperature=0.0)

    def __call__(self, state: DebateState) -> Dict[str, Any]:
        msgs = state.get("messages", []) or []

        # Build a query from debate + applicant info (no DB storage needed)
        debate_text = history(msgs)
        applicant_payload = state.get("applicant_payload", {}) or {}
        neighbor_stats = state.get("neighbor_stats", {}) or {}

        policy_query = (
            "Use the following debate + applicant context to find the most relevant bank policy clauses.\n\n"
            f"APPLICANT:\n{applicant_payload}\n\n"
            f"NEIGHBOR_STATS:\n{neighbor_stats}\n\n"
            f"DEBATE:\n{debate_text}\n"
        )

        # Retrieve policy clauses
        policy_matches = retrieve_policies(policy_query, k=10)
        policy_matches = [m for m in policy_matches if (m.get("similarity") or 0) >= 0.60]
        policy_evidence = _fmt_policy_evidence(policy_matches)


        # Judge receives everything
        out = self.chain.invoke({
            "applicant_payload": applicant_payload,
            "neighbor_stats": neighbor_stats,
            "neighbors": _fmt_neighbors(state.get("neighbors", [])),
            "debate_history": debate_text,
            "policy_evidence": policy_evidence,
        })

        verdict_msg = create_msg("judge", out, "verdict", validated=True)
        return {
            "messages": msgs + [verdict_msg],
            "judge_verdict": {
                "raw": out,
                "policy_matches": policy_matches,   # so you can inspect/debug
            },
            "stage": "verdict",
            "speaker": "judge",
        }
