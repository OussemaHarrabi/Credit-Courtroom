import os
import PyPDF2
from core.supabase_client import supabase
from chonkie import RecursiveChunker

BUCKET_NAME = "bank-policies"
FILE_NAME = "pub-ch-commercial-loans.pdf" 
LOCAL_PATH = os.path.join(os.getcwd(), "ingestion/policies", FILE_NAME)
POLICY_NAME = "credit policy v1"

def download_pdf():
    print("downloading PDF from supabase...")
    data = supabase.storage.from_(BUCKET_NAME).download(FILE_NAME)
    if not data:
        raise RuntimeError("failed to download PDF from supabase")
    
    os.makedirs(os.path.dirname(LOCAL_PATH), exist_ok=True)
    with open(LOCAL_PATH, "wb") as f:
        f.write(data)
    print(f"PDF downloaded to {LOCAL_PATH}")


def ingest_policy():
    download_pdf()

    print("reading PDF...")
    reader = PyPDF2.PdfReader(LOCAL_PATH)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    print(f"total PDF text length: {len(text)} characters")

    # recursive chunk
    print("chunking PDF text...")
    chunker = RecursiveChunker()  
    chunks = chunker.chunk(text)  
    print(f"generated {len(chunks)} chunks")

    # insert into supabase
    print("inserting chunks into supabase...")
    for idx, chunk in enumerate(chunks):
        supabase.table("policy_chunks").insert({
            "policy_name": POLICY_NAME,
            "section": f"Section {idx+1}",
            "content": getattr(chunk, "text", str(chunk)),
        }).execute()
    print(f"inserted {len(chunks)} chunks into Supabase")

if __name__ == "__main__":
    ingest_policy()