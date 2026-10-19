import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess } from '../utils/response';

const auditService = new AuditService();

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await auditService.getAuditLogs(req.user!.companyId, {
        entity: req.query.entity as string,
        action: req.query.action as string,
        userId: req.query.userId as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      });
      return sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
}
