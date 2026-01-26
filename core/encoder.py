import os
import joblib
import numpy as np
import torch
import torch.nn as nn
from configs.settings import settings

class CreditEncoder(nn.Module):
    def __init__(self, in_dim: int, emb_dim: int = 128, dropout: float = 0.10):
        super().__init__()
        self.enc = nn.Sequential(
            nn.Linear(in_dim, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, emb_dim),
        )
        self.head = nn.Linear(emb_dim, 1)

    def forward(self, x):
        emb = self.enc(x)
        logits = self.head(emb)
        return logits, emb

class EncoderBundle:
    def __init__(self):
        base = settings.ENCODER_DIR
        self.feature_cols = joblib.load(os.path.join(base, settings.ENCODER_FEATURES))
        self.scaler = joblib.load(os.path.join(base, settings.ENCODER_SCALER))

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = CreditEncoder(in_dim=len(self.feature_cols), emb_dim=settings.QDRANT_VECTOR_SIZE).to(self.device)

        weights_path = os.path.join(base, settings.ENCODER_WEIGHTS)
        state = torch.load(weights_path, map_location=self.device)
        self.model.load_state_dict(state)
        self.model.eval()

    def embed_one(self, row_dict: dict) -> np.ndarray:
        """
        row_dict: must contain ALL feature columns (after one-hot), but we’ll build it safely.
        """
        # build vector in correct column order
        x = np.zeros((1, len(self.feature_cols)), dtype=np.float32)
        for j, col in enumerate(self.feature_cols):
            val = row_dict.get(col, 0.0)
            try:
                x[0, j] = float(val)
            except Exception:
                x[0, j] = 0.0

        x = self.scaler.transform(x).astype(np.float32)
        xb = torch.tensor(x, dtype=torch.float32).to(self.device)

        with torch.no_grad():
            _, emb = self.model(xb)
            emb = emb.cpu().numpy().astype(np.float32)[0]

        # L2 normalize (cosine ready)
        norm = np.linalg.norm(emb) + 1e-12
        return emb / norm
