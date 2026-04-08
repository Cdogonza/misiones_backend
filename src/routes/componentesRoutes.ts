import { Router } from 'express';

import {
  getComponente,
  getComponentes,
  postComponente,
  putComponente,
  removeComponente,
} from '../controllers/componentesController';
import { requireAuth } from '../middlewares/authMiddleware';

export const componentesRouter = Router();

componentesRouter.use(requireAuth);

componentesRouter.get('/', getComponentes);
componentesRouter.get('/:codigo_componente', getComponente);
componentesRouter.post('/', postComponente);
componentesRouter.put('/', putComponente);
componentesRouter.put('/:codigo_componente', putComponente);
componentesRouter.delete('/', removeComponente);
componentesRouter.delete('/:codigo_componente', removeComponente);

