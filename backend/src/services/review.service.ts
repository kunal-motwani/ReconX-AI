import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';

export class ReviewService {
  async getReviewQueue(companyId: string) {
    // Gather urgent items requiring human review
    const [anomalies, unverifiedTransactions, pendingReconciliations, openInvestigations] = await Promise.all([
      prisma.anomaly.findMany({
        where: {
          companyId,
          status: { in: ['OPEN', 'UNDER_REVIEW'] }
        },
        include: {
          transaction: {
            include: { glCode: true, document: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.transaction.findMany({
        where: {
          companyId,
          status: 'REVIEW_REQUIRED'
        },
        include: { glCode: true, document: true },
        take: 20
      }),
      prisma.reconciliation.findMany({
        where: {
          companyId,
          status: { in: ['PARTIALLY_MATCHED', 'AMOUNT_MISMATCH'] }
        },
        include: {
          sourceTransaction: true,
          targetTransaction: true
        },
        take: 20
      }),
      prisma.investigation.findMany({
        where: {
          companyId,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        include: {
          anomaly: {
            include: { transaction: true }
          },
          assignedTo: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        take: 20
      })
    ]);

    return {
      anomalies,
      unverifiedTransactions,
      pendingReconciliations,
      openInvestigations,
      summary: {
        totalPending: anomalies.length + unverifiedTransactions.length + pendingReconciliations.length + openInvestigations.length,
        criticalAnomalies: anomalies.filter(a => a.severity === 'CRITICAL').length,
        amountMismatches: pendingReconciliations.filter(r => r.status === 'AMOUNT_MISMATCH').length
      }
    };
  }

  async submitDecision(companyId: string, userId: string, payload: {
    itemType: 'ANOMALY' | 'TRANSACTION' | 'RECONCILIATION' | 'INVESTIGATION';
    itemId: string;
    action: 'APPROVE' | 'REJECT' | 'RESOLVE' | 'DISMISS';
    notes?: string;
  }) {
    const { itemType, itemId, action, notes } = payload;

    if (itemType === 'ANOMALY') {
      if (action === 'RESOLVE' || action === 'APPROVE') {
        return prisma.anomaly.update({
          where: { id: itemId },
          data: { status: 'RESOLVED' }
        });
      } else {
        return prisma.anomaly.update({
          where: { id: itemId },
          data: { status: 'DISMISSED' }
        });
      }
    } else if (itemType === 'RECONCILIATION') {
      const recon = await prisma.reconciliation.update({
        where: { id: itemId },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reviewedById: userId,
          reviewedAt: new Date(),
          explanation: notes ? `Human decision: ${action}. Note: ${notes}` : undefined
        }
      });
      return recon;
    } else if (itemType === 'TRANSACTION') {
      return prisma.transaction.update({
        where: { id: itemId },
        data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
      });
    } else if (itemType === 'INVESTIGATION') {
      return prisma.investigation.update({
        where: { id: itemId },
        data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
      });
    }

    await createAuditLog({
      companyId,
      userId,
      action: `REVIEW_${action}_${itemType}`,
      entity: itemType,
      entityId: itemId,
      newValue: { action, notes }
    });

    return { message: 'Decision recorded successfully.' };
  }
}
