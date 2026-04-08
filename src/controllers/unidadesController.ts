import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { writeHistorial } from '../db/historialRepo';
import { findById } from '../db/usersRepo';
import {
  createUnidad,
  deleteUnidad,
  getUnidadById,
  listUnidades,
  updateUnidad,
  type UnidadInput,
} from '../db/unidadesRepo';
import type { ComponenteRow } from '../db/componentesRepo';
import { countComponentesByUnidad, listComponentesByUnidad } from '../db/componentesRepo';
import { listEquiposByIds, listEquiposByUnidad } from '../db/equiposRepo';

function toPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${field} debe ser un entero positivo`);
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

function resolveCodigoUnidad(req: Request): number {
  const fromParams = req.params.codigo_unidad;
  if (fromParams !== undefined) return toPositiveInt(fromParams, 'codigo_unidad');
  const fromQuery = req.query.codigo_unidad;
  if (fromQuery !== undefined) return toPositiveInt(fromQuery, 'codigo_unidad');
  throw new HttpError(400, 'codigo_unidad es requerido');
}

async function resolveLogUser(req: Request) {
  const username = req.user?.usuario ?? null;
  const email = req.user ? (await findById(req.user.idusuario))?.correo ?? null : null;
  return { username, email };
}

function parseUnidadBody(body: Record<string, unknown>): UnidadInput {
  return {
    unidad: requiredString(body.unidad, 'unidad'),
    nombre_de_la_unidad: requiredString(body.nombre_de_la_unidad, 'nombre_de_la_unidad'),
    ambito: optionalString(body.ambito),
  };
}

async function assertUnidadExists(codigo_unidad: number) {
  const u = await getUnidadById(codigo_unidad);
  if (!u) throw new HttpError(404, 'Unidad no encontrada');
}

export const getUnidades = asyncHandler(async (req: Request, res: Response) => {
  const queryCodigo = req.query.codigo_unidad;
  if (queryCodigo !== undefined) {
    const codigo_unidad = toPositiveInt(queryCodigo, 'codigo_unidad');
    const row = await getUnidadById(codigo_unidad);
    if (!row) throw new HttpError(404, 'Unidad no encontrada');
    return res.json(row);
  }

  const rows = await listUnidades();
  return res.json(rows);
});

export const getUnidad = asyncHandler(async (req: Request, res: Response) => {
  const codigo_unidad = resolveCodigoUnidad(req);
  const row = await getUnidadById(codigo_unidad);
  if (!row) throw new HttpError(404, 'Unidad no encontrada');
  return res.json(row);
});

export const getUnidadComponentes = asyncHandler(async (req: Request, res: Response) => {
  const codigo_unidad = toPositiveInt(req.params.codigo_unidad, 'codigo_unidad');
  await assertUnidadExists(codigo_unidad);
  const rows = await listComponentesByUnidad(codigo_unidad);
  return res.json(rows);
});

export const getUnidadEquipos = asyncHandler(async (req: Request, res: Response) => {
  const codigo_unidad = toPositiveInt(req.params.codigo_unidad, 'codigo_unidad');
  await assertUnidadExists(codigo_unidad);
  const rows = await listEquiposByUnidad(codigo_unidad);
  return res.json(rows);
});

/** Unidad + equipos con sus componentes anidados (solo componentes con esa codigo_unidad). */
export const getUnidadAgrupada = asyncHandler(async (req: Request, res: Response) => {
  const codigo_unidad = toPositiveInt(req.params.codigo_unidad, 'codigo_unidad');
  const unidad = await getUnidadById(codigo_unidad);
  if (!unidad) throw new HttpError(404, 'Unidad no encontrada');

  const componentes = await listComponentesByUnidad(codigo_unidad);
  const byEquipo = new Map<number, ComponenteRow[]>();
  for (const c of componentes) {
    const list = byEquipo.get(c.codigo_equipo) ?? [];
    list.push(c);
    byEquipo.set(c.codigo_equipo, list);
  }
  const codigosEquipo = [...byEquipo.keys()].sort((a, b) => a - b);
  const equiposRows = await listEquiposByIds(codigosEquipo);
  const equipos = codigosEquipo.map((codigo_equipo) => ({
    codigo_equipo,
    equipo: equiposRows.get(codigo_equipo)?.equipo ?? null,
    componentes: byEquipo.get(codigo_equipo) ?? [],
  }));

  return res.json({ unidad, equipos });
});

export const postUnidad = asyncHandler(async (req: Request, res: Response) => {
  const input = parseUnidadBody(req.body as Record<string, unknown>);
  const nombre_de_la_unidad = await createUnidad(input);
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `creó unidad ${nombre_de_la_unidad}`,
  });
  return res.status(201).json({ nombre_de_la_unidad });
});

export const putUnidad = asyncHandler(async (req: Request, res: Response) => {
  const codigo_unidad = resolveCodigoUnidad(req);
  const input = parseUnidadBody(req.body as Record<string, unknown>);
  const updated = await updateUnidad(codigo_unidad, input);
  if (!updated) throw new HttpError(404, 'Unidad no encontrada');
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `modificó unidad ${codigo_unidad}`,
  });
  return res.json({ codigo_unidad, ...input });
});

export const removeUnidad = asyncHandler(async (req: Request, res: Response) => {
  const codigo_unidad = resolveCodigoUnidad(req);
  const total = await countComponentesByUnidad(codigo_unidad);
  if (total > 0) {
    throw new HttpError(
      409,
      'No se puede eliminar la unidad porque tiene componentes asociados',
    );
  }
  const removed = await deleteUnidad(codigo_unidad);
  if (!removed) throw new HttpError(404, 'Unidad no encontrada');
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `eliminó unidad ${codigo_unidad}`,
  });
  return res.status(204).send();
});
