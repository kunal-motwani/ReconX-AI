import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new AuditController();

router.use(authenticate);
router.get('/', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.list);

export default router;
