"""Orchestrator Agent — deterministic workflow controller.

Pipeline:
  Document AI → Normalization → GL Mapping → Reconciliation
    → if high confidence: Reconciled
    → if low confidence / mismatch: Anomaly Detection → Investigation → Human Review

Financial workflow control is deterministic. LLMs assist with reasoning only.
"""
from __future__ import annotations

import logging
import time
from typing import Any

from app.agents.anomaly_agent import AnomalyAgent
from app.agents.document_agent import DocumentAgent
from app.agents.gl_agent import GLMappingAgent
from app.agents.investigation_agent import InvestigationAgent
from app.agents.reconciliation_agent import ReconciliationAgent
from app.config import get_settings
from app.llm.provider import get_llm_provider, NoLLMProvider
from app.normalization.transaction_normalizer import TransactionNormalizer
from app.schemas.anomalies import AnomalySeverity
from app.schemas.common import generate_id
from app.schemas.documents import ExtractionRequest
from app.schemas.investigation import WorkflowRequest, WorkflowResult
from app.schemas.reconciliation import ReconciliationStatus
from app.schemas.transactions import NormalizedTransaction
from app.services.pipeline import PipelineState, run_step

logger = logging.getLogger(__name__)


class OrchestratorAgent:
    """Central workflow controller for the financial reconciliation pipeline."""

    def __init__(self):
        self.settings = get_settings()
        self._processed_ids: set[str] = set()  # prevent duplicate processing

        # Initialize agents
        self.document_agent = DocumentAgent()
        self.normalizer = TransactionNormalizer()
        self.reconciliation_agent = ReconciliationAgent()
        self.anomaly_agent = AnomalyAgent()

        # LLM-dependent agents
        llm = get_llm_provider()
        llm_or_none = None if isinstance(llm, NoLLMProvider) else llm

        # RAG retriever (optional)
        rag = None
        try:
            from app.rag.retriever import KnowledgeRetriever
            rag = KnowledgeRetriever()
        except Exception as e:
            logger.warning("RAG retriever not available: %s", e)

        self.gl_agent = GLMappingAgent(llm_provider=llm_or_none, rag_retriever=rag)
        self.investigation_agent = InvestigationAgent(llm_provider=llm_or_none, rag_retriever=rag)

    def process(self, request: WorkflowRequest) -> WorkflowResult:
        """Execute the complete reconciliation pipeline."""
        workflow_id = generate_id()
        state = PipelineState(workflow_id=workflow_id, company_id=request.company_id)
        state.start()

        start_time = time.time()
        all_results: list[dict[str, Any]] = []
        errors: list[str] = []

        # --- Step 1: Document extraction ---
        extracted_transactions: list[dict] = []
        if request.documents:
            step = state.add_step("document_extraction")
            result = run_step(step, self._extract_documents, request.documents, request.company_id)
            if result:
                extracted_transactions = result
            elif step.error:
                errors.append(f"Document extraction: {step.error}")

        # Combine extracted transactions with directly provided ones
        raw_transactions = extracted_transactions + (request.transactions or [])

        if not raw_transactions:
            state.finish()
            return WorkflowResult(
                workflow_id=workflow_id,
                status="failed",
                errors=["No transactions to process. Provide documents or transactions."],
                execution_time_ms=(time.time() - start_time) * 1000,
            )

        # --- Step 2: Normalization ---
        step_norm = state.add_step("normalization")
        norm_result = run_step(step_norm, self._normalize, raw_transactions)
        if not norm_result:
            state.finish()
            return WorkflowResult(
                workflow_id=workflow_id,
                status="failed",
                errors=[f"Normalization failed: {step_norm.error}"],
                execution_time_ms=(time.time() - start_time) * 1000,
            )

        normalized: list[NormalizedTransaction] = norm_result
        all_results.append({"step": "normalization", "count": len(normalized)})

        # --- Step 3: GL Mapping ---
        step_gl = state.add_step("gl_mapping")
        gl_result = run_step(step_gl, self._map_gl, normalized, request.company_id)
        if gl_result:
            all_results.append({
                "step": "gl_mapping",
                "total": gl_result.total,
                "auto_approved": gl_result.auto_approved,
                "requires_review": gl_result.requires_review,
                "mappings": [r.model_dump() for r in gl_result.results],
            })

        # --- Step 4: Reconciliation ---
        # Split transactions by source
        invoices = [t for t in normalized if t.source in ("invoice", "purchase_order", "expense_report")]
        bank_txns = [t for t in normalized if t.source == "bank_statement"]

        recon_result = None
        if invoices and bank_txns:
            step_recon = state.add_step("reconciliation")
            recon_result = run_step(step_recon, self.reconciliation_agent.reconcile, invoices, bank_txns)
            if recon_result:
                all_results.append({
                    "step": "reconciliation",
                    "total_source": recon_result.total_source,
                    "total_target": recon_result.total_target,
                    "matched": recon_result.matched,
                    "partial_matches": recon_result.partial_matches,
                    "mismatches": recon_result.mismatches,
                    "unmatched": recon_result.unmatched,
                    "results": [r.model_dump() for r in recon_result.results],
                })
        else:
            step_skip = state.add_step("reconciliation")
            step_skip.status = step_skip.status  # keep pending
            all_results.append({
                "step": "reconciliation",
                "skipped": True,
                "reason": f"Need both invoices ({len(invoices)}) and bank transactions ({len(bank_txns)}) for reconciliation",
            })

        # --- Step 5: Anomaly Detection ---
        step_anomaly = state.add_step("anomaly_detection")
        recon_dicts = [r.model_dump() for r in recon_result.results] if recon_result else []
        txn_dicts = [t.model_dump() for t in normalized]
        anomaly_result = run_step(step_anomaly, self.anomaly_agent.analyze, txn_dicts, recon_dicts)

        anomalies_count = 0
        investigation_results = []

        if anomaly_result and anomaly_result.anomalies:
            anomalies_count = anomaly_result.anomalies_found
            all_results.append({
                "step": "anomaly_detection",
                "anomalies_found": anomaly_result.anomalies_found,
                "high_severity": anomaly_result.high_severity_count,
                "anomalies": [a.model_dump() for a in anomaly_result.anomalies],
            })

            # --- Step 6: Investigation (for high/critical anomalies) ---
            significant = [
                a for a in anomaly_result.anomalies
                if a.severity in (AnomalySeverity.HIGH, AnomalySeverity.CRITICAL)
            ]
            if significant:
                step_inv = state.add_step("investigation")
                inv_results = run_step(
                    step_inv,
                    self.investigation_agent.investigate_batch,
                    significant,
                    normalized,
                    request.company_id,
                )
                if inv_results:
                    investigation_results = inv_results
                    all_results.append({
                        "step": "investigation",
                        "investigated": len(inv_results),
                        "results": [r.model_dump() for r in inv_results],
                    })

        # --- Compute summary ---
        state.finish()

        reconciled = recon_result.matched if recon_result else 0
        human_review = (
            (gl_result.requires_review if gl_result else 0)
            + (recon_result.human_review_required if recon_result else 0)
            + (anomaly_result.requires_human_review if anomaly_result else 0)
            + len(investigation_results)
        )

        return WorkflowResult(
            workflow_id=workflow_id,
            status=state.overall_status,
            transactions_processed=len(normalized),
            reconciled=reconciled,
            anomalies=anomalies_count,
            human_review_required=human_review,
            results=all_results,
            errors=errors,
            execution_time_ms=state.total_duration_ms,
        )

    def _extract_documents(self, documents: list[dict], company_id: str) -> list[dict]:
        """Extract structured data from documents."""
        extracted = []
        for doc in documents:
            doc_id = doc.get("document_id", generate_id())

            # Check for duplicate processing
            if doc_id in self._processed_ids:
                logger.info("Skipping duplicate document: %s", doc_id)
                continue
            self._processed_ids.add(doc_id)

            try:
                request = ExtractionRequest(
                    document_id=doc_id,
                    file_path=doc.get("file_path"),
                    file_content=doc.get("file_content", doc.get("content", "")),
                    file_type=doc.get("file_type"),
                    company_id=company_id,
                )
                result = self.document_agent.process(request)

                if result.extracted_data:
                    txn = result.extracted_data.copy()
                    txn["document_id"] = doc_id
                    txn["source"] = result.document_type.value
                    extracted.append(txn)
            except Exception as e:
                logger.error("Failed to extract document %s: %s", doc_id, e)
        return extracted

    def _normalize(self, raw_transactions: list[dict]) -> list[NormalizedTransaction]:
        """Normalize all transactions."""
        result = self.normalizer.normalize_batch(raw_transactions)
        return result.normalized

    def _map_gl(self, transactions: list[NormalizedTransaction], company_id: str):
        """Map transactions to GL codes."""
        return self.gl_agent.map_batch(transactions, company_id)
