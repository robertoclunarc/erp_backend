import { CashRegisterModel } from '../models/cashRegisterModel';

export class CashService {
  static async validateOpenCash(branchId: number): Promise<number> {
    const openCash = await CashRegisterModel.findOpenByBranch(branchId);
    if (!openCash) {
      throw new Error('No hay caja abierta para esta sucursal');
    }
    return openCash.id;
  }
}