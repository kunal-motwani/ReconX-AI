"""Vector store for RAG."""
from __future__ import annotations

import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)


class VectorStore:
    def __init__(self):
        self.settings = get_settings()
        self.client = None
        self._init_client()

    def _init_client(self):
        try:
            import chromadb
            self.client = chromadb.PersistentClient(path=self.settings.VECTOR_DB_PATH)
        except Exception as e:
            logger.error("Failed to initialize ChromaDB", error=str(e))
            self.client = None

    def get_or_create_collection(self, company_id: str):
        if not self.client:
            raise RuntimeError("ChromaDB client not initialized")
        collection_name = f"company_{company_id}"
        return self.client.get_or_create_collection(name=collection_name)

    def add_documents(self, company_id: str, documents: list[str], metadatas: list[dict], ids: list[str]):
        if not self.client:
            logger.warning("Skipping vector store add due to missing client")
            return
            
        collection = self.get_or_create_collection(company_id)
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def search(self, company_id: str, query_embedding: list[float], top_k: int = 5) -> list[dict]:
        if not self.client:
            logger.warning("Skipping vector store search due to missing client")
            return []
            
        try:
            collection = self.client.get_collection(name=f"company_{company_id}")
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            out = []
            if results["documents"] and results["documents"][0]:
                for i in range(len(results["documents"][0])):
                    out.append({
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "distance": results["distances"][0][i] if results["distances"] else 0.0,
                    })
            return out
        except Exception as e:
            logger.error("Vector store search failed", error=str(e), company_id=company_id)
            return []

    def delete_company(self, company_id: str):
        if not self.client:
            return
            
        collection_name = f"company_{company_id}"
        try:
            self.client.delete_collection(name=collection_name)
        except Exception:
            pass
