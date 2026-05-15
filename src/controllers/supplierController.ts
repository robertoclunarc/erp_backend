import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SupplierModel } from '../models/supplierModel';

export class SupplierController {
  static async list(req: AuthRequest, res: Response) {
    try {
      const suppliers = await SupplierModel.list();
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const supplier = await SupplierModel.findById(Number(id));
      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      res.json(supplier);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const supplierData = { ...req.body, created_by: userId, updated_by: userId };
      const newId = await SupplierModel.create(supplierData);
      res.status(201).json({ id: newId, message: 'Proveedor creado exitosamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const existing = await SupplierModel.findById(Number(id));
      if (!existing) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      await SupplierModel.update(Number(id), req.body, userId);
      res.json({ message: 'Proveedor actualizado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const existing = await SupplierModel.findById(Number(id));
      if (!existing) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      await SupplierModel.delete(Number(id));
      res.json({ message: 'Proveedor eliminado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}