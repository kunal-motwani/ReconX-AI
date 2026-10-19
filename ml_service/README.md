# AI Agent for Finance — AI/ML Service

## Architecture

```text
+----------------+      +----------------+      +------------------+
|                |      |                |      |                  |
|  Web Frontend  | +--> | Node.js Backend| +--> |    AI Service    |
|   (React/Next) |      |   (Express)    |      |  (FastAPI/Py)    |
|                |      |                |      |                  |
+----------------+      +----------------+      +---------+--------+
                                                          |
                                                          v
                                                +------------------+
                                                |                  |
                                                |   Orchestrator   |
                                                |      Agent       |
                                                |                  |
                                                +---------+--------+
                                                          |
        +------------------+------------------+-----------+-----------+------------------+
        |                  |                  |                       |                  |
        v                  v                  v                       v                  v
+--------------+   +--------------+   +---------------+       +---------------+  +---------------+
|   Document   |   |   GL Mapping |   | Reconciliation|       |    Anomaly    |  | Investigation |
|    Agent     |   |    Agent     |   |     Agent     |       |     Agent     |  |     Agent     |
+--------------+   +--------------+   +---------------+       +---------------+  +---------------+
```

### Agents Overview
- **Orchestrator Agent**: Manages the end-to-end workflow, delegating tasks to specialized sub-agents and aggregating results.
- **Document Agent**: Extracts and classifies text from unstructured documents (PDFs, images) using OCR and LLMs.
- **GL Mapping Agent**: Maps normalized transactions to the correct General Ledger codes with confidence scores.
- **Reconciliation Agent**: Reconciles source transactions against target transactions (e.g., bank vs. internal ledger).
- **Anomaly Agent**: Analyzes transactions and reconciliation results to detect statistical and logical anomalies.
- **Investigation Agent**: Investigates detected anomalies and provides human-readable explanations and resolution steps.

## Quick Start

### Prerequisites
- Python 3.11+
- Tesseract OCR (for document processing)

### Installation
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate # Linux/Mac
pip install -r requirements.txt
```

### Environment Setup
```bash
copy .env.example .env
# Edit .env with your LLM API key (optional - deterministic features work without it)
```

### Running Locally
```bash
python run.py
# Service starts at http://localhost:8000
```

### Running with Docker
```bash
docker build -t ai-finance-service .
docker run -p 8000:8000 --env-file .env ai-finance-service
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | LLM service provider (e.g., gemini, openai) | `gemini` |
| `LLM_API_KEY` | API key for the chosen LLM provider | `""` |
| `LLM_MODEL` | Specific LLM model to use | `gemini-2.0-flash` |
| `VECTOR_DB_PATH` | Path to store vector database files | `./data/vectorstore` |
| `GL_AUTO_APPROVAL_THRESHOLD` | Confidence threshold for auto-approving GL mapping | `0.90` |
| `RECONCILIATION_AUTO_MATCH_THRESHOLD` | Confidence threshold for auto-matching | `0.95` |
| `ANOMALY_REVIEW_THRESHOLD` | Confidence threshold triggering human review for anomalies | `0.70` |
| `MATCHING_WEIGHTS` | JSON string defining weights for reconciliation fields | `{"amount": 0.35, "vendor": 0.20, "date": 0.15, "reference": 0.20, "description": 0.10}` |
| `DATE_TOLERANCE_DAYS` | Tolerance in days for date matching | `3` |
| `AMOUNT_TOLERANCE_PERCENT` | Tolerance percentage for amount matching | `1.0` |
| `OCR_ENABLED` | Enable or disable OCR capabilities | `true` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGINS` | JSON list of allowed CORS origins | `["http://localhost:3000","http://localhost:3001"]` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/ai/health` | Health check endpoint |
| POST | `/ai/documents/extract` | Extract text/data from documents |
| POST | `/ai/documents/classify` | Classify the type of a document |
| POST | `/ai/transactions/normalize` | Normalize raw transaction data |
| POST | `/ai/gl/map` | Map transactions to GL codes |
| POST | `/ai/reconciliation/match` | Compare two transactions and return a match score |
| POST | `/ai/reconciliation/run` | Run batch reconciliation between source and target |
| POST | `/ai/anomalies/detect` | Detect anomalies in a list of transactions |
| POST | `/ai/investigation/run` | Investigate anomalies with full context |
| POST | `/ai/rag/ingest` | Ingest documents into the RAG vector store |
| POST | `/ai/rag/search` | Search the RAG vector store |
| POST | `/ai/workflow/process` | Run the complete end-to-end orchestrator pipeline |

### Example Requests & Responses

#### 1. Health check
**Request:**
```bash
curl -X GET http://localhost:8000/ai/health
```
**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "llm_configured": true,
  "rag_available": true
}
```

#### 2. Normalize transactions
**Request:**
```bash
curl -X POST http://localhost:8000/ai/transactions/normalize \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "date": "2023-10-15",
        "amt": "$1,234.56",
        "desc": "AWS CLOUD SERVICES",
        "id": "txn_123"
      }
    ]
  }'
```
**Response:**
```json
{
  "total_processed": 1,
  "normalized": [
    {
      "id": "txn_123",
      "date": "2023-10-15T00:00:00",
      "amount": 1234.56,
      "description": "AWS CLOUD SERVICES",
      "normalized_vendor": "AWS",
      "source_data": {"date": "2023-10-15", "amt": "$1,234.56", "desc": "AWS CLOUD SERVICES", "id": "txn_123"}
    }
  ]
}
```

#### 3. Match two transactions
**Request:**
```bash
curl -X POST http://localhost:8000/ai/reconciliation/match \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_a": {"id": "A1", "date": "2023-10-15T00:00:00", "amount": 100.0, "description": "STARBUCKS"},
    "transaction_b": {"id": "B1", "date": "2023-10-15T00:00:00", "amount": 100.0, "description": "STARBUCKS STORE"}
  }'
```
**Response:**
```json
{
  "match_score": 0.98,
  "is_match": true,
  "confidence": 0.98,
  "reason": "Exact amount and date match, highly similar descriptions",
  "match_type": "EXACT",
  "source_transaction_id": "A1",
  "target_transaction_id": "B1",
  "evidence": ["Amount difference is 0", "Date difference is 0 days"]
}
```

#### 4. Run full reconciliation
**Request:**
```bash
curl -X POST http://localhost:8000/ai/reconciliation/run \
  -H "Content-Type: application/json" \
  -d '{
    "source_transactions": [{"id": "S1", "date": "2023-10-15", "amount": 500, "description": "PAYMENT"}],
    "target_transactions": [{"id": "T1", "date": "2023-10-15", "amount": 500, "description": "PAYMENT REC"}]
  }'
```
**Response:**
```json
{
  "matches": [...],
  "unmatched_source": [],
  "unmatched_target": [],
  "match_rate": 1.0,
  "total_source": 1,
  "total_target": 1
}
```

#### 5. Detect anomalies
**Request:**
```bash
curl -X POST http://localhost:8000/ai/anomalies/detect \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [{"id": "TXN_1", "amount": 99999.99, "date": "2023-10-15"}]
  }'
```
**Response:**
```json
{
  "anomalies": [
    {
      "transaction_id": "TXN_1",
      "anomaly_type": "HIGH_AMOUNT",
      "severity": "HIGH",
      "confidence": 0.95,
      "description": "Transaction amount is significantly higher than historical average",
      "requires_human_review": true
    }
  ],
  "total_analyzed": 1,
  "total_anomalies": 1
}
```

#### 6. Map GL codes
**Request:**
```bash
curl -X POST http://localhost:8000/ai/gl/map \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "COMP_1",
    "transactions": [{"id": "TXN_1", "description": "AWS HOSTING", "amount": 100.0, "date": "2023-10-15"}]
  }'
```
**Response:**
```json
{
  "total_mapped": 1,
  "results": [
    {
      "transaction_id": "TXN_1",
      "gl_code": "6000",
      "gl_name": "Software Subscriptions",
      "confidence": 0.92,
      "reason": "Matches typical AWS hosting classification",
      "requires_human_review": false
    }
  ],
  "requires_human_review": 0
}
```

#### 7. Run full workflow
**Request:**
```bash
curl -X POST http://localhost:8000/ai/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "COMP_1",
    "source_transactions": [...],
    "target_transactions": [...],
    "documents": [...]
  }'
```
**Response:**
```json
{
  "status": "success",
  "workflow_id": "wf_12345",
  "summary": "Processed 100 transactions with 95% match rate",
  "reconciliation": {...},
  "gl_mapping": {...},
  "anomalies": {...},
  "investigations": {...},
  "requires_human_review": true
}
```

## Agent Workflow

```text
+---------------------+
|  Input Data (API)   |
| (Txns, Docs, etc.)  |
+---------+-----------+
          |
          v
+---------+-----------+
|    Orchestrator     | ---+
|    Agent Begins     |    |
+---------+-----------+    |
          |                v
          |         +----------------+
          |         | Document Agent | (Extract/Classify)
          |         +-------+--------+
          v                 |
+---------+-----------+ <---+
| Normalization Layer | (Cleanse/Format Data)
+---------+-----------+
          |
          v
+---------+-----------+
| Reconciliation Agent| (Deterministic + Fuzzy Matching)
+---------+-----------+
          |
          v
+---------+-----------+
|  GL Mapping Agent   | (Map via LLM/RAG)
+---------+-----------+
          |
          v
+---------+-----------+
|   Anomaly Agent     | (Detect Statistical/Logical Outliers)
+---------+-----------+
          |
          v
+---------+-----------+
| Investigation Agent | (Deep dive on Anomalies)
+---------+-----------+
          |
          v
+---------+-----------+
|   Orchestrator      |
| Aggregates Results  |
+---------+-----------+
          |
          v
+---------------------+
|   JSON Response     |
+---------------------+
```

## Testing
To run the test suite:
```bash
pytest tests/ -v
```

## Integration with Node.js Backend
Example calling the AI service from Node.js/Express:

```javascript
const axios = require('axios');

async function processFinanceWorkflow(companyId, sourceTxns, targetTxns, docs) {
  try {
    const response = await axios.post('http://localhost:8000/ai/workflow/process', {
      company_id: companyId,
      source_transactions: sourceTxns,
      target_transactions: targetTxns,
      documents: docs
    });
    console.log('Workflow processed successfully:', response.data.summary);
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.response?.data || error.message);
    throw error;
  }
}
```

## Project Structure

```text
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI app & routes
│   ├── config.py              # Environment configuration
│   ├── agents/                # AI Agent definitions
│   ├── anomaly/               # Anomaly detection logic
│   ├── extraction/            # OCR and Document extraction
│   ├── llm/                   # LLM client wrappers
│   ├── matching/              # Reconciliation matching algorithms
│   ├── normalization/         # Data cleansing & normalizers
│   ├── rag/                   # Vector store and RAG ingestion/search
│   ├── schemas/               # Pydantic models (Interfaces)
│   └── services/              # Shared business logic
├── tests/                     # Pytest suite
├── data/                      # Local data (e.g., chromadb)
├── .env.example               # Template environment variables
├── requirements.txt           # Python dependencies
├── run.py                     # App entry point
├── Dockerfile                 # Container definition
└── README.md                  # This file
```

## Financial Safety Rules

1. **Never Hallucinate Financial Values**: Always extract amounts, dates, and account numbers exactly as they appear. Use `null` when unknown.
2. **Deterministic First**: Prefer deterministic rules and fuzzy logic over LLM predictions for core matching. Use LLMs for reasoning and unstructured data.
3. **Mandatory Confidence Scores**: Every AI decision (match, mapping, anomaly) must include a confidence score (0.0 to 1.0).
4. **Mandatory Evidence**: Every decision must include a reason and evidence supporting it.
5. **Human-in-the-Loop Integration**: Decisions falling below configurable thresholds must be flagged with `requires_human_review=true`.
6. **Configurable Thresholds**: Never hardcode thresholds; always rely on configuration variables (`config.py`).
7. **Immutable Source Data**: Always store the original value alongside the normalized value to preserve auditability.
8. **Resilient Processing**: Never crash the entire pipeline for one malformed document or transaction. Handle errors gracefully per item.
9. **Strict Schemas**: All inputs and outputs must be validated using Pydantic models to ensure structural integrity.
10. **Data Isolation**: Strictly segregate data and RAG knowledge bases using `company_id` to prevent cross-contamination.

## Design Principles

- **Deterministic-first approach**: Rely on code and rules first. Fallback to AI when rules are insufficient or for complex reasoning.
- **Explainability**: Every decision has confidence and evidence, leaving a clear audit trail.
- **Company data isolation**: Architected to support multi-tenancy securely.
- **Configurable thresholds**: Environments control the strictness of automation versus human review.
