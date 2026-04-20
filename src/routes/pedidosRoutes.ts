import { Router } from 'express';

import {
  getAllPedidos,
  getPedidosByUsuario,
  patchEstadoPedido,
  patchPedido,
  postPedido,
} from '../controllers/pedidosController';
import { requireAuth } from '../middlewares/authMiddleware';

export const pedidosRouter = Router();

// Todas las rutas requieren autenticación
pedidosRouter.use(requireAuth);

// POST /api/pedidos — crear un pedido (cualquier usuario autenticado)
pedidosRouter.post('/', postPedido);

// GET /api/pedidos — listar todos los pedidos (solo admin/superAdmin)
pedidosRouter.get('/', getAllPedidos);

// GET /api/pedidos/usuario/:id — historial de pedidos de un usuario
pedidosRouter.get('/usuario/:id', getPedidosByUsuario);

// PATCH /api/pedidos/:id — actualizar configuración del pedido
pedidosRouter.patch('/:id', patchPedido);

// PATCH /api/pedidos/:id/estado — actualizar estado (solo admin/superAdmin)
pedidosRouter.patch('/:id/estado', patchEstadoPedido);
