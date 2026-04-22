import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';

import { pool } from './pool';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EstadoPedido = 'pendiente' | 'aprobado' | 'rechazado' | 'entregado' | 'devuelto';

export type PedidoDetalleInput = {
  codigo_componente: number;
  cantidad: number;
};

export type PedidoRow = {
  idpedido: number;
  idusuario: number;
  estado: EstadoPedido;
  fecha_pedido: Date;
  codigo_unidad_destino?: number | null;
  fecha_inicio?: Date | null;
  fecha_fin?: Date | null;
  observaciones?: string | null;
  // joined fields
  usuario?: string;
  correo?: string;
  oficina?: string;
  unidad_destino_nombre?: string;
};

export type PedidoDetalleRow = {
  idpedido_detalle: number;
  idpedido: number;
  codigo_componente: number;
  cantidad: number;
  // optional joined field
  componente?: string;
  serie?: string;
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
  config: {
    codigo_unidad_destino?: number | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    observaciones?: string | null;
  } = {}
): Promise<number> {
  const conn: PoolConnection = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Cabecera
    const [headerResult] = await conn.execute<ResultSetHeader>(
      `INSERT INTO pedidos (idusuario, estado, codigo_unidad_destino, fecha_inicio, fecha_fin, observaciones) 
       VALUES (?, 'pendiente', ?, ?, ?, ?)`,
      [
        idusuario,
        config.codigo_unidad_destino ?? null,
        config.fecha_inicio ?? null,
        config.fecha_fin ?? null,
        config.observaciones ?? null
      ],
    );
    const idpedido = headerResult.insertId;

    // 2) Detalle (bulk insert de cada ítem)
    for (const item of items) {
      await conn.execute<ResultSetHeader>(
        `INSERT INTO pedidos_detalle (idpedido, codigo_componente, cantidad) VALUES (?, ?, ?)`,
        [idpedido, item.codigo_componente, item.cantidad],
      );
      // RESTAR stock del componente
      await conn.execute<ResultSetHeader>(
        `UPDATE componentes SET total = total - ? WHERE codigo_componente = ?`,
        [item.cantidad, item.codigo_componente]
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
 * Lista todos los pedidos con datos del usuario (para admin),
 * permitiendo filtrado opcional por idpedido o nombre de unidad de destino.
 */
export async function listAllPedidos(filters?: { 
  idpedido?: number; 
  unidad_destino_nombre?: string 
}): Promise<PedidoRow[]> {
  let sql = `
    SELECT p.idpedido, p.idusuario, p.estado, p.fecha_pedido,
           p.codigo_unidad_destino, p.fecha_inicio, p.fecha_fin, p.observaciones,
           u.usuario, u.correo, u.oficina,
           un.nombre_de_la_unidad as unidad_destino_nombre
    FROM pedidos p
    JOIN usuarios u ON p.idusuario = u.idusuario
    LEFT JOIN unidades un ON p.codigo_unidad_destino = un.codigo_unidad
  `;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.idpedido) {
    whereClauses.push('p.idpedido = ?');
    params.push(filters.idpedido);
  }

  if (filters?.unidad_destino_nombre) {
    whereClauses.push('un.nombre_de_la_unidad LIKE ?');
    params.push(`%${filters.unidad_destino_nombre}%`);
  }

  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  sql += ' ORDER BY p.fecha_pedido DESC';

  const [rows] = await pool.execute(sql, params);
  return rows as PedidoRow[];
}

/**
 * Lista los pedidos de un usuario específico.
 */
export async function listPedidosByUsuario(idusuario: number): Promise<PedidoRow[]> {
  const [rows] = await pool.execute(
    `SELECT p.idpedido, p.idusuario, p.estado, p.fecha_pedido,
            p.codigo_unidad_destino, p.fecha_inicio, p.fecha_fin, p.observaciones,
            u.usuario, u.correo, u.oficina,
            un.nombre_de_la_unidad as unidad_destino_nombre
     FROM pedidos p
     JOIN usuarios u ON p.idusuario = u.idusuario
     LEFT JOIN unidades un ON p.codigo_unidad_destino = un.codigo_unidad
     WHERE p.idusuario = ?
     ORDER BY p.fecha_pedido DESC`,
    [idusuario],
  );
  return rows as PedidoRow[];
}

/**
 * Obtiene el detalle de ítems de un pedido.
 */
export async function getDetallePedido(idpedido: number): Promise<PedidoDetalleRow[]> {
  const [rows] = await pool.execute(
    `SELECT pd.idpedido_detalle, pd.idpedido, pd.codigo_componente, pd.cantidad,
            c.componente, c.serie
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
    `SELECT p.idpedido, p.idusuario, p.estado, p.fecha_pedido,
            p.codigo_unidad_destino, p.fecha_inicio, p.fecha_fin, p.observaciones,
            u.usuario, u.correo, u.oficina,
            un.nombre_de_la_unidad as unidad_destino_nombre
     FROM pedidos p
     JOIN usuarios u ON p.idusuario = u.idusuario
     LEFT JOIN unidades un ON p.codigo_unidad_destino = un.codigo_unidad
     WHERE p.idpedido = ?
     LIMIT 1`,
    [idpedido],
  );
  return (rows as PedidoRow[])[0] ?? null;
}

/**
 * Actualiza el estado de un pedido y gestiona el stock dinámicamente.
 */
export async function updateEstadoPedido(
  idpedido: number,
  nuevoEstado: EstadoPedido,
): Promise<boolean> {
  const conn: PoolConnection = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Obtener estado actual
    const [rows] = await conn.execute(
      `SELECT estado FROM pedidos WHERE idpedido = ?`,
      [idpedido]
    );
    const pedido = (rows as any[])[0];
    if (!pedido) {
      await conn.rollback();
      return false;
    }
    const viejoEstado = pedido.estado as EstadoPedido;

    // 2) Si el estado no cambia, no hacemos nada
    if (viejoEstado === nuevoEstado) {
      await conn.commit();
      return true;
    }

    // 3) Lógica de stock
    // Definimos qué estados se consideran "stock fuera del depósito" y cuáles "stock devuelto/no usado"
    const esStockFuera = (e: EstadoPedido) => ['pendiente', 'aprobado', 'entregado'].includes(e);
    const esStockDevuelto = (e: EstadoPedido) => ['devuelto', 'rechazado'].includes(e);

    const debeRestaurar = esStockFuera(viejoEstado) && esStockDevuelto(nuevoEstado);
    const debeRestar = esStockDevuelto(viejoEstado) && esStockFuera(nuevoEstado);

    if (debeRestaurar || debeRestar) {
      const [itemRows] = await conn.execute(
        `SELECT codigo_componente, cantidad FROM pedidos_detalle WHERE idpedido = ?`,
        [idpedido]
      );
      const items = itemRows as { codigo_componente: number; cantidad: number }[];

      for (const item of items) {
        const factor = debeRestaurar ? 1 : -1; // +1 para devolver, -1 para restar de nuevo
        await conn.execute(
          `UPDATE componentes SET total = total + ? WHERE codigo_componente = ?`,
          [item.cantidad * factor, item.codigo_componente]
        );
      }
    }

    // 4) Actualizar el pedido
    const [result] = await conn.execute<ResultSetHeader>(
      `UPDATE pedidos SET estado = ? WHERE idpedido = ?`,
      [nuevoEstado, idpedido],
    );

    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Actualiza la configuración de un pedido (unidad, fechas, obs) y sus ítems.
 * Maneja la restauración y resta de stock dinámicamente.
 */
export async function updatePedido(
  idpedido: number,
  config: {
    codigo_unidad_destino?: number | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    observaciones?: string | null;
    items?: { codigo_componente: number; cantidad: number }[];
  }
): Promise<boolean> {
  const conn: PoolConnection = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Restaurar stock de los items antiguos antes de borrarlos
    const [oldItems] = await conn.execute(
      'SELECT codigo_componente, cantidad FROM pedidos_detalle WHERE idpedido = ?',
      [idpedido]
    );
    for (const item of (oldItems as any[])) {
      await conn.execute(
        'UPDATE componentes SET total = total + ? WHERE codigo_componente = ?',
        [item.cantidad, item.codigo_componente]
      );
    }

    // 2. Eliminar detalles antiguos
    await conn.execute('DELETE FROM pedidos_detalle WHERE idpedido = ?', [idpedido]);

    // 3. Insertar nuevos detalles y restar stock
    if (config.items) {
      for (const item of config.items) {
        await conn.execute(
          'INSERT INTO pedidos_detalle (idpedido, codigo_componente, cantidad) VALUES (?, ?, ?)',
          [idpedido, item.codigo_componente, item.cantidad]
        );
        await conn.execute(
          'UPDATE componentes SET total = total - ? WHERE codigo_componente = ?',
          [item.cantidad, item.codigo_componente]
        );
      }
    }

    // 4. Actualizar cabecera
    await conn.execute(
      `UPDATE pedidos SET codigo_unidad_destino = ?, fecha_inicio = ?, fecha_fin = ?, observaciones = ? WHERE idpedido = ?`,
      [
        config.codigo_unidad_destino ?? null,
        config.fecha_inicio ?? null,
        config.fecha_fin ?? null,
        config.observaciones ?? null,
        idpedido
      ]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
