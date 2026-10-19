import { IDocumentExtractionProvider, ExtractedDocumentData } from './interfaces/document-extraction.interface';
import { IGLMappingProvider, GLMappingResult } from './interfaces/gl-mapping.interface';
import { IReconciliationProvider, ReconciliationResult, CandidateTransaction } from './interfaces/reconciliation.interface';
import { IAnomalyDetectionProvider, DetectedAnomaly, TransactionRecord } from './interfaces/anomaly-detection.interface';
import { IInvestigationProvider, InvestigationPlan } from './interfaces/investigation.interface';

import { MockDocumentExtractionProvider } from './mock/mock-document-extraction.provider';
import { MockGLMappingProvider } from './mock/mock-gl-mapping.provider';
import { MockReconciliationProvider } from './mock/mock-reconciliation.provider';
import { MockAnomalyDetectionProvider } from './mock/mock-anomaly-detection.provider';
import { MockInvestigationProvider } from './mock/mock-investigation.provider';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class PythonAIProvider
  implements
    IDocumentExtractionProvider,
    IGLMappingProvider,
    IReconciliationProvider,
    IAnomalyDetectionProvider,
    IInvestigationProvider
{
  private mockExtraction = new MockDocumentExtractionProvider();
  private mockGL = new MockGLMappingProvider();
  private mockRecon = new MockReconciliationProvider();
  private mockAnomaly = new MockAnomalyDetectionProvider();
  private mockInvestigation = new MockInvestigationProvider();

  // 1. Document Extraction
  async extractDocumentData(
    filePath: string,
    originalFileName: string,
    documentType: string
  ): Promise<ExtractedDocumentData> {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ai/documents/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: filePath,
          file_name: originalFileName,
          document_type: documentType,
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        return {
          documentType: data.document_type || documentType,
          vendorName: data.vendor_name || data.extracted_fields?.vendor_name || 'Extracted Vendor',
          invoiceNumber: data.invoice_number || data.extracted_fields?.invoice_number || 'INV-EXTRACTED',
          referenceNumber: data.reference_number || data.extracted_fields?.reference_number || 'REF-EXTRACTED',
          date: data.date || new Date().toISOString(),
          subtotal: data.subtotal || data.total_amount || 0,
          taxAmount: data.tax_amount || 0,
          totalAmount: data.total_amount || 0,
          currency: data.currency || 'INR',
          confidence: data.confidence || 0.95,
          lineItems: data.line_items || [],
          metadata: { provider: 'Python-FastAPI-Agent', ...data.metadata },
        };
      }
    } catch (e) {
      console.warn('[PythonAIProvider] Python service unavailable, falling back to mock extraction:', (e as Error).message);
    }
    return this.mockExtraction.extractDocumentData(filePath, originalFileName, documentType);
  }

  // 2. GL Mapping
  async suggestGLCode(
    companyId: string,
    vendorName: string,
    description: string,
    amount: number,
    availableGLCodes: Array<{ id: string; code: string; name: string; category: string }>
  ): Promise<GLMappingResult> {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ai/gl/map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          transactions: [
            {
              vendor_name: vendorName,
              description: description,
              amount: amount,
            },
          ],
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.results && data.results.length > 0) {
          const item = data.results[0];
          return {
            glCode: item.gl_code,
            glCodeName: item.gl_code_name,
            confidence: item.confidence,
            status: item.confidence >= 0.9 ? 'SUGGESTED' : 'REVIEW_REQUIRED',
            reasoning: item.reasoning || 'AI-assisted GL mapping',
          };
        }
      }
    } catch (e) {
      console.warn('[PythonAIProvider] Python GL mapping offline, using mock:', (e as Error).message);
    }
    return this.mockGL.suggestGLCode(companyId, vendorName, description, amount, availableGLCodes);
  }

  // 3. Reconciliation
  compareTransactions(source: CandidateTransaction, target: CandidateTransaction): ReconciliationResult {
    return this.mockRecon.compareTransactions(source, target);
  }

  findMatches(source: CandidateTransaction, candidates: CandidateTransaction[]): ReconciliationResult[] {
    return this.mockRecon.findMatches(source, candidates);
  }

  // 4. Anomaly Detection
  async detectAnomalies(
    companyId: string,
    transactions: TransactionRecord[],
    reconciliations: any[],
    options?: { unusualAmountThreshold?: number }
  ): Promise<DetectedAnomaly[]> {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ai/anomalies/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.map((t) => ({
            id: t.id,
            vendor_name: t.vendorName,
            amount: t.amount,
            currency: t.currency,
            transaction_date: t.transactionDate,
            reference_number: t.referenceNumber,
            source: t.source,
            status: t.status,
          })),
          reconciliation_results: reconciliations,
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.anomalies) {
          return data.anomalies.map((a: any) => ({
            transactionId: a.transaction_id,
            type: a.type || 'UNMATCHED_TRANSACTION',
            severity: a.severity || 'MEDIUM',
            title: a.title || 'Anomaly Detected',
            description: a.description || '',
            evidence: a.evidence || {},
            recommendedAction: a.recommended_action || 'Review transaction',
          }));
        }
      }
    } catch (e) {
      console.warn('[PythonAIProvider] Python Anomaly service offline, using mock:', (e as Error).message);
    }
    return this.mockAnomaly.detectAnomalies(companyId, transactions, reconciliations, options);
  }

  // 5. Investigation
  async generateInvestigation(
    anomaly: any,
    relatedEntities: { transaction?: any; document?: any; counterparty?: any }
  ): Promise<InvestigationPlan> {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ai/investigation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomalies: [
            {
              id: anomaly.id,
              type: anomaly.type,
              severity: anomaly.severity,
              title: anomaly.title,
              description: anomaly.description,
            },
          ],
          transactions: relatedEntities.transaction ? [relatedEntities.transaction] : [],
          company_id: anomaly.companyId || 'company-1',
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.results && data.results.length > 0) {
          const inv = data.results[0];
          return {
            anomalyId: anomaly.id,
            title: `AI Investigation: ${anomaly.title}`,
            findings: inv.findings || inv.issue_summary || 'Root cause investigation completed.',
            recommendation: inv.recommendation || 'Approve or reject anomaly based on findings.',
            evidence: inv.evidence || {},
            timeline: [
              {
                step: 1,
                title: 'Anomaly Flagged',
                timestamp: new Date().toISOString(),
                description: 'Rule-based and model-based anomaly trigger.',
                actor: 'Anomaly Detection Agent',
              },
              {
                step: 2,
                title: 'AI Investigation Completed',
                timestamp: new Date().toISOString(),
                description: inv.findings || 'Root cause analyzed by LLM provider.',
                actor: 'Investigation Agent',
              },
            ],
          };
        }
      }
    } catch (e) {
      console.warn('[PythonAIProvider] Python Investigation offline, using mock:', (e as Error).message);
    }
    return this.mockInvestigation.generateInvestigation(anomaly, relatedEntities);
  }
}
