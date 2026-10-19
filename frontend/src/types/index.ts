export type UserRole = 'ADMIN' | 'FINANCE_MANAGER' | 'FINANCE_ANALYST';

export interface User {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  country: string;
  currency: string;
  fiscalYear: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    documents: number;
    transactions: number;
    glCodes: number;
  };
}

export type DocumentType =
  | 'INVOICE'
  | 'BANK_STATEMENT'
  | 'RECEIPT'
  | 'PURCHASE_ORDER'
  | 'EXPENSE_REPORT'
  | 'ACCOUNTING_POLICY';

export type ProcessingStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'REVIEW_REQUIRED';

export interface Document {
  id: string;
  companyId: string;
  uploadedById: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: string;
  documentType: DocumentType;
  fileSize: number;
  processingStatus: ProcessingStatus;
  extractedData?: any;
  uploadDate: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  transactions?: Transaction[];
}

export interface GLCode {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  active: boolean;
  createdAt: string;
  _count?: {
    transactions: number;
  };
}

export type TransactionSource =
  | 'INVOICE'
  | 'BANK'
  | 'RECEIPT'
  | 'PURCHASE_ORDER'
  | 'EXPENSE';

export type TransactionStatus =
  | 'UNMATCHED'
  | 'MATCHED'
  | 'PARTIALLY_MATCHED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export interface Transaction {
  id: string;
  companyId: string;
  documentId?: string | null;
  transactionType: 'DEBIT' | 'CREDIT';
  vendorName: string;
  amount: number;
  currency: string;
  transactionDate: string;
  referenceNumber: string;
  description?: string | null;
  source: TransactionSource;
  status: TransactionStatus;
  glCodeId?: string | null;
  glConfidence?: number | null;
  glStatus?: string | null;
  createdAt: string;
  glCode?: GLCode;
  document?: Document;
  sourceRecons?: Reconciliation[];
  anomalies?: Anomaly[];
}

export type ReconciliationStatus =
  | 'MATCHED'
  | 'PARTIALLY_MATCHED'
  | 'AMOUNT_MISMATCH'
  | 'UNMATCHED'
  | 'APPROVED'
  | 'REJECTED';

export interface Reconciliation {
  id: string;
  companyId: string;
  sourceTransactionId: string;
  targetTransactionId: string;
  status: ReconciliationStatus;
  confidenceScore: number;
  amountMatch: boolean;
  vendorMatch: boolean;
  dateMatch: boolean;
  referenceMatch: boolean;
  explanation: string;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  sourceTransaction: Transaction;
  targetTransaction: Transaction;
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type AnomalyType =
  | 'AMOUNT_MISMATCH'
  | 'DUPLICATE_PAYMENT'
  | 'MISSING_INVOICE'
  | 'MISSING_BANK_TRANSACTION'
  | 'UNMATCHED_TRANSACTION'
  | 'UNUSUAL_AMOUNT'
  | 'GL_MAPPING_REVIEW';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AnomalyStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface Anomaly {
  id: string;
  companyId: string;
  transactionId?: string | null;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  status: AnomalyStatus;
  evidence?: any;
  recommendedAction?: string | null;
  createdAt: string;
  transaction?: Transaction;
  investigations?: Investigation[];
}

export type InvestigationStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'APPROVED'
  | 'REJECTED';

export interface TimelineEvent {
  step: number;
  title: string;
  timestamp: string;
  description: string;
  actor: string;
}

export interface Investigation {
  id: string;
  companyId: string;
  anomalyId: string;
  assignedToId?: string | null;
  status: InvestigationStatus;
  findings?: string | null;
  evidence?: any;
  recommendation?: string | null;
  timeline?: TimelineEvent[];
  createdAt: string;
  anomaly?: Anomaly;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AuditLog {
  id: string;
  companyId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export interface DashboardStats {
  kpis: {
    totalTransactions: number;
    reconciled: number;
    pendingReview: number;
    anomalies: number;
    duplicatePayments: number;
    amountMismatches: number;
    totalTransactionValue: number;
    reconciliationRate: number;
  };
  charts: {
    reconciliationStatus: Array<{ name: string; count: number; color: string }>;
    volumeOverTime: Array<{ month: string; volume: number; value: number }>;
    glDistribution: Array<{ code: string; name: string; count: number; amount: number }>;
    reconciledVsUnreconciled: { reconciled: number; unreconciled: number };
  };
  recentActivity: AuditLog[];
  attentionRequired: Anomaly[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
