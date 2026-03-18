import { Router, Request, Response } from 'express';
import authService from '../service/AuthService';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// POST - Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son requeridos',
                code: 'MISSING_CREDENTIALS'
            });
            return;
        }

        const authResponse = await authService.login(email, password);
        res.json({ success: true, data: authResponse });
    } catch (error: any) {
        console.error('Login error:', error);

        if (error.message === 'INVALID_CREDENTIALS') {
            res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS'
            });
            return;
        }

        res.status(500).json({ 
            success: false, 
            message: 'Error en el login',
            code: 'LOGIN_ERROR'
        });
    }
});

// POST - Refresh Token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ 
                success: false, 
                message: 'Refresh token es requerido',
                code: 'MISSING_REFRESH_TOKEN'
            });
            return;
        }

        const authResponse = await authService.refreshToken(refreshToken);
        res.json({ success: true, data: authResponse });
    } catch (error: any) {
        console.error('Refresh token error:', error);

        if (error.message === 'REFRESH_TOKEN_EXPIRED') {
            res.status(401).json({ 
                success: false, 
                message: 'El refresh token ha expirado. Por favor inicie sesión nuevamente.',
                code: 'REFRESH_TOKEN_EXPIRED'
            });
            return;
        }

        if (error.message === 'INVALID_REFRESH_TOKEN') {
            res.status(401).json({ 
                success: false, 
                message: 'Refresh token inválido',
                code: 'INVALID_REFRESH_TOKEN'
            });
            return;
        }

        res.status(500).json({ 
            success: false, 
            message: 'Error al renovar token',
            code: 'REFRESH_ERROR'
        });
    }
});

// GET - Verificar estado del token
router.get('/verify', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(400).json({ 
                success: false, 
                message: 'Token no proporcionado',
                code: 'NO_TOKEN'
            });
            return;
        }

        const status = authService.checkTokenStatus(token);
        
        res.json({ 
            success: true, 
            data: {
                ...status,
                user: req.user
            }
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al verificar token',
            code: 'VERIFY_ERROR'
        });
    }
});

// POST - Registrar nuevo admin (solo SUPER_ADMIN)
router.post('/register', 
    authenticateToken, 
    authorizeRoles('SUPER_ADMIN'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password, role } = req.body;

            if (!email || !password) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Email y contraseña son requeridos',
                    code: 'MISSING_FIELDS'
                });
                return;
            }

            const newUser = await authService.registerUser(email, password, role || 'ADMIN');
            res.status(201).json({ success: true, data: newUser });
        } catch (error: any) {
            console.error('Register error:', error);

            if (error.message === 'USER_EXISTS') {
                res.status(400).json({ 
                    success: false, 
                    message: 'El usuario ya existe',
                    code: 'USER_EXISTS'
                });
                return;
            }

            res.status(500).json({ 
                success: false, 
                message: 'Error al registrar usuario',
                code: 'REGISTER_ERROR'
            });
        }
    }
);

// GET - Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ 
                success: false, 
                message: 'No autenticado',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        const user = await authService.getUserById(req.user.id);
        
        if (!user) {
            res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
            return;
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener perfil',
            code: 'PROFILE_ERROR'
        });
    }
});

// POST - Cambiar contraseña
router.post('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            res.status(400).json({ 
                success: false, 
                message: 'Contraseñas requeridas',
                code: 'MISSING_PASSWORDS'
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({ 
                success: false, 
                message: 'No autenticado',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        await authService.changePassword(req.user.id, oldPassword, newPassword);
        res.json({ 
            success: true, 
            message: 'Contraseña actualizada correctamente',
            code: 'PASSWORD_CHANGED'
        });
    } catch (error: any) {
        console.error('Change password error:', error);

        if (error.message === 'INVALID_PASSWORD') {
            res.status(400).json({ 
                success: false, 
                message: 'Contraseña actual incorrecta',
                code: 'INVALID_PASSWORD'
            });
            return;
        }

        res.status(500).json({ 
            success: false, 
            message: 'Error al cambiar contraseña',
            code: 'CHANGE_PASSWORD_ERROR'
        });
    }
});

export default router;