import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SaleModel } from '../models/saleModel';
import { CashService } from '../services/cashService';
import { InventoryService } from '../services/inventoryService';
import { ICreateSale } from '../interfaces/ISale';

export class SaleController {
  // Crear nueva venta
  static async createSale(req: AuthRequest, res: Response) {
    try {
      const saleData: ICreateSale = req.body;
      const userId = req.user?.id;
      const branchId = req.user?.branch_id || saleData.branch_id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Validar que la caja esté abierta
      const cashRegisterId = await CashService.validateOpenCash(branchId);
      saleData.cash_register_id = cashRegisterId;
      saleData.branch_id = branchId;
      saleData.user_id = userId;
      saleData.created_by = userId;

      // Validar stock para productos
      for (const item of saleData.items) {
        if (item.item_type === 'product') {
          const hasStock = await InventoryService.checkStock(item.item_id, branchId, item.quantity);
          if (!hasStock) {
            return res.status(400).json({ error: `Stock insuficiente para producto ID ${item.item_id}` });
          }
        }
      }

      const saleId = await SaleModel.createSale(saleData);
      res.status(201).json({ saleId, message: 'Venta registrada exitosamente' });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Error al crear venta' });
    }
  }

  // Listar ventas con filtros
  static async listSales(req: AuthRequest, res: Response) {
    try {
      const { branch_id, start_date, end_date, page = 1, limit = 20 } = req.query;
      const branchId = branch_id || req.user?.branch_id;
      const result = await SaleModel.listSales({
        branch_id: branchId as string,
        start_date: start_date as string,
        end_date: end_date as string,
        page: Number(page),
        limit: Number(limit),
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener detalle de venta por ID
  static async getSaleById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const sale = await SaleModel.getSaleById(Number(id));
      if (!sale) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }
      // Verificar acceso a sucursal
      if (req.user?.role_id !== 1 && sale.branch_id !== req.user?.branch_id) {
        return res.status(403).json({ error: 'No tiene acceso a esta venta' });
      }
      res.json(sale);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Cancelar venta (requiere permisos)
  static async cancelSale(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const reason = req.body.reason || 'Cancelación manual';
      await SaleModel.cancelSale(Number(id), userId!, reason);
      res.json({ message: 'Venta cancelada correctamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}