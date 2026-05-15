import {pool} from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ICreateSale } from '../interfaces/ISale';
import { CashRegisterModel } from './cashRegisterModel';

export class SaleModel {
  /**
   * Crear una nueva venta (ya lo tenías, lo incluimos por completitud)
   */
  static async createSale(saleData: ICreateSale): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Normalizar items: convertir a número
      const itemsNormalized = saleData.items.map(item => ({
        ...item,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        discount: Number(item.discount),
        total: Number(item.total),
      }));

      const saleNumber = `VEN-${Date.now()}`;
      const subtotal = itemsNormalized.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
      const total = itemsNormalized.reduce((acc, item) => acc + item.total, 0);

      const [saleResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO erp_sales (sale_number, branch_id, cash_register_id, customer_id, user_id, sale_date, subtotal, discount, tax, total, payment_method, notes, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleNumber,
          saleData.branch_id,
          saleData.cash_register_id,
          saleData.customer_id || null,
          saleData.user_id,
          saleData.sale_date || new Date(),
          subtotal,
          Number(saleData.discount),
          Number(saleData.tax),
          total,
          saleData.payment_method,
          saleData.notes || null,
          saleData.created_by,
          saleData.created_by,
        ]
      );
      const saleId = saleResult.insertId;

      // Insertar detalles
      for (const item of itemsNormalized) {
        await connection.execute(
          `INSERT INTO erp_sale_details (sale_id, item_type, item_id, quantity, unit_price, discount, total, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            item.item_type,
            item.item_id,
            item.quantity,
            item.unit_price,
            item.discount,
            item.total,
            saleData.created_by,
            saleData.created_by,
          ]
        );

        if (item.item_type === 'product') {
          // Actualizar stock
          await connection.execute(
            `UPDATE erp_stock SET quantity = quantity - ? WHERE product_id = ? AND branch_id = ?`,
            [item.quantity, item.item_id, saleData.branch_id]
          );
          // Registrar movimiento de stock
          await connection.execute(
            `INSERT INTO erp_stock_movements (product_id, branch_id, movement_type, quantity, reason, reference_type, reference_id, created_by, updated_by)
            VALUES (?, ?, 'SALIDA', ?, 'Venta', 'sale', ?, ?, ?)`,
            [item.item_id, saleData.branch_id, -item.quantity, saleId, saleData.created_by, saleData.created_by]
          );
        }
      }

      // Registrar ingreso en caja
      await connection.execute(
        `INSERT INTO erp_cash_movements (cash_register_id, movement_type, amount, concept, reference_type, reference_id, created_by, updated_by)
        VALUES (?, 'INGRESO', ?, 'Venta registrada', 'sale', ?, ?, ?)`,
        [saleData.cash_register_id, total, saleId, saleData.created_by, saleData.created_by]
      );

      await connection.commit();
      return saleId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Listar ventas con filtros opcionales (branch, fechas, paginación)
   */
  static async listSales(filters: {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number; page: number; lastPage: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.full_name as user_name, c.full_name as customer_name
      FROM erp_sales s
      LEFT JOIN erp_users u ON s.user_id = u.id
      LEFT JOIN erp_customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as total FROM erp_sales s WHERE 1=1`;
    //const params: any[] = [];

    if (filters.branch_id) {
      query += ` AND s.branch_id = ${filters.branch_id}`;
      countQuery += ` AND branch_id = ${filters.branch_id}`;
    }

    if (filters.start_date) {
      query += ` AND s.sale_date >= ${filters.start_date}`;
      countQuery += ` AND sale_date >= ${filters.start_date}`;
    }

    if (filters.end_date) {
      query += ` AND s.sale_date <= ${filters.end_date}`;
      countQuery += ` AND sale_date <= ${filters.end_date}`;
    }

    query += ` ORDER BY s.sale_date DESC LIMIT ${limit} OFFSET ${offset}`;
    // Ejecutar consulta de datos
    //console.log('Ejecutando consulta de ventas', { query, countQuery });
    const [rows] = await pool.execute<RowDataPacket[]>(query);
    // Ejecutar consulta de conteo (sin limit/offset)
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery);
    const total = countRows[0]?.total || 0;

    return {
      data: rows,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener una venta completa con sus detalles (incluyendo productos/servicios)
   */
  static async getSaleById(saleId: number): Promise<any | null> {
    // Obtener cabecera
    const [saleRows] = await pool.execute<RowDataPacket[]>(
      `SELECT s.*, u.full_name as user_name, c.full_name as customer_name
       FROM erp_sales s
       LEFT JOIN erp_users u ON s.user_id = u.id
       LEFT JOIN erp_customers c ON s.customer_id = c.id
       WHERE s.id = ?`,
      [saleId]
    );

    if (saleRows.length === 0) return null;
    const sale = saleRows[0];

    // Obtener detalles
    const [detailRows] = await pool.execute<RowDataPacket[]>(
      `SELECT sd.*,
        CASE 
          WHEN sd.item_type = 'product' THEN p.name
          WHEN sd.item_type = 'service' THEN sv.name
        END as item_name,
        CASE 
          WHEN sd.item_type = 'product' THEN p.sku
          ELSE NULL
        END as sku
       FROM erp_sale_details sd
       LEFT JOIN erp_products p ON sd.item_type = 'product' AND sd.item_id = p.id
       LEFT JOIN erp_services sv ON sd.item_type = 'service' AND sd.item_id = sv.id
       WHERE sd.sale_id = ?`,
      [saleId]
    );

    return {
      ...sale,
      details: detailRows,
    };
  }

  /**
   * Cancelar una venta (revierte stock y caja, actualiza estado)
   */
  static async cancelSale(saleId: number, userId: number, reason: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verificar que la venta existe y no está cancelada
      const [saleRows] = await connection.execute<RowDataPacket[]>(
        'SELECT id, branch_id, cash_register_id, total, status FROM erp_sales WHERE id = ? FOR UPDATE',
        [saleId]
      );
      if (saleRows.length === 0) throw new Error('Venta no encontrada');
      const sale = saleRows[0]!;
      if (sale.status === 'cancelled') throw new Error('La venta ya está cancelada');

      // Obtener los detalles de la venta
      const [detailRows] = await connection.execute<RowDataPacket[]>(
        'SELECT item_type, item_id, quantity FROM sale_details WHERE sale_id = ?',
        [saleId]
      );

      // Revertir stock para productos
      for (const item of detailRows) {
        if (item.item_type === 'product') {
          await connection.execute(
            `UPDATE erp_stock SET quantity = quantity + ? WHERE product_id = ? AND branch_id = ?`,
            [item.quantity, item.item_id, sale.branch_id]
          );
          await connection.execute(
            `INSERT INTO erp_stock_movements (product_id, branch_id, movement_type, quantity, reason, reference_type, reference_id, created_by, updated_by)
             VALUES (?, ?, 'ENTRADA', ?, 'Cancelación de venta', 'sale_cancel', ?, ?, ?)`,
            [item.item_id, sale.branch_id, item.quantity, saleId, userId, userId]
          );
        }
      }

      // Revertir movimiento de caja (egreso por la misma cantidad)
      await connection.execute(
        `INSERT INTO erp_cash_movements (cash_register_id, movement_type, amount, concept, reference_type, reference_id, created_by, updated_by)
         VALUES (?, 'EGRESO', ?, 'Cancelación de venta', 'sale_cancel', ?, ?, ?)`,
        [sale.cash_register_id, sale.total, saleId, userId, userId]
      );

      // Actualizar estado de la venta
      await connection.execute(
        `UPDATE erp_sales SET status = 'cancelled', updated_by = ?, updated_at = NOW() WHERE id = ?`,
        [userId, saleId]
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