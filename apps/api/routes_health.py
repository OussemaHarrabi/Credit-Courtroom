from fastapi import APIRouter
from configs.settings import settings
from qdrant_client import QdrantClient
from neo4j import GraphDatabase

router = APIRouter()

@router.get("/health/qdrant")
def health_qdrant():
    client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key or None)
    info = client.get_collections()
    return {"status": "ok", "collections_count": len(info.collections)}

@router.get("/health/neo4j")
def health_neo4j():
    driver = GraphDatabase.driver(settings.neo4j_uri, auth=(settings.neo4j_user, settings.neo4j_password))
    with driver.session() as session:
        result = session.run("RETURN 1 AS ok").single()
    driver.close()
    return {"status": "ok", "neo4j_ok": result["ok"]}
