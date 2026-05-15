import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { branchMiddleware } from '../middlewares/branchMiddleware';

const router = Router();

router.use(authMiddleware);

// Listar productos (todos los roles pueden ver)
router.get('/', branchMiddleware, ProductController.listProducts);
router.get('/:id', branchMiddleware, ProductController.getProductById);

// Crear, actualizar, eliminar solo ADMIN/GERENTE
router.post('/', roleMiddleware([1, 2]), branchMiddleware, ProductController.createProduct);
router.put('/:id', roleMiddleware([1, 2]), branchMiddleware, ProductController.updateProduct);
router.delete('/:id', roleMiddleware([1, 2]), ProductController.deleteProduct);

// Categorías
router.get('/categories/all', roleMiddleware([1, 2]), ProductController.listCategories);
router.post('/categories', roleMiddleware([1, 2]), ProductController.createCategory);

export default router;