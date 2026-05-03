import type { ResultSetHeader } from 'mysql2/promise';
import { pool } from './pool';

export type MantenimientoRow = {
  id_mantenimiento: number;
  id_boleta: string | null;
  fecha_entrada: string | null;
  equipo: string | null;
  marca: string | null;
  nro_serie: string | null;
  procedencia: string | null;
  entrega: string | null;
  recibe: string | null;
  tel_contacto: number | null;
  calidad: string | null;
  desc_inicial: string | null;
  ubicacion: string | null;
  estado: string | null;
  presupuesto: string | null;
  desc_final: string | null;
  tecnico: string | null;
  fecha_final: string | null;
};

export type MantenimientoInput = Omit<MantenimientoRow, 'id_mantenimiento'>;

export async function listMantenimientos(): Promise<MantenimientoRow[]> {
  const [rows] = await pool.execute(
    'SELECT * FROM mantenimiento ORDER BY id_mantenimiento DESC'
  );
  return rows as MantenimientoRow[];
}

export async function getMantenimientoById(id: number): Promise<MantenimientoRow | null> {
  const [rows] = await pool.execute(
    'SELECT * FROM mantenimiento WHERE id_mantenimiento = ? LIMIT 1',
    [id]
  );
  const typed = rows as MantenimientoRow[];
  return typed[0] ?? null;
}

export async function searchMantenimientos(filters: {
  equipo?: string;
  procedencia?: string;
  ubicacion?: string;
}): Promise<MantenimientoRow[]> {
  let query = 'SELECT * FROM mantenimiento WHERE 1=1';
  const params: any[] = [];

  if (filters.equipo) {
    query += ' AND equipo LIKE ?';
    params.push(`%${filters.equipo}%`);
  }
  if (filters.procedencia) {
    query += ' AND procedencia LIKE ?';
    params.push(`%${filters.procedencia}%`);
  }
  if (filters.ubicacion) {
    query += ' AND ubicacion LIKE ?';
    params.push(`%${filters.ubicacion}%`);
  }

  query += ' ORDER BY id_mantenimiento DESC';

  const [rows] = await pool.execute(query, params);
  return rows as MantenimientoRow[];
}

export async function createMantenimiento(data: MantenimientoInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO mantenimiento (
      id_boleta, fecha_entrada, equipo, marca, nro_serie, procedencia, entrega, recibe, 
      tel_contacto, calidad, desc_inicial, ubicacion, estado, presupuesto, desc_final, tecnico, fecha_final
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id_boleta, data.fecha_entrada, data.equipo, data.marca, data.nro_serie, data.procedencia, 
      data.entrega, data.recibe, data.tel_contacto, data.calidad, data.desc_inicial, data.ubicacion, 
      data.estado, data.presupuesto, data.desc_final, data.tecnico, data.fecha_final
    ]
  );
  return result.insertId;
}

export async function updateMantenimiento(id: number, data: Partial<MantenimientoInput>): Promise<boolean> {
  const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
  if (fields.length === 0) return false;

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => (data as any)[field]);

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE mantenimiento SET ${setClause} WHERE id_mantenimiento = ?`,
    [...values, id]
  );
  return result.affectedRows > 0;
}

export async function deleteMantenimiento(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM mantenimiento WHERE id_mantenimiento = ?',
    [id]
  );
  return result.affectedRows > 0;
}

export async function updateMantenimientoPresupuesto(id: number, tecnico: string, presupuesto: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE mantenimiento SET tecnico = ?, presupuesto = ? WHERE id_mantenimiento = ?',
    [tecnico, presupuesto, id]
  );
  return result.affectedRows > 0;
}
