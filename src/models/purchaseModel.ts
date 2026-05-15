import { stat } from 'fs';
import {pool} from '../config/database';
import { ICreatePurchase } from '../interfaces/IPurchase';

export class PurchaseModel {
  static async createPurchase(data: ICreatePurchase): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [purchaseResult] = await connection.execute(
        `INSERT INTO erp_purchases (purchase_number, supplier_id, branch_id, cash_register_id, user_id, purchase_date, subtotal, discount, tax, total, payment_method, notes, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `COMP-${Date.now()}`,
          data.supplier_id,
          data.branch_id,
          data.cash_register_id,
          data.user_id,
          data.purchase_date || new Date(),
          data.items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0),
          data.discount || 0,
          data.tax || 0,
          data.items.reduce((acc, item) => acc + item.total, 0),
          data.payment_method,
          data.notes || null,
          data.created_by,
          data.created_by,
        ]
      );
      const purchaseId = (purchaseResult as any).insertId;

      for (const item of data.items) {
        await connection.execute(
          `INSERT INTO erp_purchase_details (purchase_id, product_id, quantity, unit_price, total, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [purchaseId, item.product_id, item.quantity, item.unit_price, item.total, data.created_by, data.created_by]
        );

        // Actualizar stock
        await connection.execute(
          `INSERT INTO erp_stock (product_id, branch_id, quantity, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_by = VALUES(updated_by)`,
          [item.product_id, data.branch_id, item.quantity, data.created_by, data.created_by]
        );

        // Registrar movimiento de stock
        await connection.execute(
          `INSERT INTO erp_stock_movements (product_id, branch_id, movement_type, quantity, reason, reference_type, reference_id, created_by, updated_by)
           VALUES (?, ?, 'ENTRADA', ?, 'Compra a proveedor', 'purchase', ?, ?, ?)`,
          [item.product_id, data.branch_id, item.quantity, purchaseId, data.created_by, data.created_by]
        );
      }

      // Registrar egreso en caja
      await connection.execute(
        `INSERT INTO erp_cash_movements (cash_register_id, movement_type, amount, concept, reference_type, reference_id, created_by, updated_by)
         VALUES (?, 'EGRESO', ?, 'Compra a proveedor', 'purchase', ?, ?, ?)`,
        [data.cash_register_id, data.items.reduce((acc, i) => acc + i.total, 0), purchaseId, data.created_by, data.created_by]
      );

      await connection.commit();
      return purchaseId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async listPurchases(filters: { branch_id: number; start_date?: string; end_date?: string; page: number; limit: number }): Promise<any> {
    let query = `
      SELECT p.*, s.name as supplier_name
      FROM erp_purchases p
      JOIN erp_suppliers s ON p.supplier_id = s.id
      WHERE p.branch_id = ${filters.branch_id}
    `;
    
    if (filters.start_date) {
      query += ` AND p.purchase_date >= ${filters.start_date}`;
      
    }
    if (filters.end_date) {
      query += ` AND p.purchase_date <= ${filters.end_date}`;
      
    }
    const offset = (filters.page - 1) * filters.limit;
    const [rows] = await pool.execute(query + ` ORDER BY p.purchase_date DESC LIMIT ${filters.limit} OFFSET ${offset}`);
    const [countRows] = await pool.execute(query.replace('p.*, s.name as supplier_name', 'COUNT(*) as total'));
    return { data: rows, total: (countRows as any[])[0]?.total || 0 };
  }

  static async getPurchaseById(id: number): Promise<any> {
    const [purchaseRows] = await pool.execute(`
      SELECT p.*, s.name as supplier_name
      FROM erp_purchases p
      JOIN erp_suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [id]);
    if ((purchaseRows as any[]).length === 0) return null;
    const purchase = (purchaseRows as any[])[0];
    const [detailsRows] = await pool.execute(`
      SELECT pd.*, pr.name as product_name
      FROM erp_purchase_details pd
      JOIN erp_products pr ON pd.product_id = pr.id
      WHERE pd.purchase_id = ?
    `, [id]);
    //console.log('Detalles de la compra', detailsRows);
    purchase.details = detailsRows;
    return purchase;
  }

  static async updateStatus(id: number, status: string, userId: number): Promise<void> {    
    const allowedStatuses = ['completed', 'cancelled', 'pending', 'paid'];
    if (!allowedStatuses.includes(status)) {
      throw new Error('Estado no válido');
    }
    if (status === 'cancelled') {
      await this.cancelPurchase(id, userId);
      return;
    }
    await pool.execute(
      `UPDATE erp_purchases SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
      [status, userId, id]
    );
  }

  static async cancelPurchase(id: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Obtener detalles para revertir stock
      const [detailsRows] = await connection.execute(
        'SELECT product_id, quantity FROM erp_purchase_details WHERE purchase_id = ?',
        [id]
      );
      //console.log('Revirtiendo compra', { id, userId, details: detailsRows });
      const details = detailsRows as any[];
      for (const detail of details) {
        await connection.execute(
          'UPDATE erp_stock SET quantity = quantity - ? WHERE product_id = ? AND branch_id = (SELECT branch_id FROM erp_purchases WHERE id = ?)',
          [Number(detail.quantity), Number(detail.product_id), id]
        );
        await connection.execute(
          `INSERT INTO erp_stock_movements (product_id, branch_id, movement_type, quantity, reason, reference_type, reference_id, created_by, updated_by)
           VALUES (?, (SELECT branch_id FROM erp_purchases WHERE id = ?), 'SALIDA', ?, 'Cancelación de compra', 'purchase_cancel', ?, ?, ?)`,
          [Number(detail.product_id), id, -Number(detail.quantity), id, userId, userId]
        );
      }
      await connection.execute(
        "UPDATE erp_purchases SET status = 'cancelled', updated_by = ? WHERE id = ?",
        [userId, id]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}