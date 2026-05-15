export interface ISaleDetailItem {
  item_type: 'product' | 'service';
  item_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface ICreateSale {
  branch_id: number;
  cash_register_id: number;
  customer_id?: number;
  user_id: number;
  sale_date?: Date;
  discount: number;
  tax: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'mixed';
  items: ISaleDetailItem[];
  notes?: string;
  created_by: number;
}
