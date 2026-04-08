import type { Request, Response } from 'express';

import { HttpError } from '../utils/httpError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword } from '../utils/password';
import { writeHistorial } from '../db/historialRepo';
import { findById, findByEmail, updateEmail, updatePassword, getAllUsers } from '../db/usersRepo';
import { VALORES_OFICINAS } from '../utils/constants';

function assertString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new HttpError(400, `Campo inválido: ${fieldName}`);
    }
    return value.trim();
}

/**
 * Obtiene el perfil del usuario autenticado
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.idusuario;
    if (!userId) throw new HttpError(401, 'No autenticado');

    const user = await findById(userId);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    return res.json({
        idusuario: user.idusuario,
        username: user.usuario,
        email: user.correo,
        oficina: user.oficina,
        rol: user.rol,
    });
});



/**
 * Actualiza el correo electrónico del usuario
 */
export const updateEmailHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.idusuario;
    if (!userId) throw new HttpError(401, 'No autenticado');

    const { email } = req.body as { email?: string };
    const newEmail = assertString(email, 'email');

    // Verificar si el email ya existe en otro usuario
    const existingUser = await findByEmail(newEmail);
    if (existingUser && existingUser.idusuario !== userId) {
        throw new HttpError(409, 'El correo electrónico ya está en uso');
    }

    const user = await findById(userId);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    await updateEmail(userId, newEmail);

    await writeHistorial({
        usuario: user.usuario,
        email: newEmail,
        evento: 'actualizó su correo',
    });

    return res.json({ message: 'Correo actualizado correctamente', email: newEmail });
});

/**
 * Actualiza la contraseña del usuario
 */
export const updatePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.idusuario;
    if (!userId) throw new HttpError(401, 'No autenticado');

    const { password } = req.body as { password?: string };
    const newPassword = assertString(password, 'password');

    if (newPassword.length < 6) {
        throw new HttpError(400, 'La password debe tener al menos 6 caracteres');
    }

    const user = await findById(userId);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    const passwordHash = await hashPassword(newPassword);
    await updatePassword(userId, passwordHash);

    await writeHistorial({
        usuario: user.usuario,
        email: user.correo,
        evento: 'actualizó su password',
    });

    return res.json({ message: 'Contraseña actualizada correctamente' });
});

/**
 * Obtiene la lista completa de usuarios (solo username y correo)
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user;
    if (!currentUser) throw new HttpError(401, 'No autenticado');

    if (currentUser.rol !== 'admin' && currentUser.rol !== 'superAdmin') {
        throw new HttpError(403, 'No tienes permiso para ver la lista de usuarios');
    }

    const oficina = currentUser.rol === 'superAdmin' ? undefined : currentUser.oficina;
    const users = await getAllUsers(oficina);
    return res.json(users);
});

/**
 * Resetea la contraseña de un usuario al valor por defecto (Abc123456)
 */
export const resetPasswordToDefault = asyncHandler(async (req: Request, res: Response) => {
    const currentUser = req.user;
    if (!currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'superAdmin')) {
        throw new HttpError(403, 'Solo los administradores pueden resetear contraseñas');
    }

    const { id } = req.params;
    const userId = parseInt(id as string, 10);

    if (isNaN(userId)) {
        throw new HttpError(400, 'ID de usuario inválido');
    }

    const user = await findById(userId);
    if (!user) {
        throw new HttpError(404, 'Usuario no encontrado');
    }

    if (currentUser.rol !== 'superAdmin' && user.oficina !== currentUser.oficina) {
        throw new HttpError(403, 'Solo puedes resetear contraseñas de usuarios de tu misma oficina');
    }

    const defaultPassword = 'Abc123456';
    const passwordHash = await hashPassword(defaultPassword);
    await updatePassword(userId, passwordHash);

    await writeHistorial({
        usuario: user.usuario,
        email: user.correo,
        evento: `reseteó contraseña de usuario ${user.usuario} a valor por defecto`,
    });

    return res.json({ message: `Contraseña de ${user.usuario} reseteada a ${defaultPassword}` });
});

/**
 * Obtiene la lista de oficinas válidas
 */
export const getOficinas = asyncHandler(async (_req: Request, res: Response) => {
    return res.json(VALORES_OFICINAS);
});
