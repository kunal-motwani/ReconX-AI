import { IReconciliationProvider, CandidateTransaction, ReconciliationResult, MatchScoreBreakdown } from '../interfaces/reconciliation.interface';

export class MockReconciliationProvider implements IReconciliationProvider {
  private calculateVendorSimilarity(v1: string, v2: string): number {
    const s1 = v1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = v2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.85;

    // Common tokens
    const tokens1 = v1.toLowerCase().split(/\s+/);
    const tokens2 = v2.toLowerCase().split(/\s+/);
    const common = tokens1.filter(t => tokens2.includes(t) && t.length > 2);
    if (common.length > 0) return 0.75;

    return 0.1;
  }

  compareTransactions(source: CandidateTransaction, target: CandidateTransaction): ReconciliationResult {
    const amountDiff = Math.abs(source.amount - target.amount);
    const amountMatch = amountDiff < 0.01;
    const vendorSim = this.calculateVendorSimilarity(source.vendorName, target.vendorName);
    const vendorMatch = vendorSim >= 0.7;

    const dateDiffDays = Math.abs(new Date(source.transactionDate).getTime() - new Date(target.transactionDate).getTime()) / (1000 * 3600 * 24);
    const dateMatch = dateDiffDays <= 3;

    const cleanRef1 = source.referenceNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRef2 = target.referenceNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
    const referenceMatch = cleanRef1 === cleanRef2 || cleanRef1.includes(cleanRef2) || cleanRef2.includes(cleanRef1);

    let confidenceScore = 0;
    if (amountMatch) confidenceScore += 0.40;
    if (vendorMatch) confidenceScore += 0.30 * vendorSim;
    if (dateMatch) confidenceScore += 0.15;
    else if (dateDiffDays <= 7) confidenceScore += 0.08;
    if (referenceMatch) confidenceScore += 0.15;

    confidenceScore = Math.min(0.99, Math.round(confidenceScore * 100) / 100);

    let status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'AMOUNT_MISMATCH' | 'UNMATCHED' = 'UNMATCHED';
    let explanation = '';

    if (!amountMatch && (vendorMatch || referenceMatch)) {
      status = 'AMOUNT_MISMATCH';
      explanation = `Amount mismatch detected (Invoice: ₹${source.amount.toLocaleString('en-IN')} vs Bank: ₹${target.amount.toLocaleString('en-IN')}). Vendor and dates align.`;
    } else if (confidenceScore >= 0.85) {
      status = 'MATCHED';
      explanation = `High confidence reconciliation match (${Math.round(confidenceScore * 100)}%). Exact amount, vendor identity and dates align within tolerance.`;
    } else if (confidenceScore >= 0.50) {
      status = 'PARTIALLY_MATCHED';
      explanation = `Moderate match confidence (${Math.round(confidenceScore * 100)}%). Verification required for transaction date/reference nuances.`;
    } else {
      status = 'UNMATCHED';
      explanation = `No sufficient correlation found between counterparty transactions (Confidence: ${Math.round(confidenceScore * 100)}%).`;
    }

    const breakdown: MatchScoreBreakdown = {
      amountMatch,
      vendorMatch,
      dateMatch,
      referenceMatch,
      confidenceScore,
      explanation
    };

    return {
      sourceTransactionId: source.id,
      targetTransactionId: target.id,
      status,
      confidenceScore,
      breakdown
    };
  }

  findMatches(source: CandidateTransaction, candidates: CandidateTransaction[]): ReconciliationResult[] {
    return candidates.map(c => this.compareTransactions(source, c));
  }
}
