import os
from dotenv import load_dotenv

# ✅ Load env FIRST (before groq/langchain imports)
load_dotenv()
print("GROQ_API_KEY loaded:", bool(os.getenv("GROQ_API_KEY")))

import asyncio

from core.encoder_runtime import encode_applicant_payload
from retrieval.neighbors import retrieve_neighbors, summarize_neighbor_stats
from workflow.debate_workflow import CreditDebateWorkflow


def _safe(x, default):
    return x if x is not None else default


async def main():
    # Real applicant payload (your schema)
    applicant = {
        "age": 24,
        "gender": "Female",
        "marital_status": "Married",
        "education_level": "Bachelor's",
        "annual_income": 55579.39,
        "monthly_income": 4631.62,
        "employment_status": "Employed",
        "debt_to_income_ratio": 0.351,
        "credit_score": 606,
        "loan_amount": 17149.57,
        "loan_purpose": "Car",
        "interest_rate": 12.4,
        "loan_term": 36,
        "installment": 572.89,
        "grade_subgrade": "E4",
        "num_of_open_accounts": 4,
        "total_credit_limit": 56281.81,
        "current_balance": 47970.87,
        "delinquency_history": 2,
        "public_records": 0,
        "num_of_delinquencies": 2,
        "applicant_id": 333543,
    }

    # 1) Encode applicant
    vec = encode_applicant_payload(applicant)  # list[float] length 128

    # 2) Retrieve similar past applicants
    neighbors = retrieve_neighbors(vec, applicant_payload=applicant, top_k=10)
    stats = summarize_neighbor_stats(neighbors)

    # Print quick retrieval summary (nice for demo)
    print("\n==============================")
    print("===== RETRIEVAL SUMMARY =====")
    print("==============================")
    print("Applicant ID:", applicant.get("applicant_id"))
    print("Neighbors retrieved:", len(neighbors))
    print("Stats:", stats)

    print("\nTop 5 neighbors:")
    for i, n in enumerate(neighbors[:5], 1):
        print(
            f" {i}) id={n.get('applicant_id')} score={n.get('score')} "
            f"loan_paid_back={n.get('loan_paid_back')} "
            f"highlights={n.get('highlights', [])}"
        )

    # 3) Run debate workflow
    init_state = {
        "applicant_payload": applicant,
        "neighbors": neighbors,
        "neighbor_stats": stats,
        "messages": [],
        "debate_topic": "Should we approve this loan application?",
        "stage": "opening",
        "speaker": "risk",
    }

    wf = CreditDebateWorkflow()
    final_state = await wf.run(init_state)

    # 4) Print debate transcript
    messages = _safe(final_state.get("messages"), [])
    print("\n==============================")
    print("===== DEBATE TRANSCRIPT =====")
    print("==============================\n")

    if not messages:
        print("No messages produced. Check Groq model name / API key / workflow routing.")
        return

    for m in messages:
        stage = (m.get("stage") or "unknown").upper()
        speaker = (m.get("speaker") or "unknown").upper()
        content = m.get("content") or ""
        print(f"[{stage}] {speaker}:\n{content}\n")

    # 5) Final verdict
    print("\n========================")
    print("===== FINAL VERDICT =====")
    print("========================\n")
    print(messages[-1].get("content", "(no verdict text)"))


if __name__ == "__main__":
    asyncio.run(main())
