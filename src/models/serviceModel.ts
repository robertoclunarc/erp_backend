import {pool} from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IService {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category_id: number;
  category_name?: string;
  status: 'active' | 'inactive';
  created_by: number;
  created_at: Date;
  updated_by: number;
  updated_at: Date;
}

export class ServiceModel {
  static async list(filters?: { category_id?: number; search?: string }): Promise<IService[]> {
    let query = `
      SELECT s.*, c.name as category_name
      FROM erp_services s
      LEFT JOIN erp_categories c ON s.category_id = c.id
      WHERE s.status = 'active'
    `;
    const values: any[] = [];

    if (filters?.category_id) {
      query += ' AND s.category_id = ?';
      values.push(filters.category_id);
    }
    if (filters?.search) {
      query += ' AND (s.name LIKE ?)';
      values.push(`%${filters.search}%`);
    }

    query += ' ORDER BY s.name';
    const [rows] = await pool.execute<IService[] & RowDataPacket[]>(query, values);
    return rows;
  }

  static async findById(id: number): Promise<IService | null> {
    const [rows] = await pool.execute<IService[] & RowDataPacket[]>(
      `SELECT s.*, c.name as category_name
       FROM erp_services s
       LEFT JOIN erp_categories c ON s.category_id = c.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data: Omit<IService, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<number> {
    const { name, description, duration_minutes, price, category_id, status, created_by, updated_by } = data;
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO erp_services (name, description, duration_minutes, price, category_id, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, duration_minutes, price, category_id, status, created_by, updated_by]
    );
    return result.insertId;
  }

  static async update(id: number, data: Partial<IService>, updatedBy: number): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(data.duration_minutes); }
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    fields.push('updated_by = ?, updated_at = NOW()');
    values.push(updatedBy, id);

    await pool.execute(`UPDATE erp_services SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async delete(id: number): Promise<void> {
    await pool.execute('UPDATE erp_services SET status = "inactive", updated_at = NOW() WHERE id = ?', [id]);
  }
}