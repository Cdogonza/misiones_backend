import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../utils/httpError';
import { verifyToken } from '../services/jwtService';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new HttpError(401, 'Token requerido'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { 
      idusuario: payload.sub, 
      usuario: payload.usuario, 
      oficina: payload.oficina, 
      rol: payload.rol 
    };
    return next();
  } catch {
    return next(new HttpError(401, 'Token inválido'));
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
    const payload = verifyToken(token);

    req.user = { 
        idusuario: payload.sub, 
        usuario: payload.usuario,
        oficina: payload.oficina,
        rol: payload.rol
    };
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token inválido' });
  }
}