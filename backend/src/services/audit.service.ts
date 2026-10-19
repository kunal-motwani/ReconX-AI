import { prisma } from '../repositories/prisma';

export class AuditService {
  async getAuditLogs(companyId: string, query: { entity?: string; action?: string; userId?: string; limit?: number }) {
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const where: any = { companyId };
    if (query.entity) where.entity = query.entity;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        }
      }
    });
  }
}
