import { Request, Response } from 'express';
import { ReportModel } from '../models/reportModel';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ReportController {
  static async salesByDay(req: AuthRequest, res: Response) {
    const { branch_id, start_date, end_date } = req.query;
    console.log('Generando reporte de ventas por día', { branch_id, start_date, end_date });
    const data = await ReportModel.getSalesByDay(
      branch_id as string,
      start_date as string,
      end_date as string
    );
    res.json(data);
  }
  
  static async topProducts(req: AuthRequest, res: Response) {
    const { branch_id, limit } = req.query;
    const data = await ReportModel.getTopProducts(
      branch_id as string,
      parseInt(limit as string) || 10
    );
    res.json(data);
  }

  static async topServices(req: AuthRequest, res: Response) {
    try {
      const { limit = '10' } = req.query;
      const branchId = req.user?.branch_id;
      const data = await ReportModel.getTopServices({
        branch_id: branchId!,
        limit: Number(limit),
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async cashStatus(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id;
      if (!branchId) {
        return res.status(400).json({ error: 'Branch id is required' });
      }
      const data = await ReportModel.getCashRegisterSummary(String(branchId));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async profitLoss(req: AuthRequest, res: Response) {
    try {
      const { start_date, end_date } = req.query;
      const branchId = req.user?.branch_id;
      const data = await ReportModel.getProfitLoss({
        branch_id: branchId!,
        start_date: start_date as string,
        end_date: end_date as string,
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async lowStock(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id;
      const data = await ReportModel.getLowStock(branchId!);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  static async cashRegisterStatus(req: AuthRequest, res: Response) {
    const { branch_id } = req.query;
    const data = await ReportModel.getCashRegisterSummary(branch_id as string);
    res.json(data);
  }

  static async salesByDateRange(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id;
      const { start_date, end_date } = req.query;
      if (!branchId || !start_date || !end_date) {
        return res.status(400).json({ error: 'branch_id, start_date y end_date son requeridos' });
      }
      const data = await ReportModel.getSalesByDateRange(branchId, start_date as string, end_date as string);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }  

  static async inventoryStatus(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id;
      if (!branchId) return res.status(400).json({ error: 'branch_id requerido' });
      const data = await ReportModel.getInventoryStatus(branchId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async salesByCashRegister(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id;
      if (!branchId) return res.status(400).json({ error: 'branch_id requerido' });
      const data = await ReportModel.getSalesByCashRegister(branchId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  static async salesWithFilters(req: AuthRequest, res: Response) {
    try {
      const branchId = req.user?.branch_id;
      const { start_date, end_date, product_id, service_id } = req.query;
      if (!branchId || !start_date || !end_date) {
        return res.status(400).json({ error: 'branch_id, start_date y end_date son requeridos' });
      }
      const data = await ReportModel.getSalesWithFilters(
        branchId,
        start_date as string,
        end_date as string,
        product_id ? Number(product_id) : undefined,
        service_id ? Number(service_id) : undefined
      );
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}