import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new TransactionController();

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.post('/bulk-approve', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.bulkApprove);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', authorize(['ADMIN']), controller.remove);

export default router;
