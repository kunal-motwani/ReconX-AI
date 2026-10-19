import { prisma } from '../repositories/prisma';

export class DashboardService {
  async getDashboardStats(companyId: string) {
    const [
      totalTransactions,
      matchedTransactions,
      pendingReviewTransactions,
      totalTransactionValueResult,
      totalAnomalies,
      duplicatePayments,
      amountMismatches,
      reconciledCount,
      unreconciledCount,
      glDistributionRaw,
      recentActivity,
      attentionRequired
    ] = await Promise.all([
      prisma.transaction.count({ where: { companyId } }),
      prisma.transaction.count({ where: { companyId, status: 'MATCHED' } }),
      prisma.transaction.count({ where: { companyId, status: { in: ['UNMATCHED', 'PARTIALLY_MATCHED', 'REVIEW_REQUIRED'] } } }),
      prisma.transaction.aggregate({
        where: { companyId },
        _sum: { amount: true }
      }),
      prisma.anomaly.count({ where: { companyId, status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.anomaly.count({ where: { companyId, type: 'DUPLICATE_PAYMENT', status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.anomaly.count({ where: { companyId, type: 'AMOUNT_MISMATCH', status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.reconciliation.count({ where: { companyId, status: { in: ['MATCHED', 'APPROVED'] } } }),
      prisma.reconciliation.count({ where: { companyId, status: { in: ['UNMATCHED', 'AMOUNT_MISMATCH', 'PARTIALLY_MATCHED'] } } }),
      prisma.transaction.groupBy({
        by: ['glCodeId'],
        where: { companyId, glCodeId: { not: null } },
        _count: { id: true },
        _sum: { amount: true }
      }),
      prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      }),
      prisma.anomaly.findMany({
        where: { companyId, status: 'OPEN' },
        orderBy: { severity: 'asc' },
        take: 5,
        include: {
          transaction: true
        }
      })
    ]);

    // Fetch GL code names for distribution chart
    const glIds = glDistributionRaw.map(g => g.glCodeId as string);
    const glCodes = await prisma.gLCode.findMany({
      where: { id: { in: glIds } }
    });
    const glMap = new Map(glCodes.map(g => [g.id, g]));

    const glDistribution = glDistributionRaw.map(g => {
      const gl = glMap.get(g.glCodeId as string);
      return {
        code: gl?.code || 'Unassigned',
        name: gl?.name || 'General',
        count: g._count.id,
        amount: g._sum.amount || 0
      };
    });

    // Generate 6-month simulated volume over time
    const months = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'];
    const volumeOverTime = months.map((m, idx) => ({
      month: m,
      volume: 12 + idx * 8 + Math.floor(Math.random() * 5),
      value: 150000 + idx * 95000
    }));

    return {
      kpis: {
        totalTransactions,
        reconciled: matchedTransactions,
        pendingReview: pendingReviewTransactions,
        anomalies: totalAnomalies,
        duplicatePayments,
        amountMismatches,
        totalTransactionValue: totalTransactionValueResult._sum.amount || 0,
        reconciliationRate: totalTransactions > 0 ? Math.round((matchedTransactions / totalTransactions) * 100) : 0
      },
      charts: {
        reconciliationStatus: [
          { name: 'Reconciled', count: reconciledCount, color: '#10B981' },
          { name: 'Partial / Review', count: pendingReviewTransactions, color: '#F59E0B' },
          { name: 'Anomalies', count: totalAnomalies, color: '#EF4444' }
        ],
        volumeOverTime,
        glDistribution,
        reconciledVsUnreconciled: {
          reconciled: reconciledCount,
          unreconciled: unreconciledCount
        }
      },
      recentActivity,
      attentionRequired
    };
  }
}
