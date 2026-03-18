import { Request, Response, NextFunction } from 'express';
import authService from '../service/AuthService';
import { JwtPayload } from '../types/user';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Middleware para verificar JWT
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ 
                success: false, 
                message: 'Token no proporcionado. Por favor inicie sesión.',
                code: 'NO_TOKEN'
            });
            return;
        }

        try {
            const decoded = authService.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({ 
                    success: false, 
                    message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.',
                    code: 'TOKEN_EXPIRED',
                    expiredAt: error.expiredAt
                });
                return;
            }
            res.status(403).json({ 
                success: false, 
                message: 'Token inválido. Por favor inicie sesión nuevamente.',
                code: 'INVALID_TOKEN'
            });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al verificar autenticación',
            code: 'AUTH_ERROR'
        });
    }
};

// Middleware para verificar roles
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ 
                success: false, 
                message: 'No autenticado',
                code: 'NOT_AUTHENTICATED'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para realizar esta acción',
                code: 'INSUFFICIENT_PERMISSIONS',
                requiredRoles: roles,
                userRole: req.user.role
            });
            return;
        }

        next();
    };
};