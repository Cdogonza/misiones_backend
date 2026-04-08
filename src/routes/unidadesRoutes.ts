import { Router } from 'express';

import {
  getUnidad,
  getUnidadAgrupada,
  getUnidadComponentes,
  getUnidadEquipos,
  getUnidades,
  postUnidad,
  putUnidad,
  removeUnidad,
} from '../controllers/unidadesController';
import { requireAuth } from '../middlewares/authMiddleware';

export const unidadesRouter = Router();

unidadesRouter.use(requireAuth);

/** Rutas más específicas primero (evita que :codigo_unidad capture "componentes" / "equipos"). */
unidadesRouter.get('/:codigo_unidad/agrupado', getUnidadAgrupada);
unidadesRouter.get('/:codigo_unidad/componentes', getUnidadComponentes);
unidadesRouter.get('/:codigo_unidad/equipos', getUnidadEquipos);

unidadesRouter.get('/', getUnidades);
unidadesRouter.get('/:codigo_unidad', getUnidad);

unidadesRouter.post('/', postUnidad);

unidadesRouter.put('/', putUnidad);
unidadesRouter.put('/:codigo_unidad', putUnidad);

unidadesRouter.delete('/', removeUnidad);
unidadesRouter.delete('/:codigo_unidad', removeUnidad);
