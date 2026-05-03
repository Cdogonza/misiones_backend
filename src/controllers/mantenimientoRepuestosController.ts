import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import {
  addRepuestosToMantenimiento,
  deleteRepuestosFromMantenimiento,
  getRepuestosByMantenimiento,
  MantenimientoRepuestoInput
} from '../db/mantenimientoRepuestosRepo';
import { updateMantenimientoPresupuesto } from '../db/mantenimientoRepo';

function toPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value);
  if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${field} debe ser un entero positivo`);
  }
  return parsed;
}

export const getMantenimientoRepuestos = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  const rows = await getRepuestosByMantenimiento(id);
  return res.json(rows);
});

export const postMantenimientoRepuestos = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  const { repuestos, tecnico, total } = req.body as { 
    repuestos: MantenimientoRepuestoInput[], 
    tecnico: string, 
    total: number 
  };

  if (!Array.isArray(repuestos)) {
    throw new HttpError(400, 'repuestos debe ser un array');
  }

  // 1. Limpiar repuestos anteriores si existen (según el requerimiento de permitir edición/limpiar)
  await deleteRepuestosFromMantenimiento(id);

  // 2. Agregar los nuevos repuestos
  if (repuestos.length > 0) {
    await addRepuestosToMantenimiento(id, repuestos);
  }

  // 3. Actualizar el registro de mantenimiento con el técnico y el total
  await updateMantenimientoPresupuesto(id, tecnico || '', total?.toString() || '0');

  return res.status(201).json({ message: 'Presupuesto guardado con éxito' });
});

export const removeMantenimientoRepuestos = asyncHandler(async (req: Request, res: Response) => {
  const id = toPositiveInt(req.params.id, 'id');
  await deleteRepuestosFromMantenimiento(id);
  
  // También podríamos querer resetear el presupuesto en la tabla mantenimiento
  await updateMantenimientoPresupuesto(id, '', '0');

  return res.status(204).send();
});
