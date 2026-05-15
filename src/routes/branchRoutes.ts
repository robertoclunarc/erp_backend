import { Router } from 'express';
import { BranchController } from '../controllers/branchController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware([1])); // Solo ADMIN

router.get('/', BranchController.listBranches);
router.get('/:id', BranchController.getBranchById);
router.post('/', BranchController.createBranch);
router.put('/:id', BranchController.updateBranch);
router.delete('/:id', BranchController.deleteBranch);

export default router;