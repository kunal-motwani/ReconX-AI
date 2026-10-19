import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();
const controller = new DocumentController();

router.use(authenticate);
router.post('/', uploadMiddleware.single('file'), controller.upload);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.get('/:id/download', controller.download);
router.delete('/:id', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.remove);

export default router;
