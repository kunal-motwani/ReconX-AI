import { Router } from 'express';
import { InvestigationController } from '../controllers/investigation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new InvestigationController();

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);

export default router;
