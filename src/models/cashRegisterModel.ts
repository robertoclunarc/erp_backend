import {pool} from '../config/database';
import { IOpenCashRegister, ICloseCashRegister } from '../interfaces/ICashRegister';

export class CashRegisterModel {
  static async findOpenByBranch(branchId: number): Promise<any | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM erp_cash_registers WHERE branch_id = ? AND status = 'open'`,
      [branchId]
    );
    return (rows as any[])[0] || null;
  }

  static async open(data: IOpenCashRegister): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO erp_cash_registers (branch_id, opening_amount, opened_by, created_by, updated_by, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [data.branch_id, data.opening_amount, data.opened_by, data.opened_by, data.opened_by]
    );
    return (result as any).insertId;
  }

  static async close(data: ICloseCashRegister): Promise<void> {
    const [cashReg] = await pool.execute(
      'SELECT opening_amount FROM erp_cash_registers WHERE id = ?',
      [data.id]
    );
    const openingAmount = (cashReg as any[])[0]?.opening_amount;
    const difference = data.closing_amount - openingAmount;
    
    await pool.execute(
      `UPDATE erp_cash_registers 
       SET closing_amount = ?, difference = ?, status = 'closed', closed_at = NOW(), closed_by = ?, updated_by = ?
       WHERE id = ?`,
      [data.closing_amount, difference, data.closed_by, data.closed_by, data.id]
    );
  }

  static async addMovement(cashRegisterId: number, movementType: 'INGRESO' | 'EGRESO', amount: number, concept: string, referenceType: string | null, referenceId: number | null, createdBy: number): Promise<void> {
    await pool.execute(
      `INSERT INTO erp_cash_movements (cash_register_id, movement_type, amount, concept, reference_type, reference_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cashRegisterId, movementType, amount, concept, referenceType, referenceId, createdBy, createdBy]
    );
  }

  static async findById(id: number): Promise<any | null> {
    const [rows] = await pool.execute('SELECT * FROM erp_cash_registers WHERE id = ?', [id]);
    return (rows as any[])[0] || null;
  }

  static async getMovements(cashRegisterId: number): Promise<any[]> {
    const query = `SELECT id, movement_type, amount, concept, reference_type, reference_id, 
              payment_method, created_at, created_by
       FROM erp_cash_movements 
       WHERE cash_register_id = ${cashRegisterId}  
       ORDER BY created_at DESC`;
    const [rows] = await pool.execute(query);
    //console.log('query movements for cash register', query);
    return rows as any[];
  }
}