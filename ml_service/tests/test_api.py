from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/ai/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_normalize_endpoint(sample_invoice_transaction):
    response = client.post("/ai/transactions/normalize", json={
        "transactions": [sample_invoice_transaction],
        "company_id": "test_co"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["normalized"][0]["amount"] == 118000.0

def test_reconciliation_match_endpoint(sample_invoice_transaction, sample_bank_transactions):
    response = client.post("/ai/reconciliation/match", json={
        "transaction_a": sample_invoice_transaction,
        "transaction_b": sample_bank_transactions[0]
    })
    assert response.status_code == 200
    assert response.json()["status"] == "matched"

def test_anomaly_detect_endpoint(sample_invoice_transaction):
    response = client.post("/ai/anomalies/detect", json={
        "transactions": [
            sample_invoice_transaction, 
            sample_invoice_transaction
        ],
        "reconciliation_results": []
    })
    assert response.status_code == 200
    assert response.json()["anomalies_found"] >= 0

def test_gl_map_endpoint(sample_invoice_transaction):
    sample_invoice_transaction["vendor"] = "AWS"
    response = client.post("/ai/gl/map", json={
        "transactions": [sample_invoice_transaction],
        "company_id": "test_co"
    })
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["results"][0]["gl_code"] == "6201"

def test_workflow_endpoint():
    response = client.post("/ai/workflow/process", json={
        "company_id": "test_co",
        "transactions": []
    })
    # Since we passed empty, orchestrator logic should just return empty counts or fail gracefully
    assert response.status_code == 200
    assert "workflow_id" in response.json()
