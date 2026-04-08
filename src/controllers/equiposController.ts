import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { writeHistorial } from '../db/historialRepo';
import { findById } from '../db/usersRepo';
import {
  createEquipo,
  deleteEquipo,
  getEquipoById,
  listEquipos,
  updateEquipo,
} from '../db/equiposRepo';
import { countComponentesByEquipo } from '../db/componentesRepo';

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

function resolveCodigoEquipo(req: Request): number {
  const fromParams = req.params.codigo_equipo;
  if (fromParams !== undefined) return toPositiveInt(fromParams, 'codigo_equipo');
  const fromQuery = req.query.codigo_equipo;
  if (fromQuery !== undefined) return toPositiveInt(fromQuery, 'codigo_equipo');
  throw new HttpError(400, 'codigo_equipo es requerido');
}

async function resolveLogUser(req: Request) {
  const username = req.user?.usuario ?? null;
  const email = req.user ? (await findById(req.user.idusuario))?.correo ?? null : null;
  return { username, email };
}

export const getEquipos = asyncHandler(async (req: Request, res: Response) => {
  const queryCodigo = req.query.codigo_equipo;
  if (queryCodigo !== undefined) {
    const codigo_equipo = toPositiveInt(queryCodigo, 'codigo_equipo');
    const row = await getEquipoById(codigo_equipo);
    if (!row) throw new HttpError(404, 'Equipo no encontrado');
    return res.json(row);
  }

  const rows = await listEquipos();
  return res.json(rows);
});

export const getEquipo = asyncHandler(async (req: Request, res: Response) => {
  const codigo_equipo = resolveCodigoEquipo(req);
  const row = await getEquipoById(codigo_equipo);
  if (!row) throw new HttpError(404, 'Equipo no encontrado');
  return res.json(row);
});

export const postEquipo = asyncHandler(async (req: Request, res: Response) => {
  const equipo = requiredString((req.body as { equipo?: unknown }).equipo, 'equipo');
  const codigo_equipo = await createEquipo(equipo);
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `creó equipo ${codigo_equipo}`,
  });
  return res.status(201).json({ codigo_equipo, equipo });
});

export const putEquipo = asyncHandler(async (req: Request, res: Response) => {
  const codigo_equipo = resolveCodigoEquipo(req);
  const equipo = requiredString((req.body as { equipo?: unknown }).equipo, 'equipo');
  const updated = await updateEquipo(codigo_equipo, equipo);
  if (!updated) throw new HttpError(404, 'Equipo no encontrado');
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `modificó equipo ${codigo_equipo}`,
  });
  return res.json({ codigo_equipo, equipo });
});

export const removeEquipo = asyncHandler(async (req: Request, res: Response) => {
  const codigo_equipo = resolveCodigoEquipo(req);
  const totalComponentes = await countComponentesByEquipo(codigo_equipo);
  if (totalComponentes > 0) {
    throw new HttpError(
      409,
      'No se puede eliminar el equipo porque tiene componentes asociados',
    );
  }

  const removed = await deleteEquipo(codigo_equipo);
  if (!removed) throw new HttpError(404, 'Equipo no encontrado');
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `eliminó equipo ${codigo_equipo}`,
  });
  return res.status(204).send();
});

