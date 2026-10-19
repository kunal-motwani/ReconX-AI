import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new ReportController();

router.use(authenticate);
router.get('/reconciliation', controller.getReconciliationReport);
router.get('/anomalies', controller.getAnomalyReport);
router.get('/gl-mapping', controller.getGLMappingReport);
router.get('/export-csv', controller.exportCSV);

export default router;
