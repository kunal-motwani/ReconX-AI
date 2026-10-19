"""Centralized prompt templates for all LLM interactions.

Every prompt instructs the LLM to:
- Never invent financial facts, GL codes, invoice numbers, or amounts
- Use only provided evidence
- Return structured JSON
- Explicitly flag uncertainty
- Request human review when unsure
"""
from __future__ import annotations

FINANCIAL_SAFETY_PREAMBLE = """You are a financial AI assistant. Follow these rules STRICTLY:
1. NEVER invent or hallucinate financial data (amounts, GL codes, invoice numbers, dates).
2. ONLY use information explicitly provided in the context.
3. If information is missing or uncertain, say so explicitly.
4. Return structured JSON as specified.
5. When confidence is below 0.7, set requires_human_review to true.
6. Preserve original values — never silently modify source data.
"""

DOCUMENT_CLASSIFICATION_PROMPT = """Classify the following document text into one of these categories:
- invoice
- receipt
- purchase_order
- bank_statement
- expense_report
- accounting_policy
- unknown

Document text (first 2000 chars):
{document_text}

Return JSON:
{{
  "document_type": "<type>",
  "confidence": <0.0-1.0>,
  "reason": "<brief explanation>"
}}
"""

GL_CLASSIFICATION_PROMPT = """Classify this financial transaction to the most appropriate General Ledger (GL) code.

Transaction details:
- Vendor: {vendor}
- Description: {description}
- Amount: {amount} {currency}
- Date: {date}

Available GL codes:
{gl_codes}

{rag_context}

Rules:
- Choose ONLY from the provided GL codes list.
- If no GL code is appropriate, set gl_code to null.
- Explain your reasoning.

Return JSON:
{{
  "gl_code": "<code or null>",
  "gl_name": "<name or null>",
  "confidence": <0.0-1.0>,
  "reason": "<explanation>",
  "requires_human_review": <true/false>
}}
"""

INVESTIGATION_PROMPT = """Investigate the following financial anomaly.

Anomaly:
- Type: {anomaly_type}
- Severity: {severity}
- Reason: {reason}
- Amount: {amount}

Related transactions:
{transactions}

Related documents:
{documents}

{policy_context}

Analyze the evidence and determine:
1. The most likely cause of this anomaly
2. Whether it's a genuine issue or expected behavior
3. What action should be taken

Return JSON:
{{
  "issue": "<concise issue description>",
  "likely_cause": "<root cause analysis>",
  "reasoning": "<step-by-step reasoning>",
  "recommendation": "<one of: approve, reject, request_documentation, investigate_further, mark_as_expected>",
  "confidence": <0.0-1.0>,
  "requires_human_review": <true/false>
}}
"""

INVOICE_EXTRACTION_PROMPT = """Extract structured information from this invoice text.

Invoice text:
{invoice_text}

Extract these fields if present. Use null for any field you cannot find — NEVER guess or invent values:
- vendor (company name)
- invoice_number
- invoice_date (ISO format YYYY-MM-DD)
- due_date (ISO format YYYY-MM-DD)
- subtotal (number)
- tax (number)
- total (number)
- currency (3-letter code)
- po_number

Return JSON:
{{
  "vendor": "<or null>",
  "invoice_number": "<or null>",
  "invoice_date": "<or null>",
  "due_date": "<or null>",
  "subtotal": <or null>,
  "tax": <or null>,
  "total": <or null>,
  "currency": "<or null>",
  "po_number": "<or null>",
  "confidence": <0.0-1.0>
}}
"""
