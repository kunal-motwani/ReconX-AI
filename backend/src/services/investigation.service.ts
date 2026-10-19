import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';
import { IInvestigationProvider } from '../providers/interfaces/investigation.interface';
import { PythonAIProvider } from '../providers/python-ai.provider';

export class InvestigationService {
  private investigationProvider: IInvestigationProvider;

  constructor(investigationProvider?: IInvestigationProvider) {
    this.investigationProvider = investigationProvider || new PythonAIProvider();
  }

  async getInvestigations(companyId: string, status?: string) {
    return prisma.investigation.findMany({
      where: {
        companyId,
        ...(status ? { status: status as any } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        anomaly: {
          include: {
            transaction: {
              include: { glCode: true, document: true }
            }
          }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  async getInvestigationById(companyId: string, id: string) {
    const inv = await prisma.investigation.findFirst({
      where: { id, companyId },
      include: {
        anomaly: {
          include: {
            transaction: {
              include: {
                glCode: true,
                document: true,
                sourceRecons: {
                  include: { targetTransaction: true }
                }
              }
            }
          }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!inv) throw new Error('Investigation not found.');
    return inv;
  }

  async createInvestigationForAnomaly(companyId: string, anomalyId: string, userId?: string) {
    const anomaly = await prisma.anomaly.findFirst({
      where: { id: anomalyId, companyId },
      include: {
        transaction: {
          include: {
            document: true,
            sourceRecons: {
              include: { targetTransaction: true }
            }
          }
        }
      }
    });

    if (!anomaly) throw new Error('Anomaly not found.');

    const targetTx = anomaly.transaction?.sourceRecons[0]?.targetTransaction;

    const plan = await this.investigationProvider.generateInvestigation(anomaly, {
      transaction: anomaly.transaction,
      document: anomaly.transaction?.document,
      counterparty: targetTx
    });

    const investigation = await prisma.investigation.create({
      data: {
        companyId,
        anomalyId,
        assignedToId: userId || null,
        status: 'OPEN',
        findings: plan.findings,
        evidence: JSON.stringify(plan.evidence),
        recommendation: plan.recommendation,
        timeline: JSON.stringify(plan.timeline)
      }
    });

    await prisma.anomaly.update({
      where: { id: anomalyId },
      data: { status: 'UNDER_REVIEW' }
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'INVESTIGATION_CREATED',
      entity: 'Investigation',
      entityId: investigation.id,
      newValue: { anomalyId, status: 'OPEN' }
    });

    return investigation;
  }

  async updateInvestigation(companyId: string, id: string, userId: string, data: any) {
    const existing = await prisma.investigation.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error('Investigation not found.');

    const updated = await prisma.investigation.update({
      where: { id },
      data
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'INVESTIGATION_UPDATED',
      entity: 'Investigation',
      entityId: id,
      previousValue: existing,
      newValue: updated
    });

    return updated;
  }
}
