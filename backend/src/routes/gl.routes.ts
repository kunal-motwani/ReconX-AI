import { Router } from 'express';
import { GLController } from '../controllers/gl.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new GLController();

router.use(authenticate);
router.get('/', controller.list);
router.post('/', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.update);
router.delete('/:id', authorize(['ADMIN']), controller.remove);

export default router;
