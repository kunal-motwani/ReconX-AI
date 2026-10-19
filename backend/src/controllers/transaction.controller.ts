import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transaction.validator';
import { sendSuccess } from '../utils/response';

const txService = new TransactionService();

export class TransactionController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await txService.getTransactions(req.user!.companyId, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string,
        status: req.query.status as string,
        source: req.query.source as string,
        vendor: req.query.vendor as string,
        glCodeId: req.query.glCodeId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as any
      });
      return sendSuccess(res, result.transactions, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await txService.getTransactionById(req.user!.companyId, req.params.id);
      return sendSuccess(res, tx);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createTransactionSchema.parse(req.body);
      const tx = await txService.createTransaction(req.user!.companyId, req.user!.id, validated);
      return sendSuccess(res, tx, 'Transaction created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateTransactionSchema.parse(req.body);
      const tx = await txService.updateTransaction(req.user!.companyId, req.params.id, req.user!.id, validated);
      return sendSuccess(res, tx, 'Transaction updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await txService.deleteTransaction(req.user!.companyId, req.params.id, req.user!.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async bulkApprove(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return sendSuccess(res, { count: 0 }, 'No IDs provided');
      }
      const result = await txService.bulkApprove(req.user!.companyId, ids, req.user!.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
