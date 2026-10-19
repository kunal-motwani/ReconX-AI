import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';

export class GLService {
  async getGLCodes(companyId: string, activeOnly = false) {
    return prisma.gLCode.findMany({
      where: {
        companyId,
        ...(activeOnly ? { active: true } : {})
      },
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
  }

  async getGLCodeById(companyId: string, id: string) {
    const gl = await prisma.gLCode.findFirst({
      where: { id, companyId },
      include: {
        transactions: {
          take: 10,
          orderBy: { transactionDate: 'desc' }
        }
      }
    });
    if (!gl) throw new Error('GL Code not found.');
    return gl;
  }

  async createGLCode(companyId: string, userId: string, data: { code: string; name: string; description?: string; category: string }) {
    const existing = await prisma.gLCode.findFirst({
      where: { companyId, code: data.code }
    });
    if (existing) throw new Error(`GL Code ${data.code} already exists for this organization.`);

    const created = await prisma.gLCode.create({
      data: {
        companyId,
        ...data
      }
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'GL_CODE_CREATED',
      entity: 'GLCode',
      entityId: created.id,
      newValue: created
    });

    return created;
  }

  async updateGLCode(companyId: string, id: string, userId: string, data: any) {
    const existing = await prisma.gLCode.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error('GL Code not found.');

    const updated = await prisma.gLCode.update({
      where: { id },
      data
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'GL_CODE_UPDATED',
      entity: 'GLCode',
      entityId: id,
      previousValue: existing,
      newValue: updated
    });

    return updated;
  }

  async deleteGLCode(companyId: string, id: string, userId: string) {
    const existing = await prisma.gLCode.findFirst({
      where: { id, companyId },
      include: { _count: { select: { transactions: true } } }
    });
    if (!existing) throw new Error('GL Code not found.');
    if (existing._count.transactions > 0) {
      // Soft-deactivate if transactions are bound
      const updated = await prisma.gLCode.update({
        where: { id },
        data: { active: false }
      });
      await createAuditLog({
        companyId,
        userId,
        action: 'GL_CODE_DEACTIVATED',
        entity: 'GLCode',
        entityId: id,
        previousValue: existing,
        newValue: updated
      });
      return { message: 'GL Code has associated transactions; deactivated rather than deleted.' };
    }

    await prisma.gLCode.delete({ where: { id } });
    await createAuditLog({
      companyId,
      userId,
      action: 'GL_CODE_DELETED',
      entity: 'GLCode',
      entityId: id,
      previousValue: existing
    });

    return { message: 'GL Code deleted successfully.' };
  }
}
