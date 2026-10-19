import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new ReviewController();

router.use(authenticate);
router.get('/queue', controller.getQueue);
router.post('/decision', authorize(['ADMIN', 'FINANCE_MANAGER']), controller.submitDecision);

export default router;
