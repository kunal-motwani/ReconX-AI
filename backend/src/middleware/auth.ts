import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../repositories/prisma';
import { sendError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        companyId: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded: TokenPayload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.active) {
      return sendError(res, 'User account is invalid or deactivated.', 401, 'USER_INACTIVE');
    }

    req.user = {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token.', 401, 'INVALID_TOKEN');
  }
};
