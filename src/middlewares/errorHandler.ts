import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../utils/httpError';

// Maneja errores lanzados en controladores/middlewares.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  return res.status(500).json({ message: 'Error interno del servidor' });
}

