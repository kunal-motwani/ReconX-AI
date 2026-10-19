import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`, 403, 'FORBIDDEN');
    }

    next();
  };
};
