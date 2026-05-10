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
  updatePedido,
  deletePedido,
  type EstadoPedido,
  type PedidoDetalleInput,
} from '../db/pedidosRepo';


// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADOS_VALIDOS: EstadoPedido[] = ['pendiente', 'aprobado', 'rechazado', 'entregado', 'devuelto', 'borrador'];

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
    items?: unknown[],
    codigo_unidad_destino?: number,
    fecha_inicio?: string, 
    fecha_fin?: string, 
    observaciones?: string,
    estado?: string
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
    observaciones: body.observaciones || null,
    estado: (body.estado as any) || 'pendiente'
  });

  await writeHistorial({
    usuario: req.user?.usuario ?? null,
    email: null,
    evento: `creó pedido ${idpedido} (${items.length} ítem/s)`,
  });

  return res.status(201).json({ 
    idpedido, 
    idusuario, 
    estado: (body.estado as any) || 'pendiente', 
    items,
    codigo_unidad_destino: body.codigo_unidad_destino,
    fecha_inicio: body.fecha_inicio,
    fecha_fin: body.fecha_fin
  });
});

// ─── GET /api/pedidos ─────────────────────────────────────────────────────────

export const getAllPedidos = asyncHandler(async (req: Request, res: Response) => {
  const rol = req.user?.rol;
  if (rol !== 'admin' && rol !== 'superAdmin' && rol !== 'integrante') {
    throw new HttpError(403, 'No tienes permiso para ver todos los pedidos');
  }

  const { idpedido, unidad_destino_nombre } = req.query;

  const filters = {
    idpedido: idpedido ? Number(idpedido) : undefined,
    unidad_destino_nombre: unidad_destino_nombre as string | undefined,
  };

  const pedidos = await listAllPedidos(filters);

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

// ─── PATCH /api/pedidos/:id ──────────────────────────────────────────────────

export const patchPedido = asyncHandler(async (req: Request, res: Response) => {
  const idpedido = toPositiveInt(req.params.id, 'id');

  const body = req.body as {
    codigo_unidad_destino?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    observaciones?: string;
    estado?: string;
    items?: { codigo_componente: number; cantidad: number }[];
  };

  const pedido = await getPedidoById(idpedido);
  if (!pedido) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  // Solo se puede editar si está pendiente o borrador
  if (pedido.estado !== 'pendiente' && pedido.estado !== 'borrador') {
    throw new HttpError(400, 'Solo se pueden editar pedidos en estado pendiente o borrador');
  }

  // Permisos: Solo el dueño del pedido o un admin/superAdmin puede editar
  const currentUser = req.user;
  const isAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'superAdmin';

  if (
    currentUser?.idusuario !== pedido.idusuario &&
    !isAdmin
  ) {
    throw new HttpError(403, 'No tienes permiso para editar este pedido');
  }

  // Si no es admin, no puede cambiar el estado a estados restringidos (aprobado, entregado, etc.)
  if (body.estado && !isAdmin) {
    const restrictedStates: EstadoPedido[] = ['aprobado', 'rechazado', 'entregado', 'devuelto'];
    if (restrictedStates.includes(body.estado as any)) {
      throw new HttpError(403, 'No tienes permiso para cambiar el pedido a este estado');
    }
  }


  const result = await updatePedido(idpedido, {
    codigo_unidad_destino: body.codigo_unidad_destino,
    fecha_inicio: body.fecha_inicio,
    fecha_fin: body.fecha_fin,
    observaciones: body.observaciones,
    estado: (body.estado as any) || pedido.estado,
    items: body.items
  });

  if (!result) {
    throw new HttpError(500, 'Error al actualizar el pedido');
  }

  await writeHistorial({
    usuario: req.user?.usuario ?? null,
    email: null,
    evento: `editó configuración del pedido ${idpedido}`,
  });

  return res.json({ message: 'Pedido actualizado con éxito', idpedido });
});

// ─── DELETE /api/pedidos/:id ─────────────────────────────────────────────────

export const deletePedidoHandler = asyncHandler(async (req: Request, res: Response) => {
  const idpedido = toPositiveInt(req.params.id, 'id');

  const pedido = await getPedidoById(idpedido);
  if (!pedido) {
    throw new HttpError(404, 'Pedido no encontrado');
  }

  // Permisos: Solo el dueño del pedido o un admin/superAdmin puede borrar
  const currentUser = req.user;
  const isAdmin = currentUser?.rol === 'admin' || currentUser?.rol === 'superAdmin';

  if (
    currentUser?.idusuario !== pedido.idusuario &&
    !isAdmin
  ) {
    throw new HttpError(403, 'No tienes permiso para eliminar este pedido');
  }

  const success = await deletePedido(idpedido);
  if (!success) {
    throw new HttpError(500, 'Error al eliminar el pedido');
  }

  await writeHistorial({
    usuario: req.user?.usuario ?? null,
    email: null,
    evento: `eliminó el pedido ${idpedido} (${pedido.estado})`,
  });

  return res.json({ message: 'Pedido eliminado con éxito', idpedido });
});
