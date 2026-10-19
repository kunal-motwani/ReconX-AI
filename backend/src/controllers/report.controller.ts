import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';

const reportService = new ReportService();

export class ReportController {
  async getReconciliationReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getReconciliationReport(req.user!.companyId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getAnomalyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getAnomalyReport(req.user!.companyId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getGLMappingReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getGLMappingReport(req.user!.companyId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const type = (req.query.type as any) || 'reconciliation';
      const csv = await reportService.exportReportCSV(req.user!.companyId, type);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="reconx-${type}-report-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
