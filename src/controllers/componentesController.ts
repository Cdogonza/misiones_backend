import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { writeHistorial } from '../db/historialRepo';
import { findById } from '../db/usersRepo';
import { getEquipoById } from '../db/equiposRepo';
import {
  createComponente,
  deleteComponente,
  getComponenteById,
  listComponentes,
  listComponentesByEquipo,
  listComponentesByUnidad,
  updateComponente,
  type ComponenteInput,
} from '../db/componentesRepo';
import { getUnidadById } from '../db/unidadesRepo';

function toPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${field} debe ser un entero positivo`);
  }
  return parsed;
}

function toNonNegativeInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpError(400, `${field} debe ser un entero no negativo`);
  }
  return parsed;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `Campo inválido: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new HttpError(400, `${field} debe ser numérico`);
  return parsed;
}

function optionalNonNegativeInt(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === '') return null;
  return toNonNegativeInt(value, field);
}

function resolveCodigoComponente(req: Request): number {
  const fromParams = req.params.codigo_componente;
  if (fromParams !== undefined) return toPositiveInt(fromParams, 'codigo_componente');
  const fromQuery = req.query.codigo_componente;
  if (fromQuery !== undefined) return toPositiveInt(fromQuery, 'codigo_componente');
  throw new HttpError(400, 'codigo_componente es requerido');
}

async function resolveLogUser(req: Request) {
  const username = req.user?.usuario ?? null;
  const email = req.user ? (await findById(req.user.idusuario))?.correo ?? null : null;
  return { username, email };
}

function parseBody(body: Record<string, unknown>): ComponenteInput {
  return {
    codigo_equipo: toPositiveInt(body.codigo_equipo, 'codigo_equipo'),
    componente: requiredString(body.componente, 'componente'),
    serie: optionalString(body.serie),
    total: optionalNonNegativeInt(body.total, 'total'),
    codigo_unidad: optionalNumber(body.codigo_unidad, 'codigo_unidad'),
    ubicacion: optionalString(body.ubicacion),
    estado: optionalString(body.estado),
    Nro_alta: optionalString(body.Nro_alta),
    Nro_baja: optionalString(body.Nro_baja),
    lugar: optionalString(body.lugar),
    clasificacion: optionalString(body.clasificacion),
    observacion: optionalString(body.observacion),
  };
}

export const getComponentes = asyncHandler(async (req: Request, res: Response) => {
  const queryCodigo = req.query.codigo_componente;
  if (queryCodigo !== undefined) {
    const codigo_componente = toPositiveInt(queryCodigo, 'codigo_componente');
    const row = await getComponenteById(codigo_componente);
    if (!row) throw new HttpError(404, 'Componente no encontrado');
    return res.json(row);
  }

  const queryEquipo = req.query.codigo_equipo;
  if (queryEquipo !== undefined) {
    const codigo_equipo = toPositiveInt(queryEquipo, 'codigo_equipo');
    const equipo = await getEquipoById(codigo_equipo);
    if (!equipo) throw new HttpError(404, 'Equipo no encontrado');
    const rows = await listComponentesByEquipo(codigo_equipo);
    return res.json(rows);
  }

  const queryUnidad = req.query.codigo_unidad;
  if (queryUnidad !== undefined) {
    const codigo_unidad = toPositiveInt(queryUnidad, 'codigo_unidad');
    const unidad = await getUnidadById(codigo_unidad);
    if (!unidad) throw new HttpError(404, 'Unidad no encontrada');
    const rows = await listComponentesByUnidad(codigo_unidad);
    return res.json(rows);
  }

  const rows = await listComponentes();
  return res.json(rows);
});

export const getComponente = asyncHandler(async (req: Request, res: Response) => {
  const codigo_componente = resolveCodigoComponente(req);
  const row = await getComponenteById(codigo_componente);
  if (!row) throw new HttpError(404, 'Componente no encontrado');
  return res.json(row);
});

export const postComponente = asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(req.body as Record<string, unknown>);
  const equipo = await getEquipoById(input.codigo_equipo);
  if (!equipo) throw new HttpError(409, 'El codigo_equipo no existe en equipos');
  if (input.codigo_unidad != null) {
    const u = await getUnidadById(input.codigo_unidad);
    if (!u) throw new HttpError(409, 'El codigo_unidad no existe en unidades');
  }

  const codigo_componente = await createComponente(input);
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `creó componente ${codigo_componente}`,
  });

  return res.status(201).json({ codigo_componente, ...input });
});

export const putComponente = asyncHandler(async (req: Request, res: Response) => {
  const codigo_componente = resolveCodigoComponente(req);
  const input = parseBody(req.body as Record<string, unknown>);
  const equipo = await getEquipoById(input.codigo_equipo);
  if (!equipo) throw new HttpError(409, 'El codigo_equipo no existe en equipos');
  if (input.codigo_unidad != null) {
    const u = await getUnidadById(input.codigo_unidad);
    if (!u) throw new HttpError(409, 'El codigo_unidad no existe en unidades');
  }

  const updated = await updateComponente(codigo_componente, input);
  if (!updated) throw new HttpError(404, 'Componente no encontrado');
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `modificó componente ${codigo_componente}`,
  });

  return res.json({ codigo_componente, ...input });
});

export const removeComponente = asyncHandler(async (req: Request, res: Response) => {
  const codigo_componente = resolveCodigoComponente(req);
  const removed = await deleteComponente(codigo_componente);
  if (!removed) throw new HttpError(404, 'Componente no encontrado');
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `eliminó componente ${codigo_componente}`,
  });
  return res.status(204).send();
});

