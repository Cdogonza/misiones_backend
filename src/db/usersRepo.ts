import type { ResultSetHeader } from 'mysql2/promise';

import { pool } from './pool';

export type UsuarioRow = {
  idusuario: number;
  usuario: string;
  correo: string;
  password_hash: string;
  oficina: string;
  rol: 'integrante' | 'admin' | 'superAdmin';
};

export async function findByUsername(username: string): Promise<UsuarioRow | null> {
  const [rows] = await pool.execute(
    `SELECT idusuario, usuario, correo, password_hash, oficina, rol
     FROM usuarios
     WHERE usuario = ?
     LIMIT 1`,
    [username],
  );

  const typed = rows as UsuarioRow[];
  return typed[0] ?? null;
}

export async function findByEmail(email: string): Promise<UsuarioRow | null> {
  const [rows] = await pool.execute(
    `SELECT idusuario, usuario, correo, password_hash, oficina, rol
     FROM usuarios
     WHERE correo = ?
     LIMIT 1`,
    [email],
  );

  const typed = rows as UsuarioRow[];
  return typed[0] ?? null;
}

export async function createUser(params: {
  username: string;
  email: string;
  passwordHash: string;
  oficina: string;
  rol: 'integrante' | 'admin' | 'superAdmin';
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO usuarios (usuario, correo, password_hash, oficina, rol)
     VALUES (?, ?, ?, ?, ?)`,
    [params.username, params.email, params.passwordHash, params.oficina, params.rol],
  );

  return result.insertId;
}

export async function findById(idusuario: number): Promise<UsuarioRow | null> {
  const [rows] = await pool.execute(
    `SELECT idusuario, usuario, correo, password_hash, oficina, rol
     FROM usuarios
     WHERE idusuario = ?
     LIMIT 1`,
    [idusuario],
  );

  const typed = rows as UsuarioRow[];
  return typed[0] ?? null;
}

export async function updateEmail(idusuario: number, newEmail: string): Promise<void> {
  await pool.execute(
    'UPDATE usuarios SET correo = ? WHERE idusuario = ?',
    [newEmail, idusuario],
  );
}

export async function updatePassword(idusuario: number, newPasswordHash: string): Promise<void> {
  await pool.execute(
    'UPDATE usuarios SET password_hash = ? WHERE idusuario = ?',
    [newPasswordHash, idusuario],
  );
}

export async function getAllUsers(oficina?: string): Promise<Pick<UsuarioRow, 'idusuario' | 'usuario' | 'correo' | 'oficina' | 'rol'>[]> {
  let query = 'SELECT idusuario, usuario, correo, oficina, rol FROM usuarios';
  const params: any[] = [];

  if (oficina) {
    query += ' WHERE oficina = ?';
    params.push(oficina);
  }

  const [rows] = await pool.execute(query, params);

  return rows as Pick<UsuarioRow, 'idusuario' | 'usuario' | 'correo' | 'oficina' | 'rol'>[];
}
