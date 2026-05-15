import {pool} from '../config/database';

export class InventoryService {
  static async checkStock(productId: number, branchId: number, requiredQuantity: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT quantity FROM erp_stock WHERE product_id = ? AND branch_id = ?',
      [productId, branchId]
    );
    const stock = (rows as any[])[0]?.quantity || 0;
    return stock >= requiredQuantity;
  }

  static async updateStock(
    productId: number,
    branchId: number,
    quantityChange: number,
    userId: number,
    reason: string,
    referenceType: string,
    referenceId: number | null
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `INSERT INTO erp_stock (product_id, branch_id, quantity, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_by = VALUES(updated_by)`,
        [productId, branchId, quantityChange, userId, userId]
      );
      await connection.execute(
        `INSERT INTO erp_stock_movements (product_id, branch_id, movement_type, quantity, reason, reference_type, reference_id, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          branchId,
          quantityChange > 0 ? 'ENTRADA' : 'SALIDA',
          quantityChange,
          reason,
          referenceType,
          referenceId,
          userId,
          userId,
        ]
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