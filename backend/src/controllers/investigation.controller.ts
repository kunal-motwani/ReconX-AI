import { Request, Response, NextFunction } from 'express';
import { InvestigationService } from '../services/investigation.service';
import { sendSuccess } from '../utils/response';

const investigationService = new InvestigationService();

export class InvestigationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const investigations = await investigationService.getInvestigations(req.user!.companyId, req.query.status as string);
      return sendSuccess(res, investigations);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const inv = await investigationService.getInvestigationById(req.user!.companyId, req.params.id);
      return sendSuccess(res, inv);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const inv = await investigationService.createInvestigationForAnomaly(
        req.user!.companyId,
        req.body.anomalyId,
        req.user!.id
      );
      return sendSuccess(res, inv, 'Investigation initiated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await investigationService.updateInvestigation(
        req.user!.companyId,
        req.params.id,
        req.user!.id,
        req.body
      );
      return sendSuccess(res, updated, 'Investigation updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
