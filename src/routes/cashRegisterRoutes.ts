import { Router } from 'express';
import { CashRegisterController } from '../controllers/cashRegisterController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { branchMiddleware } from '../middlewares/branchMiddleware';

const router = Router();
router.use(authMiddleware);

router.post('/open', roleMiddleware([1,2]), branchMiddleware, CashRegisterController.open);
router.post('/close/:id', roleMiddleware([1,2]), branchMiddleware, CashRegisterController.close);
router.get('/status', roleMiddleware([1,2,3]), branchMiddleware, CashRegisterController.getStatus);
router.get('/:id/movements', roleMiddleware([1,2]), branchMiddleware, CashRegisterController.getMovements);

export default router;