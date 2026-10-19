import { Request, Response, NextFunction } from 'express';
import { prisma } from '../repositories/prisma';
import { hashPassword } from '../utils/hash';
import { createAuditLog } from '../utils/audit';
import { sendSuccess, sendError } from '../utils/response';

export class UserController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        where: { companyId: req.user!.companyId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return sendError(res, 'User with this email already exists', 400);

      const passwordHash = await hashPassword(password || 'Demo1234!');
      const user = await prisma.user.create({
        data: {
          companyId: req.user!.companyId,
          email,
          passwordHash,
          firstName,
          lastName,
          role: role || 'FINANCE_ANALYST'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true
        }
      });

      await createAuditLog({
        companyId: req.user!.companyId,
        userId: req.user!.id,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        newValue: user
      });

      return sendSuccess(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, active, firstName, lastName } = req.body;
      const targetUser = await prisma.user.findFirst({
        where: { id: req.params.id, companyId: req.user!.companyId }
      });
      if (!targetUser) return sendError(res, 'User not found', 404);

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(role ? { role } : {}),
          ...(active !== undefined ? { active } : {}),
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {})
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true
        }
      });

      await createAuditLog({
        companyId: req.user!.companyId,
        userId: req.user!.id,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: req.params.id,
        previousValue: targetUser,
        newValue: updated
      });

      return sendSuccess(res, updated, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
