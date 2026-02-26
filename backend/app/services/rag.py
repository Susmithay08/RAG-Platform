import httpx
import json
from app.core.config import settings
from app.services.vector_store import query_documents
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful assistant that answers questions based on the provided document context.

Rules:
- Answer ONLY based on the provided context chunks
- If the context doesn't contain enough information, say so clearly
- Be concise and accurate
- Cite which document the information comes from when relevant
- Use markdown formatting for better readability"""


async def run_rag(workspace_id: str, query: str, n_results: int = 5) -> dict:
    # 1. Retrieve relevant chunks
    chunks = query_documents(workspace_id, query, n_results=n_results)

    if not chunks:
        return {
            "answer": "No documents found in this workspace. Please upload some documents first.",
            "sources": [],
        }

    # 2. Build context
    context_parts = []
    for i, chunk in enumerate(chunks):
        context_parts.append(f"[Source {i+1} - {chunk['filename']}]\n{chunk['text']}")
    context = "\n\n---\n\n".join(context_parts)

    # 3. Call Groq LLM
    prompt = f"""Context from documents:

{context}

---

Question: {query}

Answer based on the context above:"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.1,
                },
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"LLM error: {e}")
        answer = f"Error generating answer: {str(e)}"

    # 4. Format sources
    seen = set()
    sources = []
    for chunk in chunks:
        key = (chunk["doc_id"], chunk["chunk_index"])
        if key not in seen:
            seen.add(key)
            sources.append({
                "filename": chunk["filename"],
                "doc_id": chunk["doc_id"],
                "chunk_index": chunk["chunk_index"],
                "score": chunk["score"],
                "preview": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
            })

    return {"answer": answer, "sources": sources}
