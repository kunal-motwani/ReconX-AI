import { Request, Response, NextFunction } from 'express';
import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';
import { sendSuccess, sendError } from '../utils/response';

export class BankStatementController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) return sendError(res, 'Bank statement file required.', 400);

      const bankName = req.body.bankName || 'HDFC Corporate Bank';
      const accountNumber = req.body.accountNumber || 'HDFC-ACC-88192';

      // Create Document
      const doc = await prisma.document.create({
        data: {
          companyId: req.user!.companyId,
          uploadedById: req.user!.id,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          documentType: 'BANK_STATEMENT',
          fileSize: req.file.size,
          processingStatus: 'PROCESSED',
          extractedData: JSON.stringify({
            bankName,
            accountNumber,
            statementPeriod: 'August 2026',
            totalTransactionsExtracted: 3
          })
        }
      });

      // Generate mock bank statement transactions
      const sampleBankTxs = [
        {
          vendorName: 'Amazon Web Services (AWS)',
          amount: 100000, // Note: Intentional small mismatch with invoice ₹100,300 for anomaly testing
          ref: `HDFC-DEBIT-${Math.floor(10000 + Math.random() * 90000)}`,
          desc: 'Direct Debit AWS Cloud Hosting'
        },
        {
          vendorName: 'Microsoft Cloud Corporation',
          amount: 64500,
          ref: `HDFC-DEBIT-${Math.floor(10000 + Math.random() * 90000)}`,
          desc: 'NEFT Payment Microsoft Office 365'
        },
        {
          vendorName: 'Uber Technologies Ltd',
          amount: 3450,
          ref: `HDFC-CARD-${Math.floor(10000 + Math.random() * 90000)}`,
          desc: 'Corporate Travel Card Debit'
        }
      ];

      const createdTxs = [];
      for (const t of sampleBankTxs) {
        const tx = await prisma.transaction.create({
          data: {
            companyId: req.user!.companyId,
            documentId: doc.id,
            transactionType: 'DEBIT',
            vendorName: t.vendorName,
            amount: t.amount,
            currency: 'INR',
            transactionDate: new Date(),
            referenceNumber: t.ref,
            description: t.desc,
            source: 'BANK',
            status: 'UNMATCHED'
          }
        });
        createdTxs.push(tx);
      }

      await createAuditLog({
        companyId: req.user!.companyId,
        userId: req.user!.id,
        action: 'BANK_STATEMENT_INGESTED',
        entity: 'Document',
        entityId: doc.id,
        newValue: { bankName, transactionsCount: createdTxs.length }
      });

      return sendSuccess(res, {
        document: doc,
        transactions: createdTxs
      }, 'Bank statement ingested and transactions extracted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const statements = await prisma.document.findMany({
        where: {
          companyId: req.user!.companyId,
          documentType: 'BANK_STATEMENT'
        },
        include: {
          transactions: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return sendSuccess(res, statements);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const stmt = await prisma.document.findFirst({
        where: {
          id: req.params.id,
          companyId: req.user!.companyId,
          documentType: 'BANK_STATEMENT'
        },
        include: {
          transactions: true
        }
      });
      if (!stmt) return sendError(res, 'Bank statement not found.', 404);
      return sendSuccess(res, stmt);
    } catch (error) {
      next(error);
    }
  }
}
