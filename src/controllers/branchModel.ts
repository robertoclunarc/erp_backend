import pool from '../config/database';

export class BranchModel {
  static async list(): Promise<any[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM branches WHERE status = "active" ORDER BY name'
    );
    return rows as any[];
  }

  static async findById(id: number): Promise<any | null> {
    const [rows] = await pool.execute('SELECT * FROM branches WHERE id = ?', [id]);
    return (rows as any[])[0] || null;
  }

  static async create(data: any): Promise<number> {
    const { name, address, phone, email, created_by } = data;
    const [result] = await pool.execute(
      `INSERT INTO branches (name, address, phone, email, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, address, phone, email, created_by, created_by]
    );
    return (result as any).insertId;
  }

  static async update(id: number, data: any, updated_by: number): Promise<void> {
    const fields = [];
    const values = [];
    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.address) { fields.push('address = ?'); values.push(data.address); }
    if (data.phone) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.status) { fields.push('status = ?'); values.push(data.status); }
    fields.push('updated_by = ?');
    values.push(updated_by);
    values.push(id);
    await pool.execute(`UPDATE branches SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async delete(id: number, updated_by: number): Promise<void> {
    await pool.execute(
      'UPDATE branches SET status = "inactive", updated_by = ? WHERE id = ?',
      [updated_by, id]
    );
  }
}