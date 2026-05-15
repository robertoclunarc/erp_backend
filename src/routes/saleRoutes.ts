import { Router } from 'express';
import { SaleController } from '../controllers/saleController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { branchMiddleware } from '../middlewares/branchMiddleware';

const router = Router();
router.use(authMiddleware);

router.post('/', roleMiddleware([1,2,3]), branchMiddleware, SaleController.createSale);
router.get('/', roleMiddleware([1,2]), branchMiddleware, SaleController.listSales);
router.get('/:id', roleMiddleware([1,2,3]), SaleController.getSaleById);
router.put('/:id/cancel', roleMiddleware([1,2]), SaleController.cancelSale);

export default router;