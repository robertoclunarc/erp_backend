import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '8h') as NonNullable<SignOptions["expiresIn"]>;

export interface TokenPayload {
  id: number;
  username: string;
  role_id: number;
  branches: number[];
}

/**
 * Genera un token JWT con los datos del usuario
 * @param payload Datos a incluir en el token
 * @returns Token JWT firmado
 */
export function generateToken(payload: TokenPayload): string {  

  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verifica y decodifica un token JWT
 * @param token Token a verificar
 * @returns Payload decodificado o null si es inválido
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}