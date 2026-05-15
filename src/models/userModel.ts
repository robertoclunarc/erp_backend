import {pool} from '../config/database';
import { IUser, ICreateUser } from '../interfaces/IUser';
import bcrypt from 'bcrypt';

export class UserModel {
  static async findByUsername(username: string): Promise<IUser | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM erp_users WHERE username = ? AND status = 'active'",
      [username]
    );
    const users = rows as IUser[];
    return users[0] || null;
  }

  static async findById(id: number): Promise<IUser | null> {
    const [rows] = await pool.execute(
      `SELECT u.*, GROUP_CONCAT(DISTINCT ub.branch_id) as branch_ids
      FROM erp_users u
      LEFT JOIN erp_user_branches ub ON u.id = ub.user_id
      WHERE u.id = ?
      GROUP BY u.id`,
      [id]
    );
    if ((rows as any[]).length === 0) return null;
    const user = (rows as any[])[0];
    return {
      ...user,
      branches: user.branch_ids ? user.branch_ids.split(',').map(Number) : []
    } as IUser;
  }

  static async getUserBranches(userId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      'SELECT branch_id FROM erp_user_branches WHERE user_id = ?',
      [userId]
    );
    return (rows as { branch_id: number }[]).map(row => row.branch_id);
  }

  static async create(userData: ICreateUser): Promise<number> {
    const { username, email, password, full_name, role_id, branches, created_by } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.execute(
        `INSERT INTO erp_users (username, email, password_hash, full_name, role_id, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, full_name, role_id, created_by, created_by]
      );
      const userId = (result as any).insertId;
      
      // Asignar sucursales
      for (const branchId of branches) {
        await connection.execute(
          `INSERT INTO erp_user_branches (user_id, branch_id, created_by, updated_by)
           VALUES (?, ?, ?, ?)`,
          [userId, branchId, created_by, created_by]
        );
      }
      
      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, data: Partial<ICreateUser>, updated_by: number): Promise<void> {
    const fields = [];
    const values = [];    
    if (data.full_name) { fields.push('full_name = ?'); values.push(data.full_name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.role_id) { fields.push('role_id = ?'); values.push(data.role_id); }
    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 10);
      fields.push('password_hash = ?');
      values.push(hashed);
    }
    fields.push('updated_by = ?');
    values.push(updated_by);
    values.push(id);
    
    await pool.execute(
      `UPDATE erp_users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    // Actualizar sucursales si se enviaron
    if (data.branches) {
      await pool.execute('DELETE FROM erp_user_branches WHERE user_id = ?', [id]);
      for (const branchId of data.branches) {
        await pool.execute(
          'INSERT INTO erp_user_branches (user_id, branch_id, created_by, updated_by) VALUES (?, ?, ?, ?)',
          [id, branchId, updated_by, updated_by]
        );
      }
    }
  }

  static async list(filters?: { role_id?: number; branch_id?: number }): Promise<IUser[]> {
    let query = `
      SELECT 
        u.*,
        GROUP_CONCAT(DISTINCT ub.branch_id) as branch_ids
      FROM erp_users u
      LEFT JOIN erp_user_branches ub ON u.id = ub.user_id
      WHERE 1=1
    `;    

    if (filters?.role_id) {
      query += ` AND u.role_id = ${filters.role_id}`;      
    }
    if (filters?.branch_id) {
      query += ` AND ub.branch_id = ${filters.branch_id}`;
    }

    query += ' GROUP BY u.id ORDER BY u.id DESC';

    const [rows] = await pool.execute(query);
    
    // Convertir branch_ids (string con comas) a array de números
    const users = (rows as any[]).map(row => ({
      ...row,
      branches: row.branch_ids ? row.branch_ids.split(',').map(Number) : []
    }));

    return users as IUser[];
  }
}