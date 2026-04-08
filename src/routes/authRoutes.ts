import { Router } from 'express';

import { login, register } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';

export const authRouter = Router();

authRouter.post('/register', requireAuth, register);
authRouter.post('/login', login);

