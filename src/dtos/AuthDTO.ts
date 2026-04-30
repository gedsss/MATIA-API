export interface LoginRequestDTO {
    email: string;
    profile_password: string; // O nome deve bater com o campo da tabela
}

export interface LoginResponseDTO {
    token: string;
    refreshToken?: string;
    user: {
        id: string;
        nome: string;
        email: string;
        role: 'SUPER-ADMIN' | 'ADMIN' | 'USER';
        empresa_id: string | null;
        avatar_url: string | null;
    };
}

// Usado para tipar o conteúdo decodificado do Token JWT dentro do backend
export interface JWTPayloadDTO {
    id: string;
    empresa_id: string | null;
    role: string;
    iat: number;
    exp: number;
}