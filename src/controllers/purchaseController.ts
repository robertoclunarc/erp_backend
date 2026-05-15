import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PurchaseModel } from '../models/purchaseModel';
import { CashService } from '../services/cashService';
import { InventoryService } from '../services/inventoryService';
import { ICreatePurchase } from '../interfaces/IPurchase';

export class PurchaseController {
  static async createPurchase(req: AuthRequest, res: Response) {
    try {
      const purchaseData: ICreatePurchase = req.body;
      const userId = req.user!.id;
      const branchId = req.user!.branch_id!;

      // Validar caja abierta
      const cashRegisterId = await CashService.validateOpenCash(branchId);
      purchaseData.cash_register_id = cashRegisterId;
      purchaseData.branch_id = branchId;
      purchaseData.user_id = userId;
      purchaseData.created_by = userId;

      const purchaseId = await PurchaseModel.createPurchase(purchaseData);
      res.status(201).json({ purchaseId, message: 'Compra registrada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async listPurchases(req: AuthRequest, res: Response) {
    try {
      const { start_date, end_date, page = '1', limit = '20' } = req.query;
      const branchId = req.user?.branch_id;
      const purchases = await PurchaseModel.listPurchases({
        branch_id: branchId!,
        start_date: start_date as string,
        end_date: end_date as string,
        page: Number(page),
        limit: Number(limit),
      });
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updatePurchase(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // solo se permite actualizar status por ahora
      const userId = req.user!.id;
      //console.log('Actualizando compra', { id, status, userId });
      const purchase = await PurchaseModel.getPurchaseById(Number(id));
      if (!purchase) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }
      // Verificar permisos: solo ADMIN o GERENTE
      if (req.user!.role_id !== 1 && req.user!.branch_id !== purchase.branch_id) {
        return res.status(403).json({ error: 'No tiene acceso a esta compra' });
      }
      await PurchaseModel.updateStatus(Number(id), status, userId);
      res.json({ message: 'Estado actualizado correctamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPurchaseById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const purchase = await PurchaseModel.getPurchaseById(Number(id));
      if (!purchase) return res.status(404).json({ error: 'Compra no encontrada' });
      res.json(purchase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async cancelPurchase(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await PurchaseModel.cancelPurchase(Number(id), req.user!.id);
      res.json({ message: 'Compra cancelada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}