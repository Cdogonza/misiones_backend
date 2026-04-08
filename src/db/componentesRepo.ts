import type { ResultSetHeader } from 'mysql2/promise';

import { pool } from './pool';

export type ComponenteRow = {
  codigo_componente: number;
  codigo_equipo: number;
  componente: string;
  serie: string | null;
  total: number | null;
  codigo_unidad: number | null;
  ubicacion: string | null;
  estado: string | null;
  Nro_alta: string | null;
  Nro_baja: string | null;
  lugar: string | null;
  clasificacion: string | null;
  observacion: string | null;
  equipo?: string;
};

export type ComponenteInput = Omit<ComponenteRow, 'codigo_componente'>;

export async function listComponentes(): Promise<ComponenteRow[]> {
  const [rows] = await pool.execute(
    `SELECT c.codigo_componente, c.codigo_equipo, c.componente, c.serie, c.total, c.codigo_unidad, c.ubicacion, c.estado,
            c.Nro_alta, c.Nro_baja, c.lugar, c.clasificacion, c.observacion,
            e.equipo
     FROM componentes c
     JOIN equipos e ON c.codigo_equipo = e.codigo_equipo
     ORDER BY c.codigo_componente ASC`,
  );
  return rows as ComponenteRow[];
}

export async function listComponentesByEquipo(codigo_equipo: number): Promise<ComponenteRow[]> {
  const [rows] = await pool.execute(
    `SELECT c.codigo_componente, c.codigo_equipo, c.componente, c.serie, c.total, c.codigo_unidad, c.ubicacion, c.estado,
            c.Nro_alta, c.Nro_baja, c.lugar, c.clasificacion, c.observacion,
            e.equipo
     FROM componentes c
     JOIN equipos e ON c.codigo_equipo = e.codigo_equipo
     WHERE c.codigo_equipo = ?
     ORDER BY c.codigo_componente ASC`,
    [codigo_equipo],
  );
  return rows as ComponenteRow[];
}

export async function listComponentesByUnidad(codigo_unidad: number): Promise<ComponenteRow[]> {
  const [rows] = await pool.execute(
    `SELECT c.codigo_componente, c.codigo_equipo, c.componente, c.serie, c.total, c.codigo_unidad, c.ubicacion, c.estado,
            c.Nro_alta, c.Nro_baja, c.lugar, c.clasificacion, c.observacion,
            e.equipo
     FROM componentes c
     JOIN equipos e ON c.codigo_equipo = e.codigo_equipo
     WHERE c.codigo_unidad = ?
     ORDER BY c.codigo_componente ASC`,
    [codigo_unidad],
  );
  return rows as ComponenteRow[];
}

export async function countComponentesByUnidad(codigo_unidad: number): Promise<number> {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as total
     FROM componentes
     WHERE codigo_unidad = ?`,
    [codigo_unidad],
  );
  const typed = rows as Array<{ total: number }>;
  return typed[0]?.total ?? 0;
}

export async function getComponenteById(codigo_componente: number): Promise<ComponenteRow | null> {
  const [rows] = await pool.execute(
    `SELECT c.codigo_componente, c.codigo_equipo, c.componente, c.serie, c.total, c.codigo_unidad, c.ubicacion, c.estado,
            c.Nro_alta, c.Nro_baja, c.lugar, c.clasificacion, c.observacion,
            e.equipo
     FROM componentes c
     JOIN equipos e ON c.codigo_equipo = e.codigo_equipo
     WHERE c.codigo_componente = ?
     LIMIT 1`,
    [codigo_componente],
  );
  return (rows as ComponenteRow[])[0] ?? null;
}

export async function createComponente(input: ComponenteInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO componentes
     (codigo_equipo, componente, serie, total, codigo_unidad, ubicacion, estado, Nro_alta, Nro_baja, lugar, clasificacion, observacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.codigo_equipo,
      input.componente,
      input.serie,
      input.total,
      input.codigo_unidad,
      input.ubicacion,
      input.estado,
      input.Nro_alta,
      input.Nro_baja,
      input.lugar,
      input.clasificacion,
      input.observacion,
    ],
  );
  return result.insertId;
}

export async function updateComponente(
  codigo_componente: number,
  input: ComponenteInput,
): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE componentes
     SET codigo_equipo = ?, componente = ?, serie = ?, total = ?, codigo_unidad = ?, ubicacion = ?, estado = ?,
         Nro_alta = ?, Nro_baja = ?, lugar = ?, clasificacion = ?, observacion = ?
     WHERE codigo_componente = ?`,
    [
      input.codigo_equipo,
      input.componente,
      input.serie,
      input.total,
      input.codigo_unidad,
      input.ubicacion,
      input.estado,
      input.Nro_alta,
      input.Nro_baja,
      input.lugar,
      input.clasificacion,
      input.observacion,
      codigo_componente,
    ],
  );
  return result.affectedRows > 0;
}

export async function deleteComponente(codigo_componente: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM componentes
     WHERE codigo_componente = ?`,
    [codigo_componente],
  );
  return result.affectedRows > 0;
}

export async function countComponentesByEquipo(codigo_equipo: number): Promise<number> {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as total
     FROM componentes
     WHERE codigo_equipo = ?`,
    [codigo_equipo],
  );

  const typed = rows as Array<{ total: number }>;
  return typed[0]?.total ?? 0;
}

