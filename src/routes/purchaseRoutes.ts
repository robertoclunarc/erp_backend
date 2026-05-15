import { Router } from 'express';
import { PurchaseController } from '../controllers/purchaseController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { branchMiddleware } from '../middlewares/branchMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([1, 2])); // ADMIN y GERENTE

router.post('/', branchMiddleware, PurchaseController.createPurchase);
router.get('/', branchMiddleware, PurchaseController.listPurchases);
router.get('/:id', branchMiddleware, PurchaseController.getPurchaseById);
router.put('/:id', roleMiddleware([1,2]), PurchaseController.updatePurchase);
router.put('/:id/cancel', branchMiddleware, PurchaseController.cancelPurchase);

export default router;