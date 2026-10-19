import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import documentRoutes from './document.routes';
import bankStatementRoutes from './bank-statement.routes';
import transactionRoutes from './transaction.routes';
import glRoutes from './gl.routes';
import reconciliationRoutes from './reconciliation.routes';
import anomalyRoutes from './anomaly.routes';
import investigationRoutes from './investigation.routes';
import reviewRoutes from './review.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import auditRoutes from './audit.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/documents', documentRoutes);
router.use('/bank-statements', bankStatementRoutes);
router.use('/transactions', transactionRoutes);
router.use('/gl-codes', glRoutes);
router.use('/reconciliation', reconciliationRoutes);
router.use('/anomalies', anomalyRoutes);
router.use('/investigations', investigationRoutes);
router.use('/review-queue', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/users', userRoutes);

export default router;
