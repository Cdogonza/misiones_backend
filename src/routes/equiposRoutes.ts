import { Router } from 'express';

import {
  getEquipo,
  getEquipos,
  postEquipo,
  putEquipo,
  removeEquipo,
} from '../controllers/equiposController';
import { requireAuth } from '../middlewares/authMiddleware';

export const equiposRouter = Router();

equiposRouter.use(requireAuth);

equiposRouter.get('/', getEquipos);
equiposRouter.get('/:codigo_equipo', getEquipo);
equiposRouter.post('/', postEquipo);
equiposRouter.put('/', putEquipo);
equiposRouter.put('/:codigo_equipo', putEquipo);
equiposRouter.delete('/', removeEquipo);
equiposRouter.delete('/:codigo_equipo', removeEquipo);

