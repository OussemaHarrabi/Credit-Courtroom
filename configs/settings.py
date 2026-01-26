from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",   # ✅ ignore env vars we haven't modeled yet
    )
    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "applicants_v1"
    QDRANT_VECTOR_SIZE: int = 128

    # Groq
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # Encoder artifacts
    ENCODER_DIR: str = "artifacts/encoder"
    ENCODER_WEIGHTS: str = "encoder_best.pt"
    ENCODER_SCALER: str = "scaler.joblib"
    ENCODER_FEATURES: str = "feature_cols.joblib"

    # Retrieval
    TOPK_POS: int = 6
    TOPK_NEG: int = 6


settings = Settings()
