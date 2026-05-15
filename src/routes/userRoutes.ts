import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
//import { branchMiddleware } from '../middlewares/branchMiddleware';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authMiddleware);
router.use(roleMiddleware([1])); // Solo ADMIN

router.get('/', UserController.listUsers);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

export default router;