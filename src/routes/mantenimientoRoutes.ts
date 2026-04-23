import { Router } from 'express';
import {
  getMantenimiento,
  getMantenimientos,
  postMantenimiento,
  putMantenimiento,
  removeMantenimiento,
} from '../controllers/mantenimientoController';
import { requireAuth } from '../middlewares/authMiddleware';

export const mantenimientoRouter = Router();

mantenimientoRouter.use(requireAuth);

mantenimientoRouter.get('/', getMantenimientos);
mantenimientoRouter.get('/:id', getMantenimiento);
mantenimientoRouter.post('/', postMantenimiento);
mantenimientoRouter.put('/:id', putMantenimiento);
mantenimientoRouter.delete('/:id', removeMantenimiento);
