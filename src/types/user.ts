export interface User {
    id?: number;
    email: string;
    password?: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
    is_active?: boolean;
    created_at?: Date;
    updated_at?: Date;
    last_login?: Date;
}

export interface JwtPayload {
    id: number;
    email: string;
    role: string;
}

export interface AuthResponse {
    token: string;
    refreshToken?: string;
    expiresIn?: string;
    expiresAt?: Date;
    user: {
        id: number;
        email: string;
        role: string;
    };
}