import { Response, Request } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { ProductModel } from '../models/productModel';
import { CategoryModel } from '../models/categoryModel';

export class ProductController {
  static async listProducts(req: AuthRequest, res: Response) {
  try {
    const branchId = req.user?.branch_id || req.query.branch_id;
    if (!branchId) {
      return res.status(400).json({ error: 'Se requiere branch_id' });
    }
    const { category_id, search, page, limit } = req.query;
    const result = await ProductModel.list(Number(branchId), {
      category_id: category_id ? Number(category_id) : undefined,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20
    });
    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

  static async getProductById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductModel.findById(Number(id), req.user?.branch_id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createProduct(req: AuthRequest, res: Response) {
    try {
      const productData = req.body;
      productData.created_by = req.user!.id;
      const productId = await ProductModel.create(productData);
      res.status(201).json({ productId, message: 'Producto creado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await ProductModel.update(Number(id), req.body, req.user!.id);
      res.json({ message: 'Producto actualizado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await ProductModel.update(Number(id), { status: 'inactive' }, req.user!.id);
      res.json({ message: 'Producto desactivado' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async listCategories(req: Request, res: Response) {
    try {
      const categories = await CategoryModel.list();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createCategory(req: AuthRequest, res: Response) {
    try {
      const categoryData = req.body;
      categoryData.created_by = req.user!.id;
      const categoryId = await CategoryModel.create(categoryData);
      res.status(201).json({ categoryId, message: 'Categoría creada' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}