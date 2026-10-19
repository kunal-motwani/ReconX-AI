import { prisma } from '../repositories/prisma';

export class ReportService {
  async getReconciliationReport(companyId: string) {
    const [total, matched, unmatched, partial, mismatches, transactions] = await Promise.all([
      prisma.reconciliation.count({ where: { companyId } }),
      prisma.reconciliation.count({ where: { companyId, status: { in: ['MATCHED', 'APPROVED'] } } }),
      prisma.reconciliation.count({ where: { companyId, status: 'UNMATCHED' } }),
      prisma.reconciliation.count({ where: { companyId, status: 'PARTIALLY_MATCHED' } }),
      prisma.reconciliation.count({ where: { companyId, status: 'AMOUNT_MISMATCH' } }),
      prisma.reconciliation.findMany({
        where: { companyId },
        include: {
          sourceTransaction: { include: { glCode: true } },
          targetTransaction: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const matchRate = total > 0 ? ((matched / total) * 100).toFixed(1) : '0.0';

    return {
      metrics: {
        total,
        matched,
        unmatched,
        partial,
        mismatches,
        matchRate: `${matchRate}%`
      },
      records: transactions
    };
  }

  async getAnomalyReport(companyId: string) {
    const [total, bySeverity, byType, openCount, resolvedCount, records] = await Promise.all([
      prisma.anomaly.count({ where: { companyId } }),
      prisma.anomaly.groupBy({
        by: ['severity'],
        where: { companyId },
        _count: { id: true }
      }),
      prisma.anomaly.groupBy({
        by: ['type'],
        where: { companyId },
        _count: { id: true }
      }),
      prisma.anomaly.count({ where: { companyId, status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.anomaly.count({ where: { companyId, status: 'RESOLVED' } }),
      prisma.anomaly.findMany({
        where: { companyId },
        include: { transaction: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      metrics: {
        total,
        open: openCount,
        resolved: resolvedCount,
        bySeverity: bySeverity.reduce((acc, curr) => ({ ...acc, [curr.severity]: curr._count.id }), {}),
        byType: byType.reduce((acc, curr) => ({ ...acc, [curr.type]: curr._count.id }), {})
      },
      records
    };
  }

  async getGLMappingReport(companyId: string) {
    const glCodes = await prisma.gLCode.findMany({
      where: { companyId },
      include: {
        transactions: {
          select: { id: true, amount: true, glStatus: true, glConfidence: true }
        }
      }
    });

    const report = glCodes.map(gl => {
      const txCount = gl.transactions.length;
      const totalAmount = gl.transactions.reduce((sum, t) => sum + t.amount, 0);
      const avgConfidence = txCount > 0
        ? (gl.transactions.reduce((sum, t) => sum + (t.glConfidence || 0), 0) / txCount).toFixed(2)
        : '1.00';

      return {
        id: gl.id,
        code: gl.code,
        name: gl.name,
        category: gl.category,
        transactionCount: txCount,
        totalAmount,
        averageConfidence: avgConfidence
      };
    });

    return report;
  }

  async exportReportCSV(companyId: string, reportType: 'reconciliation' | 'anomalies' | 'gl') {
    if (reportType === 'reconciliation') {
      const recons = await prisma.reconciliation.findMany({
        where: { companyId },
        include: { sourceTransaction: true, targetTransaction: true }
      });

      const header = 'Reconciliation ID,Status,Confidence,Source Vendor,Source Amount,Source Ref,Target Vendor,Target Amount,Target Ref,Explanation\n';
      const rows = recons.map(r => 
        `"${r.id}","${r.status}","${r.confidenceScore}","${r.sourceTransaction?.vendorName || ''}","${r.sourceTransaction?.amount || 0}","${r.sourceTransaction?.referenceNumber || ''}","${r.targetTransaction?.vendorName || ''}","${r.targetTransaction?.amount || 0}","${r.targetTransaction?.referenceNumber || ''}","${(r.explanation || '').replace(/"/g, '""')}"`
      ).join('\n');

      return header + rows;
    } else if (reportType === 'anomalies') {
      const anomalies = await prisma.anomaly.findMany({
        where: { companyId },
        include: { transaction: true }
      });

      const header = 'Anomaly ID,Type,Severity,Status,Title,Vendor,Amount,Recommended Action\n';
      const rows = anomalies.map(a => 
        `"${a.id}","${a.type}","${a.severity}","${a.status}","${a.title.replace(/"/g, '""')}","${a.transaction?.vendorName || ''}","${a.transaction?.amount || 0}","${(a.recommendedAction || '').replace(/"/g, '""')}"`
      ).join('\n');

      return header + rows;
    } else {
      const glReport = await this.getGLMappingReport(companyId);
      const header = 'GL Code,Name,Category,Transaction Count,Total Amount,Average Confidence\n';
      const rows = glReport.map(g => 
        `"${g.code}","${g.name}","${g.category}","${g.transactionCount}","${g.totalAmount}","${g.averageConfidence}"`
      ).join('\n');

      return header + rows;
    }
  }
}
