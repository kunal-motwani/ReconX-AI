export interface TransactionRecord {
  id: string;
  companyId: string;
  vendorName: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  referenceNumber: string;
  source: string;
  status: string;
}

export interface DetectedAnomaly {
  transactionId?: string;
  type: 'AMOUNT_MISMATCH' | 'DUPLICATE_PAYMENT' | 'MISSING_INVOICE' | 'MISSING_BANK_TRANSACTION' | 'UNMATCHED_TRANSACTION' | 'UNUSUAL_AMOUNT' | 'GL_MAPPING_REVIEW';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  evidence: Record<string, any>;
  recommendedAction: string;
}

export interface IAnomalyDetectionProvider {
  detectAnomalies(
    companyId: string,
    transactions: TransactionRecord[],
    reconciliations: any[],
    options?: { unusualAmountThreshold?: number }
  ): Promise<DetectedAnomaly[]>;
}
