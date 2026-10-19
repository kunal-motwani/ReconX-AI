import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';

export class AnomalyService {
  async getAnomalies(companyId: string, filters: { status?: string; severity?: string; type?: string }) {
    const where: any = { companyId };
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.type) where.type = filters.type;

    return prisma.anomaly.findMany({
      where,
      orderBy: [
        { severity: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        transaction: {
          include: {
            glCode: true,
            document: true,
            sourceRecons: {
              include: { targetTransaction: true }
            }
          }
        },
        investigations: true
      }
    });
  }

  async getAnomalyById(companyId: string, id: string) {
    const anomaly = await prisma.anomaly.findFirst({
      where: { id, companyId },
      include: {
        transaction: {
          include: {
            glCode: true,
            document: true,
            sourceRecons: {
              include: { targetTransaction: true }
            }
          }
        },
        investigations: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    if (!anomaly) throw new Error('Anomaly not found.');
    return anomaly;
  }

  async resolveAnomaly(companyId: string, id: string, userId: string, notes?: string) {
    const anomaly = await prisma.anomaly.findFirst({ where: { id, companyId } });
    if (!anomaly) throw new Error('Anomaly not found.');

    const updated = await prisma.anomaly.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        recommendedAction: notes ? `${anomaly.recommendedAction || ''} [Resolved note: ${notes}]` : anomaly.recommendedAction
      }
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'ANOMALY_RESOLVED',
      entity: 'Anomaly',
      entityId: id,
      previousValue: { status: anomaly.status },
      newValue: { status: 'RESOLVED', notes }
    });

    return updated;
  }

  async dismissAnomaly(companyId: string, id: string, userId: string, reason: string) {
    const anomaly = await prisma.anomaly.findFirst({ where: { id, companyId } });
    if (!anomaly) throw new Error('Anomaly not found.');

    const updated = await prisma.anomaly.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        description: `${anomaly.description} [Dismissed: ${reason || 'False positive'}]`
      }
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'ANOMALY_DISMISSED',
      entity: 'Anomaly',
      entityId: id,
      previousValue: { status: anomaly.status },
      newValue: { status: 'DISMISSED', reason }
    });

    return updated;
  }
}
