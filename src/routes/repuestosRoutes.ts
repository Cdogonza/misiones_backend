import { Router } from 'express';
import {
  getRepuesto,
  getRepuestos,
  postRepuesto,
  putRepuesto,
  removeRepuesto,
} from '../controllers/repuestosController';
import { requireAuth } from '../middlewares/authMiddleware';

export const repuestosRouter = Router();

repuestosRouter.use(requireAuth);

repuestosRouter.get('/', getRepuestos);
repuestosRouter.get('/:id', getRepuesto);
repuestosRouter.post('/', postRepuesto);
repuestosRouter.put('/:id', putRepuesto);
repuestosRouter.delete('/:id', removeRepuesto);
