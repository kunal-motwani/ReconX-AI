import { z } from 'zod';

export const createTransactionSchema = z.object({
  documentId: z.string().uuid().optional(),
  transactionType: z.enum(['DEBIT', 'CREDIT']).default('DEBIT'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  transactionDate: z.string().or(z.date()),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  description: z.string().optional(),
  source: z.enum(['INVOICE', 'BANK', 'RECEIPT', 'PURCHASE_ORDER', 'EXPENSE']),
  glCodeId: z.string().uuid().optional(),
  status: z.enum(['UNMATCHED', 'MATCHED', 'PARTIALLY_MATCHED', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED']).optional()
});

export const updateTransactionSchema = z.object({
  vendorName: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  transactionDate: z.string().or(z.date()).optional(),
  referenceNumber: z.string().optional(),
  description: z.string().optional(),
  glCodeId: z.string().uuid().nullable().optional(),
  status: z.enum(['UNMATCHED', 'MATCHED', 'PARTIALLY_MATCHED', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED']).optional()
});
