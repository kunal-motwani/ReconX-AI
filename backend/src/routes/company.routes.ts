import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();
const controller = new CompanyController();

router.use(authenticate);
router.get('/', controller.getCompany);
router.put('/', authorize(['ADMIN']), controller.updateCompany);

export default router;
