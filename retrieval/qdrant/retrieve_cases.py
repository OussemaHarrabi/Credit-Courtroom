from qdrant_client.http import models
from configs.settings import settings
from retrieval.qdrant.client import get_qdrant

def search_neighbors(query_vector: list[float], label: int, limit: int):
    client = get_qdrant()
    flt = models.Filter(
        must=[
            models.FieldCondition(
                key="loan_paid_back",
                match=models.MatchValue(value=label),
            )
        ]
    )
    res = client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        limit=limit,
        query_filter=flt,
        with_payload=True,
    )
    return res
