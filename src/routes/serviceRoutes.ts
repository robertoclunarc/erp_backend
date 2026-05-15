import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);

// Listar servicios (todos los roles autenticados)
router.get('/', ServiceController.listServices);
router.get('/:id', ServiceController.getServiceById);

// Solo ADMIN y GERENTE pueden crear/editar/eliminar
router.post('/', roleMiddleware([1, 2]), ServiceController.createService);
router.put('/:id', roleMiddleware([1, 2]), ServiceController.updateService);
router.delete('/:id', roleMiddleware([1, 2]), ServiceController.deleteService);

export default router;