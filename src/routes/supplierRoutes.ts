import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo ADMIN y GERENTE pueden crear, editar, eliminar
// EMPLEADO solo puede listar y ver detalles
router.get('/', roleMiddleware([1, 2, 3]), SupplierController.list);
router.get('/:id', roleMiddleware([1, 2, 3]), SupplierController.getById);
router.post('/', roleMiddleware([1, 2]), SupplierController.create);
router.put('/:id', roleMiddleware([1, 2]), SupplierController.update);
router.delete('/:id', roleMiddleware([1, 2]), SupplierController.delete);

export default router;