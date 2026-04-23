import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { writeHistorial } from '../db/historialRepo';
import { findById } from '../db/usersRepo';
import {
  createMantenimiento,
  deleteMantenimiento,
  getMantenimientoById,
  listMantenimientos,
  searchMantenimientos,
  updateMantenimiento,
  MantenimientoInput
} from '../db/mantenimientoRepo';

function toPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${field} debe ser un entero positivo`);
  }
  return parsed;
}

async function resolveLogUser(req: Request) {
  const username = req.user?.usuario ?? null;
  const email = req.user ? (await findById(req.user.idusuario))?.correo ?? null : null;
  return { username, email };
}

export const getMantenimientos = asyncHandler(async (req: Request, res: Response) => {
  const { id, equipo, procedencia, ubicacion } = req.query;

  if (id) {
    const idNum = toPositiveInt(id, 'id');
    const row = await getMantenimientoById(idNum);
    if (!row) throw new HttpError(404, 'Mantenimiento no encontrado');
    return res.json(row);
  }

  if (equipo || procedencia || ubicacion) {
    const rows = await searchMantenimientos({
      equipo: equipo as string,
      procedencia: procedencia as string,
      ubicacion: ubicacion as string,
    });
    return res.json(rows);
  }

  const rows = await listMantenimientos();
  return res.json(rows);
});

export const getMantenimiento = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  const row = await getMantenimientoById(id);
  if (!row) throw new HttpError(404, 'Mantenimiento no encontrado');
  return res.json(row);
});

export const postMantenimiento = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as MantenimientoInput;
  const id = await createMantenimiento(data);
  
  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `creó registro de mantenimiento ${id}`,
  });

  return res.status(201).json({ id_mantenimiento: id, ...data });
});

export const putMantenimiento = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  const data = req.body as MantenimientoInput;
  
  const updated = await updateMantenimiento(id, data);
  if (!updated) throw new HttpError(404, 'Mantenimiento no encontrado');

  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `modificó registro de mantenimiento ${id}`,
  });

  return res.json({ id_mantenimiento: id, ...data });
});

export const removeMantenimiento = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  
  const removed = await deleteMantenimiento(id);
  if (!removed) throw new HttpError(404, 'Mantenimiento no encontrado');

  const { username, email } = await resolveLogUser(req);
  await writeHistorial({
    usuario: username,
    email,
    evento: `eliminó registro de mantenimiento ${id}`,
  });

  return res.status(204).send();
});
