import { Router } from 'express';
import {
  getMantenimiento,
  getMantenimientos,
  postMantenimiento,
  putMantenimiento,
  removeMantenimiento,
} from '../controllers/mantenimientoController';
import {
  getMantenimientoRepuestos,
  postMantenimientoRepuestos,
  removeMantenimientoRepuestos,
} from '../controllers/mantenimientoRepuestosController';
import { requireAuth } from '../middlewares/authMiddleware';

export const mantenimientoRouter = Router();

mantenimientoRouter.use(requireAuth);

mantenimientoRouter.get('/', getMantenimientos);
mantenimientoRouter.get('/:id', getMantenimiento);
mantenimientoRouter.post('/', postMantenimiento);
mantenimientoRouter.put('/:id', putMantenimiento);
mantenimientoRouter.delete('/:id', removeMantenimiento);

// Budget / Repuestos
mantenimientoRouter.get('/:id/repuestos', getMantenimientoRepuestos);
mantenimientoRouter.post('/:id/repuestos', postMantenimientoRepuestos);
mantenimientoRouter.delete('/:id/repuestos', removeMantenimientoRepuestos);
