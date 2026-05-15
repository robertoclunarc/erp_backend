export interface IProduct {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category_id: number;
  category_name?: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  current_stock: number;
  status: 'active' | 'inactive';
  created_at: Date;
}