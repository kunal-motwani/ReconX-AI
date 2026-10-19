from app.agents.gl_agent import GLMappingAgent
from app.schemas.transactions import NormalizedTransaction

def test_known_vendor_mapping():
    agent = GLMappingAgent()
    txn = NormalizedTransaction(vendor="Amazon Web Services")
    result = agent.map_transaction(txn)
    assert result.gl_code == "6201"
