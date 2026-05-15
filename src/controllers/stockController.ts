import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { StockModel } from '../models/stockModel';
import { InventoryService } from '../services/inventoryService';

export class StockController {
  static async getStockByBranch(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id!;
      const { product_id, low_stock } = req.query;
      const options: { product_id?: number; lowStockOnly?: boolean } = {
        lowStockOnly: low_stock === 'true',
      };
      if (product_id) {
        options.product_id = Number(product_id);
      }
      const stock = await StockModel.getStockByBranch(branchId, options);
      res.json(stock);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStockMovements(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id!;
      const { product_id, start_date, end_date, page = '1', limit = '50' } = req.query;
      const movementOptions: {
        product_id?: number;
        start_date?: string;
        end_date?: string;
        page?: number;
        limit?: number;
      } = {
        start_date: start_date as string,
        end_date: end_date as string,
        page: Number(page),
        limit: Number(limit),
      };
      if (product_id) {
        movementOptions.product_id = Number(product_id);
      }
      const movements = await StockModel.getMovements(branchId, movementOptions);
      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async adjustStock(req: AuthRequest, res: Response) {
    try {
      const { product_id, quantity, reason } = req.body;
      const branchId = req.user?.branch_id!;
      const userId = req.user!.id;
      await InventoryService.updateStock(
        product_id,
        branchId,
        quantity,
        userId,
        reason,
        'adjustment',
        null
      );
      res.json({ message: 'Stock ajustado correctamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async registerLoss(req: AuthRequest, res: Response) {
    try {
      const { product_id, quantity, reason } = req.body;
      const branchId = req.user?.branch_id!;
      const userId = req.user!.id;
      // Registrar pérdida en tabla product_losses
      await StockModel.registerLoss({
        product_id,
        branch_id: branchId,
        quantity,
        reason,
        created_by: userId,
        approved_by: userId, // En producción se podría requerir aprobación
      });
      // Afectar stock
      await InventoryService.updateStock(
        product_id,
        branchId,
        -quantity,
        userId,
        reason,
        'loss',
        null
      );
      res.json({ message: 'Pérdida registrada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}