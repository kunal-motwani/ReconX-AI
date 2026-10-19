import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';
import { IReconciliationProvider, CandidateTransaction } from '../providers/interfaces/reconciliation.interface';
import { IAnomalyDetectionProvider } from '../providers/interfaces/anomaly-detection.interface';
import { PythonAIProvider } from '../providers/python-ai.provider';

export class ReconciliationService {
  private reconProvider: IReconciliationProvider;
  private anomalyProvider: IAnomalyDetectionProvider;

  constructor(
    reconProvider?: IReconciliationProvider,
    anomalyProvider?: IAnomalyDetectionProvider
  ) {
    const pythonAI = new PythonAIProvider();
    this.reconProvider = reconProvider || pythonAI;
    this.anomalyProvider = anomalyProvider || pythonAI;
  }

  async runReconciliation(companyId: string, userId: string) {
    // 1. Fetch sources (Invoices, Receipts, POs) and targets (Bank transactions)
    const [sourceTxs, bankTxs] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          companyId,
          source: { not: 'BANK' },
          status: { in: ['UNMATCHED', 'PARTIALLY_MATCHED', 'REVIEW_REQUIRED'] }
        }
      }),
      prisma.transaction.findMany({
        where: {
          companyId,
          source: 'BANK'
        }
      })
    ]);

    if (sourceTxs.length === 0 || bankTxs.length === 0) {
      return {
        matchedCount: 0,
        mismatchCount: 0,
        message: 'No pending source or bank records to reconcile.'
      };
    }

    const bankCandidates: CandidateTransaction[] = bankTxs.map(t => ({
      id: t.id,
      vendorName: t.vendorName,
      amount: t.amount,
      currency: t.currency,
      transactionDate: t.transactionDate,
      referenceNumber: t.referenceNumber,
      description: t.description,
      source: t.source
    }));

    const reconciliationsCreated: any[] = [];
    let matchedCount = 0;
    let mismatchCount = 0;

    for (const source of sourceTxs) {
      const srcCandidate: CandidateTransaction = {
        id: source.id,
        vendorName: source.vendorName,
        amount: source.amount,
        currency: source.currency,
        transactionDate: source.transactionDate,
        referenceNumber: source.referenceNumber,
        description: source.description,
        source: source.source
      };

      const comparisons = this.reconProvider.findMatches(srcCandidate, bankCandidates);
      // Pick best match by confidence
      comparisons.sort((a, b) => b.confidenceScore - a.confidenceScore);
      const best = comparisons[0];

      if (best && best.confidenceScore > 0.40) {
        // Upsert reconciliation
        const existing = await prisma.reconciliation.findFirst({
          where: {
            companyId,
            sourceTransactionId: source.id,
            targetTransactionId: best.targetTransactionId
          }
        });

        let reconRecord;
        if (existing) {
          reconRecord = await prisma.reconciliation.update({
            where: { id: existing.id },
            data: {
              status: best.status,
              confidenceScore: best.confidenceScore,
              amountMatch: best.breakdown.amountMatch,
              vendorMatch: best.breakdown.vendorMatch,
              dateMatch: best.breakdown.dateMatch,
              referenceMatch: best.breakdown.referenceMatch,
              explanation: best.breakdown.explanation
            }
          });
        } else {
          reconRecord = await prisma.reconciliation.create({
            data: {
              companyId,
              sourceTransactionId: source.id,
              targetTransactionId: best.targetTransactionId,
              status: best.status,
              confidenceScore: best.confidenceScore,
              amountMatch: best.breakdown.amountMatch,
              vendorMatch: best.breakdown.vendorMatch,
              dateMatch: best.breakdown.dateMatch,
              referenceMatch: best.breakdown.referenceMatch,
              explanation: best.breakdown.explanation
            }
          });
        }

        reconciliationsCreated.push(reconRecord);

        // Update transaction status
        if (best.status === 'MATCHED') {
          matchedCount++;
          await prisma.transaction.update({
            where: { id: source.id },
            data: { status: 'MATCHED' }
          });
          await prisma.transaction.update({
            where: { id: best.targetTransactionId },
            data: { status: 'MATCHED' }
          });
        } else if (best.status === 'AMOUNT_MISMATCH') {
          mismatchCount++;
          await prisma.transaction.update({
            where: { id: source.id },
            data: { status: 'REVIEW_REQUIRED' }
          });
        }
      }
    }

    // 2. Trigger Anomaly Detection based on results
    const allTxs = await prisma.transaction.findMany({ where: { companyId } });
    const allRecons = await prisma.reconciliation.findMany({
      where: { companyId },
      include: { sourceTransaction: true, targetTransaction: true }
    });

    const anomaliesDetected = await this.anomalyProvider.detectAnomalies(
      companyId,
      allTxs.map(t => ({
        id: t.id,
        companyId: t.companyId,
        vendorName: t.vendorName,
        amount: t.amount,
        currency: t.currency,
        transactionDate: t.transactionDate,
        referenceNumber: t.referenceNumber,
        source: t.source,
        status: t.status
      })),
      allRecons
    );

    // Save detected anomalies idempotently
    for (const anom of anomaliesDetected) {
      const existing = await prisma.anomaly.findFirst({
        where: {
          companyId,
          type: anom.type,
          transactionId: anom.transactionId,
          status: { not: 'DISMISSED' }
        }
      });

      if (!existing) {
        await prisma.anomaly.create({
          data: {
            companyId,
            transactionId: anom.transactionId,
            type: anom.type,
            severity: anom.severity,
            title: anom.title,
            description: anom.description,
            evidence: JSON.stringify(anom.evidence),
            recommendedAction: anom.recommendedAction,
            status: 'OPEN'
          }
        });
      }
    }

    await createAuditLog({
      companyId,
      userId,
      action: 'RECONCILIATION_RUN_COMPLETED',
      entity: 'Reconciliation',
      entityId: 'BATCH_RUN',
      newValue: { matchedCount, mismatchCount, totalProcessed: sourceTxs.length }
    });

    return {
      message: 'Reconciliation batch process completed.',
      matchedCount,
      mismatchCount,
      totalEvaluated: sourceTxs.length
    };
  }

  async getReconciliations(companyId: string, status?: string) {
    return prisma.reconciliation.findMany({
      where: {
        companyId,
        ...(status ? { status: status as any } : {})
      },
      orderBy: { confidenceScore: 'desc' },
      include: {
        sourceTransaction: {
          include: { glCode: true, document: true }
        },
        targetTransaction: true,
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }

  async getReconciliationById(companyId: string, id: string) {
    const recon = await prisma.reconciliation.findFirst({
      where: { id, companyId },
      include: {
        sourceTransaction: {
          include: { glCode: true, document: true, anomalies: true }
        },
        targetTransaction: true,
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!recon) throw new Error('Reconciliation record not found.');
    return recon;
  }

  async approveReconciliation(companyId: string, id: string, userId: string, notes?: string) {
    const recon = await prisma.reconciliation.findFirst({ where: { id, companyId } });
    if (!recon) throw new Error('Reconciliation record not found.');

    const updated = await prisma.reconciliation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: userId,
        reviewedAt: new Date(),
        explanation: notes ? `${recon.explanation} [Approved with note: ${notes}]` : recon.explanation
      }
    });

    // Update transactions to APPROVED
    await Promise.all([
      prisma.transaction.update({
        where: { id: recon.sourceTransactionId },
        data: { status: 'APPROVED' }
      }),
      prisma.transaction.update({
        where: { id: recon.targetTransactionId },
        data: { status: 'APPROVED' }
      })
    ]);

    await createAuditLog({
      companyId,
      userId,
      action: 'RECONCILIATION_APPROVED',
      entity: 'Reconciliation',
      entityId: id,
      previousValue: { status: recon.status },
      newValue: { status: 'APPROVED', notes }
    });

    return updated;
  }

  async rejectReconciliation(companyId: string, id: string, userId: string, reason: string) {
    const recon = await prisma.reconciliation.findFirst({ where: { id, companyId } });
    if (!recon) throw new Error('Reconciliation record not found.');

    const updated = await prisma.reconciliation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: userId,
        reviewedAt: new Date(),
        explanation: `${recon.explanation} [Rejected: ${reason || 'Human rejection'}]`
      }
    });

    await prisma.transaction.update({
      where: { id: recon.sourceTransactionId },
      data: { status: 'REJECTED' }
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'RECONCILIATION_REJECTED',
      entity: 'Reconciliation',
      entityId: id,
      previousValue: { status: recon.status },
      newValue: { status: 'REJECTED', reason }
    });

    return updated;
  }
}
