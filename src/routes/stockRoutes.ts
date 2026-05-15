import { Router } from 'express';
import { StockController } from '../controllers/stockController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { branchMiddleware } from '../middlewares/branchMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([1, 2])); // ADMIN y GERENTE

router.get('/', branchMiddleware, StockController.getStockByBranch);
router.get('/movements', branchMiddleware, StockController.getStockMovements);
router.post('/adjust', branchMiddleware, StockController.adjustStock);
router.post('/loss', branchMiddleware, StockController.registerLoss);

export default router;