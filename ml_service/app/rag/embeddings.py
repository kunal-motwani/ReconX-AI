"""Embedding service for RAG."""
from __future__ import annotations

import hashlib
import structlog

logger = structlog.get_logger(__name__)


class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance.cache = {}
        return cls._instance

    def _get_model(self):
        if self._model is None:
            logger.info("Loading sentence-transformers model...")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Model loaded")
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        results = []
        texts_to_embed = []
        indices_to_embed = []

        for i, text in enumerate(texts):
            h = hashlib.md5(text.encode("utf-8")).hexdigest()
            if h in self.cache:
                results.append(self.cache[h])
            else:
                results.append(None)
                texts_to_embed.append(text)
                indices_to_embed.append(i)

        if texts_to_embed:
            model = self._get_model()
            embeddings = model.encode(texts_to_embed).tolist()
            for i, emb in zip(indices_to_embed, embeddings):
                results[i] = emb
                h = hashlib.md5(texts[i].encode("utf-8")).hexdigest()
                self.cache[h] = emb

        return results

    def embed_single(self, text: str) -> list[float]:
        return self.embed([text])[0]
