import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode);
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return sendError(res, `Validation error: ${errors}`, 400, 'VALIDATION_ERROR');
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File size exceeds allowed limit (10MB).', 400, 'FILE_TOO_LARGE');
    }
    return sendError(res, err.message, 400, 'UPLOAD_ERROR');
  }

  if (err.code === 'P2002') {
    return sendError(res, 'A unique constraint violation occurred.', 409, 'DUPLICATE_RESOURCE');
  }

  // Check if message indicates client authentication or logic error
  if (err.message && (err.message.includes('Invalid email or password') || err.message.includes('not found') || err.message.includes('already exists'))) {
    const code = err.message.includes('Invalid email') ? 401 : err.message.includes('not found') ? 404 : 400;
    return sendError(res, err.message, code);
  }

  console.error('[Unhandled Internal Error]:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';
  return sendError(res, message, statusCode, 'INTERNAL_SERVER_ERROR');
};
