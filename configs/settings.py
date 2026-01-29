from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

load_dotenv()  #take environment variables from .env file

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",   #ignore env vars we haven't modeled yet
    )
    # qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "applicants_v1"
    QDRANT_VECTOR_SIZE: int = 128

    # groq
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # encoder artifacts
    ENCODER_DIR: str = "artifacts/encoder"
    ENCODER_WEIGHTS: str = "encoder_best.pt"
    ENCODER_SCALER: str = "scaler.joblib"
    ENCODER_FEATURES: str = "feature_cols.joblib"

    # retrieval
    TOPK_POS: int = 6
    TOPK_NEG: int = 6


settings = Settings() # type: ignore