import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña en texto plano
 * @param password Contraseña sin hash
 * @returns Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con su hash almacenado
 * @param password Contraseña en texto plano
 * @param hash Hash almacenado
 * @returns true si coinciden, false en caso contrario
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}