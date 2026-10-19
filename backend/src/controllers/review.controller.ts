import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { sendSuccess } from '../utils/response';

const reviewService = new ReviewService();

export class ReviewController {
  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const queue = await reviewService.getReviewQueue(req.user!.companyId);
      return sendSuccess(res, queue);
    } catch (error) {
      next(error);
    }
  }

  async submitDecision(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.submitDecision(
        req.user!.companyId,
        req.user!.id,
        req.body
      );
      return sendSuccess(res, result, 'Review decision applied successfully');
    } catch (error) {
      next(error);
    }
  }
}
