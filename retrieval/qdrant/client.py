# retrieval/qdrant/client.py
import os
from functools import lru_cache
from qdrant_client import QdrantClient
from configs.settings import settings

@lru_cache(maxsize=1)
def get_qdrant() -> QdrantClient:
    """
    Returns a cached QdrantClient.
    Works with local docker qdrant (http://localhost:6333)
    """
    url = getattr(settings, "QDRANT_URL", None) or os.getenv("QDRANT_URL", "http://localhost:6333")
    api_key = getattr(settings, "QDRANT_API_KEY", None) or os.getenv("QDRANT_API_KEY", None)

    if api_key:
        return QdrantClient(url=url, api_key=api_key)
    return QdrantClient(url=url)

def get_collection() -> str:
    """
    Collection name where applicants are stored.
    """
    return getattr(settings, "QDRANT_COLLECTION", None) or os.getenv("QDRANT_COLLECTION", "applicants_v1")
