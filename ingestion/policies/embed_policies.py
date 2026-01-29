import os
from dotenv import load_dotenv
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
import time

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) # type: ignore

print("initializing model...")
model = SentenceTransformer(EMBEDDING_MODEL, device="cpu")

def embed_policies():
    print("fetching chunks from supabase...")
    chunks = supabase.table("policy_chunks").select("*").execute().data

    if not chunks:
        print("no chunks found in supabase!")
        return

    print(f"fetched {len(chunks)} chunks")

    for i, chunk in enumerate(chunks, 1):
        text = chunk.get("content") # type: ignore
        if not text or text.strip() == "": # type: ignore
            print(f"skipping chunk {i}: empty or missing text")
            continue

        # embedding
        vector = model.encode(text).tolist()  # type: ignore 

        supabase.table("policy_chunks").update({
            "embedding": vector
        }).eq("id", chunk["id"]).execute() # type: ignore

        print(f"Embedded chunk {i}/{len(chunks)}")

    print("Embedding complete!")

if __name__ == "__main__":
    embed_policies()