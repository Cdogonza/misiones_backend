import type { ResultSetHeader } from 'mysql2/promise';

import { pool } from './pool';

export type EquipoRow = {
  codigo_equipo: number;
  equipo: string;
};

export async function listEquipos(): Promise<EquipoRow[]> {
  const [rows] = await pool.execute(
    `SELECT codigo_equipo, equipo
     FROM equipos
     ORDER BY codigo_equipo ASC`,
  );
  return rows as EquipoRow[];
}

export async function getEquipoById(codigo_equipo: number): Promise<EquipoRow | null> {
  const [rows] = await pool.execute(
    `SELECT codigo_equipo, equipo
     FROM equipos
     WHERE codigo_equipo = ?
     LIMIT 1`,
    [codigo_equipo],
  );
  const typed = rows as EquipoRow[];
  return typed[0] ?? null;
}

export async function listEquiposByIds(codigos: number[]): Promise<Map<number, EquipoRow>> {
  const map = new Map<number, EquipoRow>();
  if (codigos.length === 0) return map;
  const placeholders = codigos.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT codigo_equipo, equipo
     FROM equipos
     WHERE codigo_equipo IN (${placeholders})
     ORDER BY codigo_equipo ASC`,
    codigos,
  );
  for (const row of rows as EquipoRow[]) {
    map.set(row.codigo_equipo, row);
  }
  return map;
}

export async function createEquipo(equipo: string): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO equipos (equipo)
     VALUES (?)`,
    [equipo],
  );
  return result.insertId;
}

export async function updateEquipo(codigo_equipo: number, equipo: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE equipos
     SET equipo = ?
     WHERE codigo_equipo = ?`,
    [equipo, codigo_equipo],
  );
  return result.affectedRows > 0;
}

export async function deleteEquipo(codigo_equipo: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM equipos
     WHERE codigo_equipo = ?`,
    [codigo_equipo],
  );
  return result.affectedRows > 0;
}

/** Equipos que tienen al menos un componente asociado a la unidad indicada. */
export async function listEquiposByUnidad(codigo_unidad: number): Promise<EquipoRow[]> {
  const [rows] = await pool.execute(
    `SELECT DISTINCT e.codigo_equipo, e.equipo
     FROM equipos e
     INNER JOIN componentes c ON c.codigo_equipo = e.codigo_equipo
     WHERE c.codigo_unidad = ?
     ORDER BY e.codigo_equipo ASC`,
    [codigo_unidad],
  );
  return rows as EquipoRow[];
}

