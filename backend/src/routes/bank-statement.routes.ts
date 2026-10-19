import { Router } from 'express';
import { BankStatementController } from '../controllers/bank-statement.controller';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();
const controller = new BankStatementController();

router.use(authenticate);
router.post('/', uploadMiddleware.single('file'), controller.upload);
router.get('/', controller.list);
router.get('/:id', controller.getById);

export default router;
