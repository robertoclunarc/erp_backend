import {pool} from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface IBranch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: 'active' | 'inactive';
  created_by: number;
  created_at: Date;
  updated_by: number;
  updated_at: Date;
}

export class BranchModel {
  static async list(): Promise<IBranch[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM erp_branches ORDER BY name ASC'
    );
    return rows as IBranch[];
  }

  static async findById(id: number): Promise<IBranch | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM erp_branches WHERE id = ?',
      [id]
    );
    return rows[0] as IBranch || null;
  }

  static async create(data: Omit<IBranch, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { name, address, phone, email, status, created_by, updated_by } = data;
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO erp_branches (name, address, phone, email, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, address, phone, email, status, created_by, updated_by]
    );
    return result.insertId;
  }

  static async update(id: number, data: Partial<Omit<IBranch, 'id' | 'created_at'>>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.updated_by !== undefined) {
      fields.push('updated_by = ?');
      values.push(data.updated_by);
    }
    fields.push('updated_at = NOW()');

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE erp_branches SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async delete(id: number): Promise<void> {
    // Verificar si tiene dependencias antes de eliminar (opcional)
    await pool.execute('DELETE FROM erp_branches WHERE id = ?', [id]);
  }
}