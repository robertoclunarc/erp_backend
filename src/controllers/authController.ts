import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import { comparePassword } from '../utils/bcryptUtils';
import { generateToken } from '../utils/jwtUtils';
import { ILoginRequest } from '../interfaces/IUser';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password }: ILoginRequest = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      }
      
      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const validPassword = await comparePassword(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const branches = await UserModel.getUserBranches(user.id);
      const token = generateToken({ id: user.id, username: user.username, role_id: user.role_id, branches });
      console.log(`Usuario ${user.username} autenticado exitosamente`);
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role_id: user.role_id,
          branches
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}