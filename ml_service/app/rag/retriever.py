"""Knowledge retrieval."""
from __future__ import annotations

import structlog

from app.rag.embeddings import EmbeddingService
from app.rag.vector_store import VectorStore
from app.schemas.investigation import RAGSearchResult

logger = structlog.get_logger(__name__)


class KnowledgeRetriever:
    def __init__(self):
        self.embedder = EmbeddingService()
        self.store = VectorStore()

    def retrieve(self, company_id: str, query: str, top_k: int = 5) -> RAGSearchResult:
        logger.info("Retrieving knowledge", company_id=company_id, query=query)
        
        query_embedding = self.embedder.embed_single(query)
        
        # Vector store handles company isolation by using company_id collection
        results = self.store.search(company_id, query_embedding, top_k=top_k)
        
        chunks = []
        for res in results:
            chunks.append({
                "text": res["text"],
                "metadata": res["metadata"],
                "relevance_score": 1.0 - res["distance"],  # assuming cosine or l2 distance logic roughly mapped
                "document_id": res["metadata"].get("document_id", ""),
                "document_type": res["metadata"].get("document_type", ""),
            })
            
        return RAGSearchResult(
            chunks=chunks,
            query=query,
            company_id=company_id
        )
