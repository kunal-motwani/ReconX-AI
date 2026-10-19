"""FastAPI application — AI Agent for Finance service.

All endpoints are strongly typed with Pydantic models.
The existing Node.js backend calls these APIs.
"""
from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import get_settings
from app.schemas.documents import ExtractionRequest, ExtractionResult, DocumentClassification, DocumentType
from app.schemas.transactions import NormalizationRequest, NormalizationResult
from app.schemas.reconciliation import (
    ReconciliationRequest,
    ReconciliationBatchResult,
    MatchRequest,
    ReconciliationResult,
)
from app.schemas.anomalies import AnomalyDetectionRequest, AnomalyDetectionResult
from app.schemas.investigation import (
    InvestigationRequest,
    InvestigationBatchResult,
    WorkflowRequest,
    WorkflowResult,
    GLMappingRequest,
    GLBatchResult,
    RAGIngestRequest,
    RAGSearchRequest,
    RAGSearchResult,
)

logger = logging.getLogger(__name__)


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    )
    logger.info("AI Service starting — LLM provider: %s", settings.LLM_PROVIDER)
    yield
    logger.info("AI Service shutting down")


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Agent for Finance",
    description="Autonomous Financial Reconciliation System — AI/ML Service",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    llm_configured: bool = False
    rag_available: bool = False


@app.get("/ai/health", response_model=HealthResponse)
def health_check():
    s = get_settings()
    rag_ok = False
    try:
        from app.rag.vector_store import VectorStore
        VectorStore()
        rag_ok = True
    except Exception:
        pass

    return HealthResponse(
        status="healthy",
        llm_configured=bool(s.LLM_API_KEY),
        rag_available=rag_ok,
    )


# ─── Document Extraction ────────────────────────────────────────────────────

@app.post("/ai/documents/extract", response_model=ExtractionResult)
def extract_document(request: ExtractionRequest):
    try:
        from app.agents.document_agent import DocumentAgent
        agent = DocumentAgent()
        return agent.process(request)
    except Exception as e:
        logger.error("Document extraction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/documents/classify", response_model=DocumentClassification)
def classify_document(request: ExtractionRequest):
    try:
        from app.agents.document_agent import DocumentAgent
        agent = DocumentAgent()
        # Extract text first, then classify
        text = request.file_content or ""
        if request.file_path:
            from app.extraction.pdf_extractor import extract_text_from_pdf
            text = extract_text_from_pdf(request.file_path)
        classification = agent._classify_document(text)
        return classification
    except Exception as e:
        logger.error("Document classification failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Transaction Normalization ───────────────────────────────────────────────

@app.post("/ai/transactions/normalize", response_model=NormalizationResult)
def normalize_transactions(request: NormalizationRequest):
    try:
        from app.normalization.transaction_normalizer import TransactionNormalizer
        normalizer = TransactionNormalizer()
        return normalizer.normalize_batch(request.transactions, source="api")
    except Exception as e:
        logger.error("Normalization failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── GL Mapping ──────────────────────────────────────────────────────────────

@app.post("/ai/gl/map", response_model=GLBatchResult)
def map_gl_codes(request: GLMappingRequest):
    try:
        from app.agents.gl_agent import GLMappingAgent
        from app.normalization.transaction_normalizer import TransactionNormalizer
        from app.schemas.transactions import NormalizedTransaction

        normalizer = TransactionNormalizer()
        normalized = []
        for txn in request.transactions:
            if isinstance(txn, dict):
                try:
                    normalized.append(NormalizedTransaction(**txn))
                except Exception:
                    norm = normalizer.normalize(txn)
                    normalized.append(norm)
            else:
                normalized.append(txn)

        agent = GLMappingAgent()
        return agent.map_batch(normalized, company_id=request.company_id)
    except Exception as e:
        logger.error("GL mapping failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Reconciliation ─────────────────────────────────────────────────────────

@app.post("/ai/reconciliation/match", response_model=ReconciliationResult)
def match_transactions(request: MatchRequest):
    try:
        from app.matching.matcher import TransactionMatcher
        from app.schemas.transactions import NormalizedTransaction

        matcher = TransactionMatcher()
        a = NormalizedTransaction(**request.transaction_a)
        b = NormalizedTransaction(**request.transaction_b)
        return matcher.calculate_match_score(a, b)
    except Exception as e:
        logger.error("Transaction match failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/reconciliation/run", response_model=ReconciliationBatchResult)
def run_reconciliation(request: ReconciliationRequest):
    try:
        from app.agents.reconciliation_agent import ReconciliationAgent
        from app.normalization.transaction_normalizer import TransactionNormalizer
        from app.schemas.transactions import NormalizedTransaction

        normalizer = TransactionNormalizer()

        def to_normalized(txns: list[dict]) -> list[NormalizedTransaction]:
            result = []
            for t in txns:
                try:
                    result.append(NormalizedTransaction(**t))
                except Exception:
                    result.append(normalizer.normalize(t))
            return result

        source = to_normalized(request.source_transactions)
        target = to_normalized(request.target_transactions)

        agent = ReconciliationAgent()
        return agent.reconcile(source, target)
    except Exception as e:
        logger.error("Reconciliation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Anomaly Detection ──────────────────────────────────────────────────────

@app.post("/ai/anomalies/detect", response_model=AnomalyDetectionResult)
def detect_anomalies(request: AnomalyDetectionRequest):
    try:
        from app.agents.anomaly_agent import AnomalyAgent
        agent = AnomalyAgent()
        return agent.analyze(request.transactions, request.reconciliation_results)
    except Exception as e:
        logger.error("Anomaly detection failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Investigation ───────────────────────────────────────────────────────────

@app.post("/ai/investigation/run", response_model=InvestigationBatchResult)
def run_investigation(request: InvestigationRequest):
    try:
        from app.agents.investigation_agent import InvestigationAgent
        from app.schemas.anomalies import Anomaly
        from app.schemas.transactions import NormalizedTransaction

        anomalies = [Anomaly(**a) for a in request.anomalies]
        transactions = [NormalizedTransaction(**t) for t in request.transactions]

        agent = InvestigationAgent()
        results = agent.investigate_batch(anomalies, transactions, request.company_id)
        return InvestigationBatchResult(
            total_investigated=len(results),
            results=results,
            requires_human_review=sum(1 for r in results if r.requires_human_review),
        )
    except Exception as e:
        logger.error("Investigation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── RAG ─────────────────────────────────────────────────────────────────────

@app.post("/ai/rag/ingest")
def rag_ingest(request: RAGIngestRequest):
    try:
        from app.rag.ingestion import ingest_knowledge
        chunks = ingest_knowledge(
            company_id=request.company_id,
            document_id=request.document_id,
            content=request.content,
            document_type=request.document_type,
            metadata=request.metadata,
        )
        return {"status": "success", "chunks_ingested": chunks}
    except Exception as e:
        logger.error("RAG ingestion failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/rag/search", response_model=RAGSearchResult)
def rag_search(request: RAGSearchRequest):
    try:
        from app.rag.retriever import KnowledgeRetriever
        retriever = KnowledgeRetriever()
        return retriever.retrieve(
            company_id=request.company_id,
            query=request.query,
            top_k=request.top_k,
        )
    except Exception as e:
        logger.error("RAG search failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Workflow (End-to-End) ───────────────────────────────────────────────────

@app.post("/ai/workflow/process", response_model=WorkflowResult)
def process_workflow(request: WorkflowRequest):
    try:
        from app.agents.orchestrator import OrchestratorAgent
        orchestrator = OrchestratorAgent()
        return orchestrator.process(request)
    except Exception as e:
        logger.error("Workflow processing failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
