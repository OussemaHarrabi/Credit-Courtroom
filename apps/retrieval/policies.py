import os
from sentence_transformers import SentenceTransformer
from supabase import create_client

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

supabase = create_client(
    os.getenv("SUPABASE_URL"), # type: ignore
    os.getenv("SUPABASE_ANON_KEY"), # type: ignore
)

def retrieve_policies(decision_text: str, k: int = 5):
    query_embedding = model.encode(decision_text).tolist()

    result = supabase.rpc(
        "match_policy_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": k,
        },
    ).execute()

    return result.data