import { Request, Response } from 'express';
import { CashRegisterModel } from '../models/cashRegisterModel';
import { AuthRequest } from '../middlewares/authMiddleware';
//import { SaleModel } from '../models/saleModel';

type AuthenticatedRequest = Request & {
  user?: {
    branch_id?: number;
    id?: number;
  };
};

export class CashRegisterController {
  static async open(req: AuthenticatedRequest, res: Response) {
    const { opening_amount } = req.body;
    const branch_id = req.user?.branch_id; // viene del middleware
    const user_id = req.user?.id;
    
    if (!branch_id) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const existing = await CashRegisterModel.findOpenByBranch(branch_id);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una caja abierta para esta sucursal' });
    }
    
    const cashRegisterId = await CashRegisterModel.open({
      branch_id,
      opening_amount,
      opened_by: user_id
    });
    
    res.status(201).json({ cashRegisterId, message: 'Caja abierta exitosamente' });
  }
  
  static async close(req: AuthenticatedRequest, res: Response) {
    const { closing_amount } = req.body;
    const idParam = req.params.id;
    const user_id = req.user?.id;

    if (!idParam || Array.isArray(idParam)) {
      return res.status(400).json({ error: 'Invalid cash register ID' });
    }

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid cash register ID' });
    }

    // Verificar que no haya movimientos pendientes? (se puede agregar validación)
    await CashRegisterModel.close({ id, closing_amount, closed_by: user_id });
    res.json({ message: 'Caja cerrada correctamente' });
  }
  
  static async getStatus(req: AuthenticatedRequest, res: Response) {
    const branch_id = req.user?.branch_id;

    if (!branch_id) {
      return res.status(400).json({ error: 'Branch ID is required' });
    }

    const cashRegister = await CashRegisterModel.findOpenByBranch(branch_id);
    res.json({ open: !!cashRegister, cashRegister });
  }

  static async getMovements(req: AuthRequest, res: Response) {
    try {
      const idParam = req.params.id;
      if (!idParam || Array.isArray(idParam)) {
        return res.status(400).json({ error: 'ID de caja inválido' });
      }

      const cashRegisterId = parseInt(idParam, 10);
      if (Number.isNaN(cashRegisterId)) {
        return res.status(400).json({ error: 'ID de caja inválido' });
      }

      // Verificar que la caja pertenezca a la sucursal del usuario (seguridad)
      const cashRegister = await CashRegisterModel.findById(cashRegisterId);
      if (!cashRegister) {
        return res.status(404).json({ error: 'Caja no encontrada' });
      }
      if (req.user?.role_id !== 1 && cashRegister.branch_id !== req.user?.branch_id) {
        return res.status(403).json({ error: 'No tiene acceso a esta caja' });
      }

      const movements = await CashRegisterModel.getMovements(cashRegisterId);
      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}