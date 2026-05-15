import {pool} from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { IProduct } from '../interfaces/IProducts';

export class ProductModel {
  static async list(
    branchId: number,
    filters?: { category_id?: number; search?: string; page?: number; limit?: number }
  ): Promise<{ data: IProduct[]; total: number }> {
    const page: number = filters?.page || 1;
    const limit: number = filters?.limit || 20;
    const offset: number = (page - 1) * limit;

    // Construir la consulta base con marcadores de posición
    let query = `
      SELECT 
        p.*, 
        c.name as category_name,
        COALESCE(s.quantity, 0) as current_stock
      FROM erp_products p
      LEFT JOIN erp_categories c ON p.category_id = c.id
      LEFT JOIN erp_stock s ON p.id = s.product_id AND s.branch_id = ${branchId}
      WHERE p.status = 'active'
    `;     

    if (filters?.category_id) {
      query += ` AND p.category_id = ${filters.category_id}`;      
    }
    if (filters?.search) {
      query += ` AND (p.name LIKE '${filters.search}%' OR p.sku LIKE '${filters.search}%')`;      
    }

    // Consulta de conteo (sin ORDER BY ni LIMIT)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM erp_products p
      LEFT JOIN erp_categories c ON p.category_id = c.id
      WHERE p.status = 'active'`;
    countQuery += filters?.category_id ? ` AND p.category_id = ${filters.category_id}` : '';
    countQuery += filters?.search ? ` AND (p.name LIKE '${filters.search}%' OR p.sku LIKE '${filters.search}%')` : '';    
    
    // Construyamos countQuery de forma más simple:
    let countQueryStr = `
      SELECT COUNT(*) as total
      FROM erp_products p
      WHERE p.status = 'active'
    `;
    
    if (filters?.category_id) {
      countQueryStr += ` AND p.category_id = ${filters.category_id}`;
    }
    if (filters?.search) {
      countQueryStr += ` AND (p.name LIKE '%${filters.search}%' OR p.sku LIKE '%${filters.search}%')`;      
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(countQueryStr);
    const total = countRows[0]?.total || 0;

    // Consulta paginada con ORDER BY y LIMIT
    query += ` ORDER BY p.name LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await pool.execute<IProduct[] & RowDataPacket[]>(query);

    return { data: rows, total };
  }

  static async findById(id: number, branchId?: number): Promise<any> {
    let query = `
      SELECT p.*, c.name as category_name
      FROM erp_products p
      JOIN erp_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    const product = (rows as any[])[0];
    if (product && branchId) {
      const [stockRows] = await pool.execute('SELECT quantity FROM erp_stock WHERE product_id = ? AND branch_id = ?', [id, branchId]);
      product.stock = (stockRows as any[])[0]?.quantity || 0;
    }
    return product;
  }

  static async create(data: any): Promise<number> {
    const { name, description, sku, barcode, category_id, unit, purchase_price, sale_price, min_stock, created_by } = data;
    const [result] = await pool.execute(
      `INSERT INTO erp_products (name, description, sku, barcode, category_id, unit, purchase_price, sale_price, min_stock, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, sku, barcode, category_id, unit, purchase_price, sale_price, min_stock, created_by, created_by]
    );
    return (result as any).insertId;
  }

  static async update(id: number, data: any, updated_by: number): Promise<void> {
    const fields = [];
    const values = [];
    const allowedFields = ['name', 'description', 'sku', 'barcode', 'category_id', 'unit', 'purchase_price', 'sale_price', 'min_stock', 'status'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    if (fields.length === 0) return;
    values.push(updated_by, id);
    await pool.execute(`UPDATE erp_products SET ${fields.join(', ')}, updated_by = ? WHERE id = ?`, values);
  }
}