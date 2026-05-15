import { Request, Response } from 'express';
import { BranchModel } from '../models/branchModel';
import { AuthRequest } from '../middlewares/authMiddleware';

export class BranchController {
  static async listBranches(req: Request, res: Response) {
    try {
      const branches = await BranchModel.list();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getBranchById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const branch = await BranchModel.findById(Number(id));
      if (!branch) return res.status(404).json({ error: 'Sucursal no encontrada' });
      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createBranch(req: AuthRequest, res: Response) {
    try {
      const branchData = req.body;
      branchData.created_by = req.user!.id;
      const branchId = await BranchModel.create(branchData);
      res.status(201).json({ branchId, message: 'Sucursal creada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateBranch(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await BranchModel.update(Number(id), req.body);
      res.json({ message: 'Sucursal actualizada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteBranch(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await BranchModel.delete(Number(id));
      res.json({ message: 'Sucursal eliminada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}