import { Request, Response, NextFunction } from 'express';
import { ReconciliationService } from '../services/reconciliation.service';
import { sendSuccess } from '../utils/response';

const reconService = new ReconciliationService();

export class ReconciliationController {
  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reconService.runReconciliation(req.user!.companyId, req.user!.id);
      return sendSuccess(res, result, 'Reconciliation execution complete');
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const recons = await reconService.getReconciliations(req.user!.companyId, req.query.status as string);
      return sendSuccess(res, recons);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const recon = await reconService.getReconciliationById(req.user!.companyId, req.params.id);
      return sendSuccess(res, recon);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await reconService.approveReconciliation(
        req.user!.companyId,
        req.params.id,
        req.user!.id,
        req.body.notes
      );
      return sendSuccess(res, updated, 'Reconciliation match approved');
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await reconService.rejectReconciliation(
        req.user!.companyId,
        req.params.id,
        req.user!.id,
        req.body.reason
      );
      return sendSuccess(res, updated, 'Reconciliation match rejected');
    } catch (error) {
      next(error);
    }
  }
}
