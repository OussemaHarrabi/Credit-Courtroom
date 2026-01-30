from __future__ import annotations

import argparse
import os
from typing import Optional

import PyPDF2

from chonkie import RecursiveChunker
from core.supabase_client import supabase


def _extract_text_from_pdf(local_path: str) -> str:
    reader = PyPDF2.PdfReader(local_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def _extract_text_from_docx(local_path: str) -> str:
    # Optional dependency
    try:
        import docx  # type: ignore
    except Exception as e:
        raise RuntimeError("DOCX support requires 'python-docx' to be installed") from e

    d = docx.Document(local_path)
    parts = [p.text for p in d.paragraphs if (p.text or "").strip()]
    return "\n".join(parts) + "\n"

def ingest_policy(bucket: str, file_name: str, policy_name: str, policy_id: Optional[str] = None):
    local_path = os.path.join("ingestion", "policies", file_name)

    print("⬇️ downloading PDF from supabase...")
    data = supabase.storage.from_(bucket).download(file_name)
    if not data:
        raise RuntimeError("failed to download PDF from supabase")

    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    with open(local_path, "wb") as f:
        f.write(data)

    ext = file_name.lower().rsplit(".", 1)[-1] if "." in file_name else ""
    if ext == "pdf":
        print("📖 reading PDF...")
        text = _extract_text_from_pdf(local_path)
    elif ext == "docx":
        print("📖 reading DOCX...")
        text = _extract_text_from_docx(local_path)
    else:
        raise RuntimeError(f"Unsupported policy file type: .{ext}")

    print(f"📄 extracted {len(text)} characters")

    print("✂️ chunking...")
    chunker = RecursiveChunker()
    chunks = chunker.chunk(text)
    print(f"generated {len(chunks)} chunks")

    print("📥 inserting chunks into Supabase...")
    for idx, chunk in enumerate(chunks):
        row = {
            "policy_name": policy_name,
            "section": f"Section {idx+1}",
            "content": getattr(chunk, "text", str(chunk)),
        }
        if policy_id:
            # If the Supabase table doesn't have this column, we'll fall back.
            row["policy_id"] = policy_id

        try:
            supabase.table("policy_chunks").insert(row).execute()
        except Exception:
            # Backward compatible insert (in case policy_id column doesn't exist)
            row.pop("policy_id", None)
            supabase.table("policy_chunks").insert(row).execute()

    print("✅ ingestion complete")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bucket", default="bank-policies")
    parser.add_argument("--file", required=True)
    parser.add_argument("--policy_name", required=True)
    parser.add_argument("--policy_id", default=None)
    args = parser.parse_args()

    ingest_policy(args.bucket, args.file, args.policy_name, policy_id=args.policy_id)
