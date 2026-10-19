import { Request, Response, NextFunction } from 'express';
import { AnomalyService } from '../services/anomaly.service';
import { sendSuccess } from '../utils/response';

const anomalyService = new AnomalyService();

export class AnomalyController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const anomalies = await anomalyService.getAnomalies(req.user!.companyId, {
        status: req.query.status as string,
        severity: req.query.severity as string,
        type: req.query.type as string
      });
      return sendSuccess(res, anomalies);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const anomaly = await anomalyService.getAnomalyById(req.user!.companyId, req.params.id);
      return sendSuccess(res, anomaly);
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await anomalyService.resolveAnomaly(
        req.user!.companyId,
        req.params.id,
        req.user!.id,
        req.body.notes
      );
      return sendSuccess(res, updated, 'Anomaly resolved');
    } catch (error) {
      next(error);
    }
  }

  async dismiss(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await anomalyService.dismissAnomaly(
        req.user!.companyId,
        req.params.id,
        req.user!.id,
        req.body.reason
      );
      return sendSuccess(res, updated, 'Anomaly dismissed');
    } catch (error) {
      next(error);
    }
  }
}
