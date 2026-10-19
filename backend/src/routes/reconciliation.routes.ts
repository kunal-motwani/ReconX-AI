import { Router } from 'express';
import { ReconciliationController } from '../controllers/reconciliation.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new ReconciliationController();

router.use(authenticate);
router.post('/run', controller.run);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/:id/approve', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.approve);
router.post('/:id/reject', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.reject);

export default router;
