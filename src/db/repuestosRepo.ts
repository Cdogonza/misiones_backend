import type { ResultSetHeader } from 'mysql2/promise';
import { pool } from './pool';

export type RepuestoRow = {
  idrepuestos: number;
  nombre: string | null;
  descripcion: string | null;
  costo: number | null;
};

export type RepuestoInput = Omit<RepuestoRow, 'idrepuestos'>;

export async function listRepuestos(): Promise<RepuestoRow[]> {
  const [rows] = await pool.execute(
    'SELECT * FROM repuestos ORDER BY idrepuestos DESC'
  );
  return rows as RepuestoRow[];
}

export async function getRepuestoById(id: number): Promise<RepuestoRow | null> {
  const [rows] = await pool.execute(
    'SELECT * FROM repuestos WHERE idrepuestos = ? LIMIT 1',
    [id]
  );
  const typed = rows as RepuestoRow[];
  return typed[0] ?? null;
}

export async function createRepuesto(data: RepuestoInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO repuestos (nombre, descripcion, costo) VALUES (?, ?, ?)',
    [data.nombre, data.descripcion, data.costo]
  );
  return result.insertId;
}

export async function updateRepuesto(id: number, data: RepuestoInput): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE repuestos SET nombre = ?, descripcion = ?, costo = ? WHERE idrepuestos = ?',
    [data.nombre, data.descripcion, data.costo, id]
  );
  return result.affectedRows > 0;
}

export async function deleteRepuesto(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM repuestos WHERE idrepuestos = ?',
    [id]
  );
  return result.affectedRows > 0;
}
