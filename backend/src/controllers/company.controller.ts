import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service';
import { updateCompanySchema } from '../validators/company.validator';
import { sendSuccess, sendError } from '../utils/response';

const companyService = new CompanyService();

export class CompanyController {
  async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getCompany(req.user!.companyId);
      return sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateCompanySchema.parse(req.body);
      const updated = await companyService.updateCompany(req.user!.companyId, req.user!.id, validated);
      return sendSuccess(res, updated, 'Company settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
