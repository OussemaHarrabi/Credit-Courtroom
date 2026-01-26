import os
import uuid
import pandas as pd

from qdrant_client.http import models
from configs.settings import settings
from retrieval.qdrant.client import get_qdrant, ensure_collection
from core.encoder import EncoderBundle

DATASET_PATH = r"ingestion/dataset1_profiles/loan_dataset_20000.csv"

def build_payload(row: pd.Series) -> dict:
    # Keep payload minimal but useful for evidence
    payload = row.to_dict()

    # Force int label
    if "loan_paid_back" in payload:
        try:
            payload["loan_paid_back"] = int(payload["loan_paid_back"])
        except Exception:
            payload["loan_paid_back"] = 0

    return payload

def main():
    ensure_collection()
    client = get_qdrant()
    enc = EncoderBundle()

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Missing dataset at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    if "loan_paid_back" not in df.columns:
        raise ValueError("dataset1 must contain 'loan_paid_back' column")

    # ---- Build one-hot columns exactly like training ----
    # Identify categorical columns used in training (must match your teammate’s training)
    CAT_COLS = ["education_level", "employment_status", "loan_purpose"]
    num_cols = [c for c in df.columns if c not in CAT_COLS + ["loan_paid_back"]]

    X_num = df[num_cols].copy()
    X_cat = pd.get_dummies(df[CAT_COLS].astype(str), drop_first=False)
    X_all = pd.concat([X_num, X_cat], axis=1)

    # align to feature_cols
    X_all = X_all.reindex(columns=enc.feature_cols, fill_value=0)

    collection = settings.QDRANT_COLLECTION
    batch_size = 256

    points = []
    for i in range(len(df)):
        # deterministic-ish id for stable reruns
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"applicant-{i}"))

        row_features = X_all.iloc[i].to_dict()
        vector = enc.embed_one(row_features).tolist()

        payload = build_payload(df.iloc[i])
        payload["applicant_id"] = i

        points.append(
            models.PointStruct(
                id=point_id,
                vector=vector,
                payload=payload,
            )
        )

        if len(points) >= batch_size:
            client.upsert(collection_name=collection, points=points)
            points = []

    if points:
        client.upsert(collection_name=collection, points=points)

    print(f"✅ Ingested {len(df)} applicants into Qdrant collection '{collection}'")

if __name__ == "__main__":
    main()
