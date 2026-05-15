import {pool} from '../config/database';

export class StockModel {
  static async getStockByBranch(
    branchId: number,
    filters?: { product_id?: number; lowStockOnly?: boolean }
  ): Promise<any[]> {
    let query = `
      SELECT p.id, p.name, p.sku, p.sale_price, p.min_stock, s.quantity as stock
      FROM erp_products p
      JOIN erp_stock s ON p.id = s.product_id
      WHERE s.branch_id = ? AND p.status = 'active'
    `;
    const params: any[] = [branchId];
    if (filters?.product_id) {
      query += ' AND p.id = ?';
      params.push(filters.product_id);
    }
    if (filters?.lowStockOnly) {
      query += ' AND s.quantity <= p.min_stock';
    }
    query += ' ORDER BY p.name';
    const [rows] = await pool.execute(query, params);
    return rows as any[];
  }

  static async getMovements(
    branchId: number,
    filters?: { product_id?: number; start_date?: string; end_date?: string; page?: number; limit?: number }
  ): Promise<any[]> {
    let query = `
      SELECT sm.*, p.name as product_name
      FROM erp_stock_movements sm
      JOIN erp_products p ON sm.product_id = p.id
      WHERE sm.branch_id = ?
    `;
    const params: any[] = [branchId];
    if (filters?.product_id) {
      query += ' AND sm.product_id = ?';
      params.push(filters.product_id);
    }
    if (filters?.start_date) {
      query += ' AND sm.created_at >= ?';
      params.push(filters.start_date);
    }
    if (filters?.end_date) {
      query += ' AND sm.created_at <= ?';
      params.push(filters.end_date);
    }
    query += ' ORDER BY sm.created_at DESC';
    if (filters?.limit) {
      const offset = ((filters.page || 1) - 1) * filters.limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, offset);
    }
    const [rows] = await pool.execute(query, params);
    return rows as any[];
  }

  static async registerLoss(data: any): Promise<void> {
    const { product_id, branch_id, quantity, reason, created_by, approved_by } = data;
    await pool.execute(
      `INSERT INTO erp_product_losses (product_id, branch_id, quantity, reason, approved_by, created_by, updated_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [product_id, branch_id, quantity, reason, approved_by, created_by, created_by]
    );
  }
}