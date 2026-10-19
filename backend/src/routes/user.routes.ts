import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new UserController();

router.use(authenticate);
router.get('/', controller.list);
router.post('/', authorize(['ADMIN']), controller.create);
router.put('/:id', authorize(['ADMIN']), controller.update);

export default router;
