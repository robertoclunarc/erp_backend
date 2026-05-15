import { Request, Response } from 'express';
import { ServiceModel } from '../models/serviceModel';
import { AuthRequest } from '../middlewares/authMiddleware';

export class ServiceController {
  static async listServices(req: AuthRequest, res: Response) {
    try {
      const { category_id, search } = req.query;
      const services = await ServiceModel.list({
        category_id: category_id ? Number(category_id) : undefined,
        search: search as string,
      });
      res.json(services);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getServiceById(req: Request<{ id: string }>, res: Response) {
    try {
      const service = await ServiceModel.findById(parseInt(req.params.id));
      if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createService(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const serviceData = { ...req.body, created_by: userId, updated_by: userId, status: 'active' };
      const serviceId = await ServiceModel.create(serviceData);
      res.status(201).json({ id: serviceId, message: 'Servicio creado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateService(req: AuthRequest, res: Response) {
    try {
      const userId = Array.isArray(req.user!.id) ? req.user!.id[0] : req.user!.id;
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await ServiceModel.update(parseInt(serviceId), req.body, userId);
      res.json({ message: 'Servicio actualizado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteService(req: AuthRequest, res: Response) {
    try {
      const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await ServiceModel.delete(parseInt(serviceId));
      res.json({ message: 'Servicio eliminado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}