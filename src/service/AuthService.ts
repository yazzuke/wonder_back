import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, JwtPayload, AuthResponse } from '../types/user';

export class AuthService {
    private readonly JWT_SECRET: string;
    private readonly JWT_EXPIRES_IN: string;
    private readonly JWT_REFRESH_SECRET: string;
    private readonly JWT_REFRESH_EXPIRES_IN: string;

    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
        this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
        this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    }

    // Registrar nuevo usuario (solo SUPER_ADMIN puede hacerlo)
    async registerUser(email: string, password: string, role: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'): Promise<User> {
        try {
            // Verificar si el usuario ya existe
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                throw new Error('USER_EXISTS');
            }

            // Hash del password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar usuario
            const result = await pool.query(
                `INSERT INTO users (email, password, role) 
                 VALUES ($1, $2, $3) 
                 RETURNING id, email, role, is_active, created_at`,
                [email, hashedPassword, role]
            );

            const user = result.rows[0];
            delete user.password; // No devolver el password
            return user;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    // Login de usuario mejorado
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            // Buscar usuario por email
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1 AND is_active = true',
                [email]
            );

            if (result.rows.length === 0) {
                throw new Error('INVALID_CREDENTIALS');
            }

            const user = result.rows[0];

            // Verificar password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error('INVALID_CREDENTIALS');
            }

            // Actualizar último login
            await pool.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            // Generar tokens
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = this.generateAccessToken(tokenPayload);
            const refreshToken = this.generateRefreshToken(tokenPayload);

            // Obtener información de expiración
            const decodedToken = jwt.decode(accessToken) as any;
            const expiresAt = new Date(decodedToken.exp * 1000);

            return {
                token: accessToken,
                refreshToken,
                expiresIn: this.JWT_EXPIRES_IN,
                expiresAt,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    }

    // Generar access token (corta duración)
    private generateAccessToken(payload: JwtPayload): string {
        return jwt.sign(
            payload, 
            this.JWT_SECRET, 
            { expiresIn: '1h' } // Usar valor literal para evitar problemas de tipos
        );
    }

    // Generar refresh token (larga duración)
    private generateRefreshToken(payload: JwtPayload): string {
        return jwt.sign(
            payload,
            this.JWT_REFRESH_SECRET,
            { expiresIn: '7d' } // Usar valor literal para evitar problemas de tipos
        );
    }

    // Renovar token usando refresh token
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        try {
            // Verificar refresh token
            const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JwtPayload;
            
            // Verificar que el usuario aún existe y está activo
            const result = await pool.query(
                'SELECT * FROM users WHERE id = $1 AND is_active = true',
                [decoded.id]
            );

            if (result.rows.length === 0) {
                throw new Error('USER_NOT_FOUND');
            }

            const user = result.rows[0];

            // Generar nuevos tokens
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const newAccessToken = this.generateAccessToken(tokenPayload);
            const newRefreshToken = this.generateRefreshToken(tokenPayload);

            // Obtener información de expiración
            const decodedToken = jwt.decode(newAccessToken) as any;
            const expiresAt = new Date(decodedToken.exp * 1000);

            return {
                token: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: this.JWT_EXPIRES_IN,
                expiresAt,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('REFRESH_TOKEN_EXPIRED');
            }
            throw new Error('INVALID_REFRESH_TOKEN');
        }
    }

    // Verificar JWT token con mejor manejo de errores
    verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw error; // Propagar el error para manejarlo en el middleware
            }
            throw new Error('INVALID_TOKEN');
        }
    }

    // Verificar estado del token
    checkTokenStatus(token: string): { valid: boolean; expired: boolean; expiresAt?: Date } {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as any;
            return {
                valid: true,
                expired: false,
                expiresAt: new Date(decoded.exp * 1000)
            };
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                return {
                    valid: false,
                    expired: true,
                    expiresAt: new Date(error.expiredAt)
                };
            }
            return {
                valid: false,
                expired: false
            };
        }
    }

    // Obtener usuario por ID
    async getUserById(id: number): Promise<User | null> {
        const result = await pool.query(
            'SELECT id, email, role, is_active, created_at, last_login FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    // Cambiar contraseña
    async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
        try {
            const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
            
            if (result.rows.length === 0) {
                throw new Error('USER_NOT_FOUND');
            }

            const user = result.rows[0];
            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

            if (!isPasswordValid) {
                throw new Error('INVALID_PASSWORD');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', 
                [hashedPassword, userId]
            );

            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
}

export default new AuthService();