import type { ResultSetHeader } from 'mysql2/promise';
import { pool } from './pool';

export type MantenimientoRepuestoRow = {
  id_mantenimiento_repuestos: number;
  id_mantenimiento: number;
  id_repuesto: number;
  cantidad: number;
  costo_unitario: number;
  nombre?: string;
  descripcion?: string;
};

export type MantenimientoRepuestoInput = {
  id_repuesto: number;
  cantidad: number;
  costo_unitario: number;
};

export async function addRepuestosToMantenimiento(id_mantenimiento: number, items: MantenimientoRepuestoInput[]): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const query = 'INSERT INTO mantenimiento_repuestos (id_mantenimiento, id_repuesto, cantidad, costo_unitario) VALUES (?, ?, ?, ?)';
    for (const item of items) {
      await connection.execute(query, [id_mantenimiento, item.id_repuesto, item.cantidad, item.costo_unitario]);
    }
    
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function getRepuestosByMantenimiento(id_mantenimiento: number): Promise<MantenimientoRepuestoRow[]> {
  const [rows] = await pool.execute(
    `SELECT mr.*, r.nombre, r.descripcion 
     FROM mantenimiento_repuestos mr
     JOIN repuestos r ON mr.id_repuesto = r.idrepuestos
     WHERE mr.id_mantenimiento = ?`,
    [id_mantenimiento]
  );
  return rows as MantenimientoRepuestoRow[];
}

export async function deleteRepuestosFromMantenimiento(id_mantenimiento: number): Promise<void> {
  await pool.execute(
    'DELETE FROM mantenimiento_repuestos WHERE id_mantenimiento = ?',
    [id_mantenimiento]
  );
}
