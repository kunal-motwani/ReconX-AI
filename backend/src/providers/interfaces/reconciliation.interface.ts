export interface CandidateTransaction {
  id: string;
  vendorName: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  referenceNumber: string;
  description?: string | null;
  source: string;
}

export interface MatchScoreBreakdown {
  amountMatch: boolean;
  vendorMatch: boolean;
  dateMatch: boolean;
  referenceMatch: boolean;
  confidenceScore: number;
  explanation: string;
}

export interface ReconciliationResult {
  sourceTransactionId: string;
  targetTransactionId: string;
  status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'AMOUNT_MISMATCH' | 'UNMATCHED';
  confidenceScore: number;
  breakdown: MatchScoreBreakdown;
}

export interface IReconciliationProvider {
  compareTransactions(source: CandidateTransaction, target: CandidateTransaction): ReconciliationResult;
  findMatches(source: CandidateTransaction, candidates: CandidateTransaction[]): ReconciliationResult[];
}
