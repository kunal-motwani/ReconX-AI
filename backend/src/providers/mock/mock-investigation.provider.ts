import { IInvestigationProvider, InvestigationPlan, TimelineEvent } from '../interfaces/investigation.interface';

export class MockInvestigationProvider implements IInvestigationProvider {
  async generateInvestigation(anomaly: any, relatedEntities: { transaction?: any; document?: any; counterparty?: any }): Promise<InvestigationPlan> {
    const tx = relatedEntities.transaction || {};
    const doc = relatedEntities.document || {};
    const counterparty = relatedEntities.counterparty || {};

    const now = new Date();
    const timeline: TimelineEvent[] = [
      {
        step: 1,
        title: 'Document Upload & Ingestion',
        timestamp: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
        description: `Source document ${doc.originalName || 'invoice.pdf'} ingested and parsed into normalized ledger record.`,
        actor: 'DocumentProcessingService'
      },
      {
        step: 2,
        title: 'GL Mapping Rule Triggered',
        timestamp: new Date(now.getTime() - 47 * 3600 * 1000).toISOString(),
        description: `Vendor "${tx.vendorName || 'Vendor'}" evaluated against company chart of accounts.`,
        actor: 'GLMappingService'
      },
      {
        step: 3,
        title: 'Reconciliation Engine Run',
        timestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        description: 'Multi-factor reconciliation cross-referenced invoice against bank statement transactions.',
        actor: 'ReconciliationService'
      },
      {
        step: 4,
        title: 'Anomaly Flagged',
        timestamp: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
        description: `${anomaly.title}: ${anomaly.description}`,
        actor: 'AnomalyDetectionService'
      },
      {
        step: 5,
        title: 'Investigation Case Formulated',
        timestamp: now.toISOString(),
        description: 'Automated evidence bundle synthesized; routed to Human Review queue for authorized sign-off.',
        actor: 'InvestigationService'
      }
    ];

    let findings = `Audit review completed for ${anomaly.title}. `;
    let recommendation = anomaly.recommendedAction || 'Review invoice and bank proof before marking resolved.';

    if (anomaly.type === 'AMOUNT_MISMATCH') {
      findings += `Invoice records amount of ₹${tx.amount?.toLocaleString('en-IN') || '0'}, whereas matched banking counterparty shows ₹${counterparty.amount?.toLocaleString('en-IN') || '0'}. Variance represents potential banking fee or TDS withholding.`;
      recommendation = 'Confirm TDS deduction certificates (Form 16A) or credit memo before approving ledger adjustment.';
    } else if (anomaly.type === 'DUPLICATE_PAYMENT') {
      findings += `Two identical payment debits exist for vendor ${tx.vendorName} with matching amounts. Highest probability of duplicate vendor disbursement.`;
      recommendation = 'Request immediate vendor credit voucher or reverse wire transfer with HDFC corporate desk.';
    } else {
      findings += `Discrepancy identified regarding ${anomaly.description}. Evidence artifacts aggregated for human decision.`;
    }

    return {
      anomalyId: anomaly.id,
      title: `Case #${anomaly.id.substring(0, 8).toUpperCase()} - ${anomaly.title}`,
      findings,
      recommendation,
      evidence: {
        anomalySummary: anomaly,
        transactionData: tx,
        counterpartyData: counterparty,
        documentData: doc
      },
      timeline
    };
  }
}
