import os
from dotenv import load_dotenv
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict, Any, Optional

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
EMBEDDING_MODEL = os.getenv("POLICY_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment")

# ✅ HuggingFace auth + cache directory
# sentence-transformers uses HF_HOME/HF_TOKEN automatically
HF_TOKEN = os.getenv("HF_TOKEN")
if HF_TOKEN:
    os.environ["HUGGINGFACE_HUB_TOKEN"] = HF_TOKEN  # extra compatibility
HF_HOME = os.getenv("HF_HOME")
if HF_HOME:
    os.environ["HF_HOME"] = HF_HOME

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)  # type: ignore


_model: Optional[SentenceTransformer] = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print("initializing SentenceTransformer once...")
        _model = SentenceTransformer(EMBEDDING_MODEL, device="cpu")
    return _model


def _chunks(lst: List[Dict[str, Any]], size: int) -> List[List[Dict[str, Any]]]:
    return [lst[i:i + size] for i in range(0, len(lst), size)]


def embed_policies(
    policy_name: Optional[str] = None,
    batch_size: int = 32,
    update_batch_size: int = 50,
    skip_if_embedding_exists: bool = True,
):
    """
    Embeds policy_chunks.content into policy_chunks.embedding

    Faster + safer:
    - model initialized lazily (not on import)
    - embedding is batched
    - updates are batched
    - optionally skip rows where embedding already exists
    """
    print("fetching chunks from supabase...")

    q = supabase.table("policy_chunks").select("id,content,embedding")
    if policy_name:
        q = q.eq("policy_name", policy_name)
    # If your table is large, add pagination later. For demo, fetch all:
    rows = q.execute().data

    if not rows:
        print("no chunks found in supabase!")
        return

    # Filter empty + already embedded
    todo = []
    for r in rows:
        text = (r.get("content") or "").strip()
        if not text:
            continue
        if skip_if_embedding_exists and r.get("embedding") is not None:
            continue
        todo.append({"id": r["id"], "content": text})

    if not todo:
        print("nothing to embed (all chunks already embedded or empty).")
        return

    print(f"fetched {len(rows)} chunks; embedding {len(todo)} chunks...")

    model = get_model()

    updates: List[Dict[str, Any]] = []
    done = 0

    for batch in _chunks(todo, batch_size):
        texts = [b["content"] for b in batch]

        # ✅ Batch encode + normalize (good for cosine search)
        vectors = model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        vectors = np.nan_to_num(vectors, nan=0.0, posinf=0.0, neginf=0.0)

        for item, vec in zip(batch, vectors):
            updates.append({"id": item["id"], "embedding": vec.astype(float).tolist()})

        # Batch update to Supabase (chunked)
        if len(updates) >= update_batch_size:
            _flush_updates(updates)
            done += len(updates)
            print(f"embedded+updated {done}/{len(todo)}")
            updates.clear()

    if updates:
        _flush_updates(updates)
        done += len(updates)
        print(f"embedded+updated {done}/{len(todo)}")

    print("Embedding complete!")


def _flush_updates(updates: List[Dict[str, Any]]):
    """
    Updates rows one-by-one because supabase-python update() doesn't do bulk upsert cleanly across all versions.
    Still reduces overhead by doing embeddings in batches.
    """
    for u in updates:
        supabase.table("policy_chunks").update({"embedding": u["embedding"]}).eq("id", u["id"]).execute()


if __name__ == "__main__":
    embed_policies()
