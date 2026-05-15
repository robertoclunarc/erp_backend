export interface IOpenCashRegister {
  branch_id: number;
  opening_amount: number;
  opened_by: number;
}

export interface ICloseCashRegister {
  id: number;
  closing_amount: number;
  closed_by: number;
}
