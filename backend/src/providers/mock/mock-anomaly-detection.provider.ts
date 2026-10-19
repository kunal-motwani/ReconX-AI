import { IAnomalyDetectionProvider, TransactionRecord, DetectedAnomaly } from '../interfaces/anomaly-detection.interface';

export class MockAnomalyDetectionProvider implements IAnomalyDetectionProvider {
  async detectAnomalies(
    companyId: string,
    transactions: TransactionRecord[],
    reconciliations: any[],
    options: { unusualAmountThreshold?: number } = {}
  ): Promise<DetectedAnomaly[]> {
    const threshold = options.unusualAmountThreshold || 500000;
    const anomalies: DetectedAnomaly[] = [];

    // 1. Detect Duplicate Payments (same vendor, same amount, within 5 days)
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const t1 = transactions[i];
        const t2 = transactions[j];
        if (
          t1.vendorName.toLowerCase() === t2.vendorName.toLowerCase() &&
          Math.abs(t1.amount - t2.amount) < 0.01 &&
          t1.id !== t2.id
        ) {
          const dayDiff = Math.abs(new Date(t1.transactionDate).getTime() - new Date(t2.transactionDate).getTime()) / (1000 * 3600 * 24);
          if (dayDiff <= 7) {
            anomalies.push({
              transactionId: t2.id,
              type: 'DUPLICATE_PAYMENT',
              severity: 'HIGH',
              title: `Potential Duplicate Payment to ${t1.vendorName}`,
              description: `Two identical transactions of ₹${t1.amount.toLocaleString('en-IN')} detected within ${Math.ceil(dayDiff)} days (Refs: ${t1.referenceNumber} and ${t2.referenceNumber}).`,
              evidence: {
                transaction1: t1,
                transaction2: t2,
                varianceDays: dayDiff
              },
              recommendedAction: 'Verify invoice receipts and request cancellation or credit note from vendor before settlement.'
            });
          }
        }
      }
    }

    // 2. Amount Mismatch Anomalies from Reconciliations
    for (const recon of reconciliations) {
      if (recon.status === 'AMOUNT_MISMATCH') {
        anomalies.push({
          transactionId: recon.sourceTransactionId,
          type: 'AMOUNT_MISMATCH',
          severity: 'CRITICAL',
          title: `Amount Discrepancy on Transaction ${recon.sourceTransaction?.referenceNumber || ''}`,
          description: recon.explanation,
          evidence: {
            reconciliationId: recon.id,
            sourceTransaction: recon.sourceTransaction,
            targetTransaction: recon.targetTransaction,
            difference: Math.abs((recon.sourceTransaction?.amount || 0) - (recon.targetTransaction?.amount || 0))
          },
          recommendedAction: 'Inspect original invoice line items and bank debit entry to reconcile withholding tax or bank fee deductions.'
        });
      }
    }

    // 3. Unusual High Amount Outliers
    for (const t of transactions) {
      if (t.amount >= threshold) {
        anomalies.push({
          transactionId: t.id,
          type: 'UNUSUAL_AMOUNT',
          severity: 'HIGH',
          title: `High-Value Transaction Exceeding Policy Limit (${t.vendorName})`,
          description: `Transaction amount ₹${t.amount.toLocaleString('en-IN')} exceeds company automated approval threshold of ₹${threshold.toLocaleString('en-IN')}.`,
          evidence: {
            transaction: t,
            threshold
          },
          recommendedAction: 'Obtain secondary finance director sign-off and attached PO documentation.'
        });
      }
    }

    return anomalies;
  }
}
