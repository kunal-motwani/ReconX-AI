from app.agents.orchestrator import OrchestratorAgent
from app.schemas.investigation import WorkflowRequest
import pytest

def test_workflow_with_transactions(sample_invoice_transaction, sample_bank_transactions):
    agent = OrchestratorAgent()
    req = WorkflowRequest(
        company_id="test_co",
        transactions=[sample_invoice_transaction] + sample_bank_transactions
    )
    result = agent.process(req)
    
    assert result.status == "success"
    assert result.transactions_processed == 2

def test_workflow_empty_input():
    agent = OrchestratorAgent()
    req = WorkflowRequest(company_id="test_co")
    
    result = agent.process(req)
    
    # Depending on implementation it might be success with 0 counts or failed.
    assert result.transactions_processed == 0

def test_workflow_result_structure(sample_invoice_transaction):
    agent = OrchestratorAgent()
    req = WorkflowRequest(
        company_id="test_co",
        transactions=[sample_invoice_transaction]
    )
    result = agent.process(req)
    
    assert hasattr(result, "workflow_id")
    assert hasattr(result, "status")
    assert hasattr(result, "transactions_processed")
    assert hasattr(result, "reconciled")
    assert hasattr(result, "anomalies")
