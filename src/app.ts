import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { authRouter } from './routes/authRoutes';
import { equiposRouter } from './routes/equiposRoutes';
import { componentesRouter } from './routes/componentesRoutes';
import { unidadesRouter } from './routes/unidadesRoutes';
import { userRouter } from './routes/userRoutes';
import { pedidosRouter } from './routes/pedidosRoutes';
import { mantenimientoRouter } from './routes/mantenimientoRoutes';
import { errorHandler } from './middlewares/errorHandler';

import { env } from './config/env';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/equipos', equiposRouter);
app.use('/api/componentes', componentesRouter);
app.use('/api/unidades', unidadesRouter);
app.use('/api/usuarios', userRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/mantenimiento', mantenimientoRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use(errorHandler);

