import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  // bcrypt con coste razonable para producción
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

