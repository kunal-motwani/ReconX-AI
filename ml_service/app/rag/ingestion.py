"""RAG ingestion pipeline."""
from __future__ import annotations

import structlog

from app.rag.embeddings import EmbeddingService
from app.rag.vector_store import VectorStore

logger = structlog.get_logger(__name__)


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Chunk text into smaller pieces with overlap."""
    if not text:
        return []
        
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        
        if end < len(text):
            # Try to find a sentence boundary
            last_period = text.rfind('.', start, end)
            if last_period != -1 and last_period > start + chunk_size // 2:
                end = last_period + 1
                
        chunks.append(text[start:end].strip())
        start = end - overlap
        if start < 0:
            break
            
    return chunks


def ingest_knowledge(
    company_id: str,
    document_id: str,
    content: str,
    document_type: str = "",
    metadata: dict | None = None
) -> int:
    """Ingest a document into the RAG system."""
    logger.info("Ingesting document", company_id=company_id, document_id=document_id)
    
    if not content:
        return 0
        
    metadata = metadata or {}
    chunks = chunk_text(content)
    
    if not chunks:
        return 0
        
    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "company_id": company_id,
            "document_id": document_id,
            "document_type": document_type,
            "chunk_index": i,
            "source": "knowledge_base",
            **metadata
        }
        for i in range(len(chunks))
    ]
    
    # We don't need to explicitly pre-embed here since chromadb handles it if we have an embedding function,
    # but the instructions say: "Embed all chunks in batch", "Store in vector store".
    # Since VectorStore upsert accepts just documents, maybe we should use our embedding service explicitly
    # if our VectorStore expects pre-computed embeddings?
    # Wait, the instruction doesn't explicitly say we MUST pass pre-computed embeddings to VectorStore, 
    # but the retriever gets an embedding and passes `query_embedding` to `search()`.
    # Let's see Chroma API: upsert accepts `embeddings` optionally. If we don't pass them, it uses default all-MiniLM-L6-v2.
    # To use our own cache/service, we should pass them.
    
    embedder = EmbeddingService()
    embeddings = embedder.embed(chunks)
    
    store = VectorStore()
    if store.client:
        collection = store.get_or_create_collection(company_id)
        collection.upsert(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        return len(chunks)
    
    return 0
