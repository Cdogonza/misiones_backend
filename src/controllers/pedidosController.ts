import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { writeHistorial } from '../db/historialRepo';
import {
  createPedido,
  getDetallePedido,
  getPedidoById,
  listAllPedidos,
  listPedidosByUsuario,
  updateEstadoPedido,
  type EstadoPedido,
  type PedidoDetalleInput,
} from '../db/pedidosRepo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADOS_VALIDOS: EstadoPedido[] = ['pendiente', 'aprobado', 'rechazado', 'entregado', 'devuelto'];

function toPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${field} debe ser un entero positivo`);
  }
  return parsed;
}

// ─── POST /api/pedidos ────────────────────────────────────────────────────────

export const postPedido = asyncHandler(async (req: Request, res: Response) => {
  // El idusuario se toma del token autenticado (más seguro).
  // Si el body también lo envía, sólo se usa para compatibilidad hacia atrás.
  const idusuario = req.user?.idusuario;
  if (!idusuario) {
    throw new HttpError(401, 'Usuario no autenticado');
  }

  const body = req.body as { 
    items?: unknown, 
    codigo_unidad_destino?: number, 
    fecha_inicio?: string, 
    fecha_fin?: string, 
    observaciones?: string 
  };

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError(400, 'El campo "items" debe ser un array no vacío');
  }

  // Validar cada ítem
  const items: PedidoDetalleInput[] = (body.items as unknown[]).map((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      throw new HttpError(400, `Item ${idx}: formato inválido`);
    }
    const i = item as Record<string, unknown>;
    return {
      codigo_componente: toPositiveInt(i.codigo_componente, `items[${idx}].codigo_componente`),
      cantidad: toPositiveInt(i.cantidad, `items[${idx}].cantidad`),
    };
  });

  const idpedido = await createPedido(idusuario, items, {
    codigo_unidad_destino: body.codigo_unidad_destino ? Number(body.codigo_unidad_destino) : null,
    fecha_inicio: body.fecha_inicio || null,
    fecha_fin: body.fecha_fin || null,
    observaciones: body.observaciones || null
  });

  await writeHistorial({
    usuario: req.user?.usuario ?? null,
    email: null,
    evento: `creó pedido ${idpedido} (${items.length} ítem/s)`,
  });

  return res.status(201).json({ 
    idpedido, 
    idusuario, 
    estado: 'pendiente', 
    items,
    codigo_unidad_destino: body.codigo_unidad_destino,
    fecha_inicio: body.fecha_inicio,
    fecha_fin: body.fecha_fin
  });
});

// ─── GET /api/pedidos ─────────────────────────────────────────────────────────

export const getAllPedidos = asyncHandler(async (req: Request, res: Response) => {
  const rol = req.user?.rol;
  if (rol !== 'admin' && rol !== 'superAdmin') {
    throw new HttpError(403, 'Solo los administradores pueden ver todos los pedidos');
  }

  const pedidos = await listAllPedidos();

  // Adjuntar detalle a cada pedido
  const pedidosConDetalle = await Promise.all(
    pedidos.map(async (p) => {
      const detalle = await getDetallePedido(p.idpedido);
      return { ...p, detalle };
    }),
  );

  return res.json(pedidosConDetalle);
});

// ─── GET /api/pedidos/usuario/:id ────────────────────────────────────────────

export const getPedidosByUsuario = asyncHandler(async (req: Request, res: Response) => {
  const requestedId = toPositiveInt(req.params.id, 'id');

  // Un usuario sólo puede ver sus propios pedidos; admin/superAdmin pueden ver cualquiera
  const currentUser = req.user;
  if (
    currentUser?.idusuario !== requestedId &&
    currentUser?.rol !== 'admin' &&
    currentUser?.rol !== 'superAdmin'
  ) {
    throw new HttpError(403, 'No tienes permiso para ver los pedidos de otro usuario');
  }

  const pedidos = await listPedidosByUsuario(requestedId);

  const pedidosConDetalle = await Promise.all(
    pedidos.map(async (p) => {
      const detalle = await getDetallePedido(p.idpedido);
      return { ...p, detalle };
    }),
  );

  return res.json(pedidosConDetalle);
});

// ─── PATCH /api/pedidos/:id/estado ───────────────────────────────────────────

export const patchEstadoPedido = asyncHandler(async (req: Request, res: Response) => {
  const rol = req.user?.rol;
  if (rol !== 'admin' && rol !== 'superAdmin') {
    throw new HttpError(403, 'Solo los administradores pueden cambiar el estado de un pedido');
  }

  const idpedido = toPositiveInt(req.params.id, 'id');

  const body = req.body as { estado?: unknown };
  const nuevoEstado = body.estado;

  if (typeof nuevoEstado !== 'string' || !ESTADOS_VALIDOS.includes(nuevoEstado as EstadoPedido)) {
    throw new HttpError(
      400,
      `Estado inválido. Los valores permitidos son: ${ESTADOS_VALIDOS.join(', ')}`,
    );
  }

  const pedido = await getPedidoById(idpedido);
  if (!pedido) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  const updated = await updateEstadoPedido(idpedido, nuevoEstado as EstadoPedido);
  if (!updated) {
    throw new HttpError(500, 'Error al actualizar el estado del pedido');
  }

  await writeHistorial({
    usuario: req.user?.usuario ?? null,
    email: null,
    evento: `cambió estado del pedido ${idpedido} a "${nuevoEstado}"`,
  });

  return res.json({ idpedido, estado: nuevoEstado });
});
