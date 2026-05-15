import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import { ICreateUser } from '../interfaces/IUser';
import { AuthRequest } from '../middlewares/authMiddleware';

export class UserController {
  static async listUsers(req: AuthRequest, res: Response) {
    try {
      const { role_id, branch_id } = req.query;
      const filters: { role_id?: number; branch_id?: number } = {};
      if (role_id !== undefined) filters.role_id = Number(role_id);
      if (branch_id !== undefined) filters.branch_id = Number(branch_id);
      const users = await UserModel.list(filters);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(Number(id));
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      const branches = await UserModel.getUserBranches(user.id);
      res.json({ ...user, branches });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createUser(req: AuthRequest, res: Response) {
    try {
      const userData: ICreateUser = req.body;
      userData.created_by = req.user!.id;
      const userId = await UserModel.create(userData);
      res.status(201).json({ userId, message: 'Usuario creado exitosamente' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;      
      await UserModel.update(Number(id), updates, req.user!.id);
      res.json({ message: 'Usuario actualizado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      // Soft delete o desactivar
      await UserModel.update(Number(id), { status: 'inactive' } as any, req.user!.id);
      res.json({ message: 'Usuario desactivado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}