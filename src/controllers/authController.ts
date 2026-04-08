import type { Request, Response } from 'express';

import { HttpError } from '../utils/httpError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword, verifyPassword } from '../utils/password';
import { writeHistorial } from '../db/historialRepo';
import { createUser, findByEmail, findByUsername } from '../db/usersRepo';
import { signToken } from '../services/jwtService';
import type { LoginBody, RegisterBody } from '../types/auth';
import { VALORES_OFICINAS } from '../utils/constants';

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `Campo inválido: ${fieldName}`);
  }
  return value.trim();
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'superAdmin')) {
    throw new HttpError(403, 'Solo los administradores pueden crear usuarios');
  }

  const body = req.body as Partial<RegisterBody>;

  const email = assertString(body.email, 'email');
  const username = assertString(body.username, 'username');
  const password = assertString(body.password, 'password');
  const oficina = assertString(body.oficina, 'oficina');
  
  if (!VALORES_OFICINAS.includes(oficina as any)) {
    throw new HttpError(400, 'La oficina seleccionada no es válida');
  }

  const rol = (body.rol === 'admin' || body.rol === 'integrante' || body.rol === 'superAdmin') ? body.rol : 'integrante';

  // Si no es superAdmin, no puede crear superAdmins
  if (rol === 'superAdmin' && currentUser.rol !== 'superAdmin') {
    throw new HttpError(403, 'No tienes permiso para crear un superAdmin');
  }

  if (currentUser.rol !== 'superAdmin' && oficina !== currentUser.oficina) {
    throw new HttpError(403, 'Solo puedes crear usuarios para tu misma oficina');
  }

  if (password.length < 6) {
    throw new HttpError(400, 'La password debe tener al menos 6 caracteres');
  }

  const [existingUser, existingEmail] = await Promise.all([
    findByUsername(username),
    findByEmail(email),
  ]);

  if (existingUser) throw new HttpError(409, 'El nombre de usuario ya existe');
  if (existingEmail) throw new HttpError(409, 'El correo ya existe');

  const passwordHash = await hashPassword(password);
  const idusuario = await createUser({ username, email, passwordHash, oficina, rol });

  await writeHistorial({
    usuario: username,
    email,
    evento: 'se registró',
  });

  return res.status(201).json({
    idusuario,
    username,
    email,
    oficina,
    rol
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<LoginBody>;

  const username = assertString(body.username, 'username');
  const password = assertString(body.password, 'password');

  const user = await findByUsername(username);
  if (!user) {
    throw new HttpError(401, 'Usuario no registrado. Usa /api/auth/register');
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const token = signToken({ 
    sub: user.idusuario, 
    usuario: user.usuario,
    oficina: user.oficina,
    rol: user.rol
  });

  await writeHistorial({
    usuario: user.usuario,
    email: user.correo,
    evento: 'se logueó',
  });

  return res.json({ token });
});

