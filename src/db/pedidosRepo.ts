import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';

import { pool } from './pool';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EstadoPedido = 'pendiente' | 'aprobado' | 'rechazado' | 'entregado';

export type PedidoDetalleInput = {
  codigo_componente: number;
  cantidad: number;
};

export type PedidoRow = {
  idpedido: number;
  idusuario: number;
  estado: EstadoPedido;
  created_at: Date;
  // joined fields
  usuario?: string;
  correo?: string;
  oficina?: string;
};

export type PedidoDetalleRow = {
  iddetalle: number;
  idpedido: number;
  codigo_componente: number;
  cantidad: number;
  // optional joined field
  componente?: string;
};

export type PedidoConDetalle = PedidoRow & {
  detalle: PedidoDetalleRow[];
};

// ─── Repo functions ───────────────────────────────────────────────────────────

/**
 * Crea un pedido con su detalle en una sola transacción.
 * Retorna el idpedido generado.
 */
export async function createPedido(
  idusuario: number,
  items: PedidoDetalleInput[],
): Promise<number> {
  const conn: PoolConnection = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Cabecera
    const [headerResult] = await conn.execute<ResultSetHeader>(
      `INSERT INTO pedidos (idusuario, estado) VALUES (?, 'pendiente')`,
      [idusuario],
    );
    const idpedido = headerResult.insertId;

    // 2) Detalle (bulk insert de cada ítem)
    for (const item of items) {
      await conn.execute<ResultSetHeader>(
        `INSERT INTO pedidos_detalle (idpedido, codigo_componente, cantidad) VALUES (?, ?, ?)`,
        [idpedido, item.codigo_componente, item.cantidad],
      );
    }

    await conn.commit();
    return idpedido;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Lista todos los pedidos con datos del usuario (para admin).
 */
export async function listAllPedidos(): Promise<PedidoRow[]> {
  const [rows] = await pool.execute(
    `SELECT p.idpedido, p.idusuario, p.estado, p.created_at,
            u.usuario, u.correo, u.oficina
     FROM pedidos p
     JOIN usuarios u ON p.idusuario = u.idusuario
     ORDER BY p.created_at DESC`,
  );
  return rows as PedidoRow[];
}

/**
 * Lista los pedidos de un usuario específico.
 */
export async function listPedidosByUsuario(idusuario: number): Promise<PedidoRow[]> {
  const [rows] = await pool.execute(
    `SELECT p.idpedido, p.idusuario, p.estado, p.created_at,
            u.usuario, u.correo, u.oficina
     FROM pedidos p
     JOIN usuarios u ON p.idusuario = u.idusuario
     WHERE p.idusuario = ?
     ORDER BY p.created_at DESC`,
    [idusuario],
  );
  return rows as PedidoRow[];
}

/**
 * Obtiene el detalle de ítems de un pedido.
 */
export async function getDetallePedido(idpedido: number): Promise<PedidoDetalleRow[]> {
  const [rows] = await pool.execute(
    `SELECT pd.iddetalle, pd.idpedido, pd.codigo_componente, pd.cantidad,
            c.componente
     FROM pedidos_detalle pd
     JOIN componentes c ON pd.codigo_componente = c.codigo_componente
     WHERE pd.idpedido = ?`,
    [idpedido],
  );
  return rows as PedidoDetalleRow[];
}

/**
 * Obtiene un pedido por id (sin detalle).
 */
export async function getPedidoById(idpedido: number): Promise<PedidoRow | null> {
  const [rows] = await pool.execute(
    `SELECT p.idpedido, p.idusuario, p.estado, p.created_at,
            u.usuario, u.correo, u.oficina
     FROM pedidos p
     JOIN usuarios u ON p.idusuario = u.idusuario
     WHERE p.idpedido = ?
     LIMIT 1`,
    [idpedido],
  );
  return (rows as PedidoRow[])[0] ?? null;
}

/**
 * Actualiza el estado de un pedido. Retorna true si se modificó alguna fila.
 */
export async function updateEstadoPedido(
  idpedido: number,
  estado: EstadoPedido,
): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE pedidos SET estado = ? WHERE idpedido = ?`,
    [estado, idpedido],
  );
  return result.affectedRows > 0;
}
