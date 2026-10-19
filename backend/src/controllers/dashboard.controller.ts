import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getDashboardStats(req.user!.companyId);
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}
