import {pool} from '../config/database';

export class CategoryModel {
  static async list(type?: string): Promise<any[]> {
    let query = 'SELECT * FROM erp_categories WHERE 1=1';
    const params: any[] = [];
    if (type) {
      query += ' AND type IN (?, "both")';
      params.push(type);
    }
    query += ' ORDER BY name';
    const [rows] = await pool.execute(query, params);
    return rows as any[];
  }

  static async create(data: any): Promise<number> {
    const { name, description, type, created_by } = data;
    const [result] = await pool.execute(
      `INSERT INTO erp_categories (name, description, type, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description, type, created_by, created_by]
    );
    return (result as any).insertId;
  }
}