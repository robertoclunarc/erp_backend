import {pool} from '../config/database';

export class ReportModel {
  static async getSalesByDay(branchId?: string, startDate?: string, endDate?: string) {
    let query = `
      SELECT DATE(sale_date) as date, COUNT(*) as total_sales, SUM(total) as total_amount
      FROM erp_sales
      WHERE status = 'completed'
    `;
    const params: any[] = [];
    if (branchId) {
      query += ' AND branch_id = ?';
      params.push(branchId);
    }
    if (startDate) {
      query += ' AND sale_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND sale_date <= ?';
      params.push(endDate);
    }
    query += ' GROUP BY DATE(sale_date) ORDER BY date DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }
  
  static async getTopProducts(branchId?: string, limit: number = 10) {
    let query = `
      SELECT p.name, SUM(sd.quantity) as total_sold, SUM(sd.total) as total_revenue
      FROM erp_sale_details sd
      JOIN erp_sales s ON sd.sale_id = s.id
      JOIN erp_products p ON sd.item_id = p.id
      WHERE sd.item_type = 'product' AND s.status = 'completed'
    `;
    
    if (branchId) {
      query += ` AND s.branch_id = ${branchId}`;
    }
    query += ` GROUP BY p.id ORDER BY total_sold DESC LIMIT ${limit}`;
    
    const [rows] = await pool.execute(query);
    return rows;
  }
  
  static async getCashRegisterSummary(branchId?: string) {
    let query = `
      SELECT cr.id, cr.opening_amount, cr.closing_amount, cr.difference, cr.status,
             SUM(CASE WHEN cm.movement_type = 'INGRESO' THEN cm.amount ELSE 0 END) as total_income,
             SUM(CASE WHEN cm.movement_type = 'EGRESO' THEN cm.amount ELSE 0 END) as total_expense
      FROM erp_cash_registers cr
      LEFT JOIN erp_cash_movements cm ON cr.id = cm.cash_register_id
    `;
    const params: number[] = [];
    if (branchId) {
      query += ' WHERE cr.branch_id = ?';
      params.push(parseInt(branchId));
    }
    query += ' GROUP BY cr.id ORDER BY cr.created_at DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async getTopServices(params: { branch_id: number; limit: number }): Promise<any[]> {
    const query = `
      SELECT sv.id, sv.name, COUNT(*) as times_sold, SUM(sd.total) as total_revenue
      FROM erp_sale_details sd
      JOIN erp_sales s ON sd.sale_id = s.id
      JOIN erp_services sv ON sd.item_id = sv.id
      WHERE sd.item_type = 'service' AND s.status = 'completed' AND s.branch_id = ?
      GROUP BY sv.id
      ORDER BY times_sold DESC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [params.branch_id, params.limit]);
    return rows as any[];
  }  

  static async getProfitLoss(params: { branch_id: number; start_date?: string; end_date?: string }): Promise<any> {
    // Ingresos por ventas
    let salesQuery = `SELECT SUM(total) as total_sales FROM erp_sales WHERE branch_id = ? AND status = 'completed'`;
    const values: any[] = [params.branch_id];
    if (params.start_date) {
      salesQuery += ' AND sale_date >= ?';
      values.push(params.start_date);
    }
    if (params.end_date) {
      salesQuery += ' AND sale_date <= ?';
      values.push(params.end_date);
    }
    const [salesRows] = await pool.execute(salesQuery, values);
    const totalSales = (salesRows as any[])[0]?.total_sales || 0;

    // Egresos por compras
    let purchasesQuery = `SELECT SUM(total) as total_purchases FROM erp_purchases WHERE branch_id = ? AND status = 'completed'`;
    const purchaseValues: any[] = [params.branch_id];
    if (params.start_date) {
      purchasesQuery += ' AND purchase_date >= ?';
      purchaseValues.push(params.start_date);
    }
    if (params.end_date) {
      purchasesQuery += ' AND purchase_date <= ?';
      purchaseValues.push(params.end_date);
    }
    const [purchaseRows] = await pool.execute(purchasesQuery, purchaseValues);
    const totalPurchases = (purchaseRows as any[])[0]?.total_purchases || 0;

    // Egresos por gastos generales
    let expensesQuery = `SELECT SUM(amount) as total_expenses FROM erp_expenses WHERE branch_id = ?`;
    const expenseValues: any[] = [params.branch_id];
    if (params.start_date) {
      expensesQuery += ' AND expense_date >= ?';
      expenseValues.push(params.start_date);
    }
    if (params.end_date) {
      expensesQuery += ' AND expense_date <= ?';
      expenseValues.push(params.end_date);
    }
    const [expenseRows] = await pool.execute(expensesQuery, expenseValues);
    const totalExpenses = (expenseRows as any[])[0]?.total_expenses || 0;

    return {
      total_sales: totalSales,
      total_purchases: totalPurchases,
      total_expenses: totalExpenses,
      gross_profit: totalSales - totalPurchases,
      net_profit: totalSales - totalPurchases - totalExpenses,
    };
  }

  static async getLowStock(branchId: number): Promise<any[]> {
    const query = `
      SELECT p.id, p.name, p.sku, p.min_stock, s.quantity as current_stock
      FROM erp_products p
      JOIN erp_stock s ON p.id = s.product_id
      WHERE s.branch_id = ? AND p.status = 'active' AND s.quantity <= p.min_stock
      ORDER BY (s.quantity / p.min_stock) ASC
    `;
    const [rows] = await pool.execute(query, [branchId]);
    return rows as any[];
  }
}