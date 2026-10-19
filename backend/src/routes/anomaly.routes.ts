import { Router } from 'express';
import { AnomalyController } from '../controllers/anomaly.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new AnomalyController();

router.use(authenticate);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/:id/resolve', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.resolve);
router.post('/:id/dismiss', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.dismiss);

export default router;
