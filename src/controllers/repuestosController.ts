import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import {
  createRepuesto,
  deleteRepuesto,
  getRepuestoById,
  listRepuestos,
  updateRepuesto,
  RepuestoInput
} from '../db/repuestosRepo';

function toPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${field} debe ser un entero positivo`);
  }
  return parsed;
}

export const getRepuestos = asyncHandler(async (req: Request, res: Response) => {
  const rows = await listRepuestos();
  return res.json(rows);
});

export const getRepuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  const row = await getRepuestoById(id);
  if (!row) throw new HttpError(404, 'Repuesto no encontrado');
  return res.json(row);
});

export const postRepuesto = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as RepuestoInput;
  if (!data.nombre) throw new HttpError(400, 'El nombre es obligatorio');
  
  const id = await createRepuesto(data);
  return res.status(201).json({ idrepuestos: id, ...data });
});

export const putRepuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  const data = req.body as RepuestoInput;
  
  const updated = await updateRepuesto(id, data);
  if (!updated) throw new HttpError(404, 'Repuesto no encontrado');

  return res.json({ idrepuestos: id, ...data });
});

export const removeRepuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  
  const removed = await deleteRepuesto(id);
  if (!removed) throw new HttpError(404, 'Repuesto no encontrado');

  return res.status(204).send();
});
