import {pool} from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface ISupplier {
  id: number;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  created_by: number;
  created_at: Date;
  updated_by: number;
  updated_at: Date;
}

export class SupplierModel {
  static async list(): Promise<ISupplier[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM erp_suppliers ORDER BY name'
    );
    return rows as ISupplier[];
  }

  static async findById(id: number): Promise<ISupplier | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM erp_suppliers WHERE id = ?',
      [id]
    );
    return rows[0] as ISupplier || null;
  }

  static async create(data: Omit<ISupplier, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const { name, contact_name, phone, email, address, tax_id, created_by, updated_by } = data;
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO erp_suppliers 
        (name, contact_name, phone, email, address, tax_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, contact_name, phone, email, address, tax_id, created_by, updated_by]
    );
    return result.insertId;
  }

  static async update(id: number, data: Partial<Omit<ISupplier, 'id' | 'created_at'>>, updatedBy: number): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.contact_name !== undefined) { fields.push('contact_name = ?'); values.push(data.contact_name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.tax_id !== undefined) { fields.push('tax_id = ?'); values.push(data.tax_id); }
    fields.push('updated_by = ?, updated_at = NOW()');
    values.push(updatedBy);
    values.push(id);

    await pool.execute(
      `UPDATE erp_suppliers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async delete(id: number): Promise<void> {
    // Verificar si tiene dependencias (por ejemplo, compras) antes de eliminar
    const [purchases] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM erp_purchases WHERE supplier_id = ? LIMIT 1',
      [id]
    );
    if (purchases.length > 0) {
      throw new Error('No se puede eliminar el proveedor porque tiene compras asociadas');
    }
    await pool.execute('DELETE FROM erp_suppliers WHERE id = ?', [id]);
  }
}