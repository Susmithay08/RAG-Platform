import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.services.embeddings import embed_texts, embed_query
import logging
import re

logger = logging.getLogger(__name__)

_client = None


def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def _collection_name(workspace_id: str) -> str:
    # ChromaDB collection names must be alphanumeric + hyphens, 3-63 chars
    safe = re.sub(r"[^a-zA-Z0-9-]", "-", workspace_id)
    return f"ws-{safe}"[:63]


def add_documents(workspace_id: str, chunks: list[str], doc_id: str, filename: str):
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=_collection_name(workspace_id),
        metadata={"hnsw:space": "cosine"},
    )
    embeddings = embed_texts(chunks)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
    collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
    logger.info(f"Added {len(chunks)} chunks to workspace {workspace_id}")


def query_documents(workspace_id: str, query: str, n_results: int = 5) -> list[dict]:
    client = get_chroma_client()
    try:
        collection = client.get_collection(name=_collection_name(workspace_id))
    except Exception:
        return []

    query_embedding = embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    if results["documents"] and results["documents"][0]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            chunks.append({
                "text": doc,
                "filename": meta.get("filename", "unknown"),
                "doc_id": meta.get("doc_id", ""),
                "chunk_index": meta.get("chunk_index", 0),
                "score": round(1 - dist, 4),
            })
    return chunks


def delete_document_chunks(workspace_id: str, doc_id: str):
    client = get_chroma_client()
    try:
        collection = client.get_collection(name=_collection_name(workspace_id))
        collection.delete(where={"doc_id": doc_id})
        logger.info(f"Deleted chunks for doc {doc_id}")
    except Exception as e:
        logger.warning(f"Could not delete chunks: {e}")


def get_workspace_doc_count(workspace_id: str) -> int:
    client = get_chroma_client()
    try:
        collection = client.get_collection(name=_collection_name(workspace_id))
        return collection.count()
    except Exception:
        return 0
