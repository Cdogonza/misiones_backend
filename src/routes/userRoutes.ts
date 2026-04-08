import { Router } from 'express';
import { getProfile, updateEmailHandler, updatePasswordHandler, getUsers, resetPasswordToDefault, getOficinas } from '../controllers/userController';
import { authMiddleware, requireAuth } from '../middlewares/authMiddleware';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/ping', (_req, res) => res.json({ message: 'pong' }));

userRouter.get('/', getUsers);
userRouter.get('/perfil', authMiddleware, getProfile);
userRouter.get('/oficinas', getOficinas);
userRouter.put('/email', authMiddleware, updateEmailHandler);
userRouter.put('/password', authMiddleware, updatePasswordHandler);
userRouter.put('/reset-password/:id', authMiddleware, resetPasswordToDefault);

