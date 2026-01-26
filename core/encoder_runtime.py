# core/encoder_runtime.py
from __future__ import annotations

from typing import Dict, Any, List, Optional

import numpy as np

# uses YOUR existing bundle (loads scaler/feature_cols/weights once)
from core.encoder import EncoderBundle


_bundle: Optional[EncoderBundle] = None


def get_encoder_bundle() -> EncoderBundle:
    global _bundle
    if _bundle is None:
        _bundle = EncoderBundle()
    return _bundle


def encode_applicant_payload(applicant: Dict[str, Any]) -> List[float]:
    """
    Takes RAW applicant JSON (your real schema),
    converts it to the model's expected one-hot+numeric dict,
    returns embedding list[float] length = settings.QDRANT_VECTOR_SIZE (128).
    """
    bundle = get_encoder_bundle()
    row = build_feature_row(applicant, bundle.feature_cols)
    emb = bundle.embed_one(row)  # np.ndarray (128,) already L2-normalized in your code
    return emb.tolist()


def build_feature_row(applicant: Dict[str, Any], feature_cols: List[str]) -> Dict[str, float]:
    """
    Build a dict keyed by the training feature columns.

    Training used:
      - numeric columns from df except CAT_COLS + TARGET_COL
      - plus pd.get_dummies(df[CAT_COLS].astype(str), drop_first=False)
        where CAT_COLS = ["education_level", "employment_status", "loan_purpose"]

    So one-hot columns look like:
      education_level_Bachelor's
      employment_status_Employed
      loan_purpose_Car
    """
    row: Dict[str, float] = {c: 0.0 for c in feature_cols}

    # 1) Fill numeric columns where names match
    for k, v in applicant.items():
        if k in row:
            try:
                row[k] = float(v)
            except Exception:
                # ignore strings or non-castable values
                pass

    # 2) One-hot for categories (exact string match matters)
    for cat in ["education_level", "employment_status", "loan_purpose"]:
        val = applicant.get(cat, None)
        if isinstance(val, str) and val.strip():
            one_hot_col = f"{cat}_{val}"
            if one_hot_col in row:
                row[one_hot_col] = 1.0

    return row
