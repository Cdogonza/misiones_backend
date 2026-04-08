import type { ResultSetHeader } from 'mysql2/promise';

import { pool } from './pool';

export type UnidadRow = {
  codigo_unidad: number;
  unidad: string;
  nombre_de_la_unidad: string;
  ambito: string | null;
};

export type UnidadInput = Omit<UnidadRow, 'codigo_unidad'>;

export async function listUnidades(): Promise<UnidadRow[]> {
  const [rows] = await pool.execute(
    `SELECT codigo_unidad, unidad, nombre_de_la_unidad, ambito
     FROM unidades
     ORDER BY codigo_unidad ASC`,
  );
  return rows as UnidadRow[];
}

export async function getUnidadById(codigo_unidad: number): Promise<UnidadRow | null> {
  const [rows] = await pool.execute(
    `SELECT codigo_unidad, unidad, nombre_de_la_unidad, ambito
     FROM unidades
     WHERE codigo_unidad = ?
     LIMIT 1`,
    [codigo_unidad],
  );
  const typed = rows as UnidadRow[];
  return typed[0] ?? null;
}

export async function createUnidad(input: UnidadInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO unidades (unidad, nombre_de_la_unidad, ambito)
     VALUES (?, ?, ?)`,
    [input.unidad, input.nombre_de_la_unidad, input.ambito],
  );
  return result.insertId;
}

export async function updateUnidad(codigo_unidad: number, input: UnidadInput): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE unidades
     SET unidad = ?, nombre_de_la_unidad = ?, ambito = ?
     WHERE codigo_unidad = ?`,
    [input.unidad, input.nombre_de_la_unidad, input.ambito, codigo_unidad],
  );
  return result.affectedRows > 0;
}

export async function deleteUnidad(codigo_unidad: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM unidades
     WHERE codigo_unidad = ?`,
    [codigo_unidad],
  );
  return result.affectedRows > 0;
}
