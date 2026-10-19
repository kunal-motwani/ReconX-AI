import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';

export class TransactionService {
  async getTransactions(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      source?: string;
      vendor?: string;
      glCodeId?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = { companyId };

    if (query.status && query.status !== 'undefined') where.status = query.status;
    if (query.source && query.source !== 'undefined') where.source = query.source;
    if (query.glCodeId && query.glCodeId !== 'undefined') where.glCodeId = query.glCodeId;
    if (query.vendor && query.vendor !== 'undefined') {
      where.vendorName = { contains: query.vendor };
    }
    if (query.search && query.search !== 'undefined') {
      where.OR = [
        { vendorName: { contains: query.search } },
        { referenceNumber: { contains: query.search } },
        { description: { contains: query.search } }
      ];
    }
    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) where.transactionDate.gte = new Date(query.startDate);
      if (query.endDate) where.transactionDate.lte = new Date(query.endDate);
    }
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.amount = {};
      if (query.minAmount !== undefined) where.amount.gte = Number(query.minAmount);
      if (query.maxAmount !== undefined) where.amount.lte = Number(query.maxAmount);
    }

    const sortBy = query.sortBy || 'transactionDate';
    const sortOrder = query.sortOrder || 'desc';

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          glCode: true,
          document: {
            select: { id: true, originalName: true, documentType: true }
          },
          sourceRecons: {
            include: { targetTransaction: true }
          },
          anomalies: {
            select: { id: true, type: true, severity: true, status: true, title: true }
          }
        }
      })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTransactionById(companyId: string, id: string) {
    const tx = await prisma.transaction.findFirst({
      where: { id, companyId },
      include: {
        glCode: true,
        document: true,
        sourceRecons: {
          include: { targetTransaction: true }
        },
        targetRecons: {
          include: { sourceTransaction: true }
        },
        anomalies: {
          include: { investigations: true }
        }
      }
    });

    if (!tx) throw new Error('Transaction not found.');
    return tx;
  }

  async createTransaction(companyId: string, userId: string, data: any) {
    const tx = await prisma.transaction.create({
      data: {
        companyId,
        documentId: data.documentId || null,
        transactionType: data.transactionType || 'DEBIT',
        vendorName: data.vendorName,
        amount: Number(data.amount),
        currency: data.currency || 'INR',
        transactionDate: new Date(data.transactionDate),
        referenceNumber: data.referenceNumber,
        description: data.description,
        source: data.source || 'INVOICE',
        status: data.status || 'UNMATCHED',
        glCodeId: data.glCodeId || null,
        glStatus: data.glCodeId ? 'MANUAL' : 'UNMAPPED'
      }
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'TRANSACTION_CREATED',
      entity: 'Transaction',
      entityId: tx.id,
      newValue: tx
    });

    return tx;
  }

  async updateTransaction(companyId: string, id: string, userId: string, data: any) {
    const existing = await prisma.transaction.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error('Transaction not found.');

    const updateData: any = { ...data };
    if (data.transactionDate) updateData.transactionDate = new Date(data.transactionDate);
    if (data.amount) updateData.amount = Number(data.amount);

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'TRANSACTION_UPDATED',
      entity: 'Transaction',
      entityId: id,
      previousValue: existing,
      newValue: updated
    });

    return updated;
  }

  async deleteTransaction(companyId: string, id: string, userId: string) {
    const existing = await prisma.transaction.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error('Transaction not found.');

    await prisma.transaction.delete({ where: { id } });

    await createAuditLog({
      companyId,
      userId,
      action: 'TRANSACTION_DELETED',
      entity: 'Transaction',
      entityId: id,
      previousValue: existing
    });

    return { message: 'Transaction deleted successfully.' };
  }

  async bulkApprove(companyId: string, ids: string[], userId: string) {
    const result = await prisma.transaction.updateMany({
      where: { id: { in: ids }, companyId },
      data: { status: 'APPROVED' }
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'TRANSACTIONS_BULK_APPROVED',
      entity: 'Transaction',
      entityId: 'BULK',
      newValue: { count: result.count, ids }
    });

    return { message: `${result.count} transactions approved successfully.` };
  }
}
