export interface IPurchaseDetailItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ICreatePurchase {
  supplier_id: number;
  branch_id: number;
  cash_register_id: number;
  user_id: number;
  purchase_date?: Date;
  discount: number;
  tax: number;
  payment_method: 'cash' | 'card' | 'transfer';
  items: IPurchaseDetailItem[];
  notes?: string;
  created_by: number;
}