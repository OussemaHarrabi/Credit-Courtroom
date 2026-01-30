from sentence_transformers import SentenceTransformer
from core.supabase_client import supabase

_model = None

def _get_model():
    global _model
    if _model is None:
        print("initializing model...")
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model

def retrieve_policies(query_text: str, k: int = 5):
    model = _get_model()
    query_embedding = model.encode(query_text).tolist()
    res = supabase.rpc("match_policy_chunks", {"query_embedding": query_embedding, "match_count": k}).execute()
    return res.data or []
