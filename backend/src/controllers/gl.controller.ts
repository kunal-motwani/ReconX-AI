import { Request, Response, NextFunction } from 'express';
import { GLService } from '../services/gl.service';
import { createGLCodeSchema, updateGLCodeSchema } from '../validators/gl.validator';
import { sendSuccess } from '../utils/response';

const glService = new GLService();

export class GLController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const list = await glService.getGLCodes(req.user!.companyId, activeOnly);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const gl = await glService.getGLCodeById(req.user!.companyId, req.params.id);
      return sendSuccess(res, gl);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createGLCodeSchema.parse(req.body);
      const gl = await glService.createGLCode(req.user!.companyId, req.user!.id, validated);
      return sendSuccess(res, gl, 'GL Code created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateGLCodeSchema.parse(req.body);
      const gl = await glService.updateGLCode(req.user!.companyId, req.params.id, req.user!.id, validated);
      return sendSuccess(res, gl, 'GL Code updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await glService.deleteGLCode(req.user!.companyId, req.params.id, req.user!.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
