import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { branchMiddleware } from '../middlewares/branchMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([1, 2])); // ADMIN y GERENTE
router.use(branchMiddleware);

router.get('/sales-by-day', ReportController.salesByDay);
router.get('/top-products', ReportController.topProducts);
router.get('/top-services', ReportController.topServices);
router.get('/cash-status', ReportController.cashStatus);
router.get('/profit-loss', ReportController.profitLoss);
router.get('/low-stock', ReportController.lowStock);

router.get('/sales-by-range', ReportController.salesByDateRange);
router.get('/inventory-status', ReportController.inventoryStatus);
router.get('/sales-by-cash-register', ReportController.salesByCashRegister);
router.get('/sales-with-filters', ReportController.salesWithFilters);

export default router;