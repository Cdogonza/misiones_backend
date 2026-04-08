import { sign, verify } from 'jsonwebtoken';

import { env } from '../config/env';
import type { JwtPayload } from '../types/auth';

export function signToken(payload: JwtPayload): string {
  // Cast a any para evitar un choque de tipados entre versiones de `jsonwebtoken` y TS.
  return sign(payload as any, env.jwtSecret as any, { expiresIn: env.jwtExpiresIn } as any) as string;
}

export function verifyToken(token: string): JwtPayload {
  const decoded = verify(token, env.jwtSecret as any);
  if (typeof decoded === 'string') throw new Error('Invalid JWT payload');
  return decoded as unknown as JwtPayload;
}

