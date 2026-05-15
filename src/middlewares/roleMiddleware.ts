import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const roleMiddleware = (allowedRoles: number[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (allowedRoles.includes(req.user.role_id)) {
      next();
    } else {
      res.status(403).json({ error: 'No tiene permisos suficientes' });
    }
  };
};