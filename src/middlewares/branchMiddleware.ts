import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const branchMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Verificar autenticación
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Obtener branch_id de diferentes fuentes (params, body, query)
  let branchId: number | null = null;

  // Params
  if (req.params.branchId) {
    branchId = parseInt(req.params.branchId as string);
  }
  // Body
  else if (req.body && typeof req.body.branch_id !== 'undefined') {
    branchId = parseInt(req.body.branch_id);
  }
  // Query
  else if (req.query && req.query.branch_id) {
    const queryValue = req.query.branch_id;
    const branchIdStr = Array.isArray(queryValue) ? queryValue[0] : queryValue;
    branchId = parseInt(branchIdStr as string);
  }

  // Si no se encontró branch_id válido
  if (branchId === null || isNaN(branchId)) {
    // Si el usuario tiene exactamente una sucursal, la usamos automáticamente
    if (req.user.branches && req.user.branches.length === 1) {
      req.user.branch_id = req.user.branches[0];
      return next();
    }
    return res.status(400).json({ error: 'Debe especificar branch_id' });
  }

  // Verificar permiso
  const hasAccess = req.user.role_id === 1 || (req.user.branches && req.user.branches.includes(branchId));
  if (!hasAccess) {
    return res.status(403).json({ error: 'No tiene acceso a esta sucursal' });
  }

  // Asignar branch_id al request para uso en controladores
  req.user.branch_id = branchId;
  next();
};