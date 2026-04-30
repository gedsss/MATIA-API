import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService.js';
import type { LoginRequestDTO } from '../dtos/AuthDTO.js';

// 🌟 CONFIGURAÇÃO CORRIGIDA DO COOKIE
const COOKIE_OPTIONS = {
    path: '/',
    httpOnly: true,
    // Se o seu NODE_ENV não estiver como 'production', ele será false
    secure: process.env.NODE_ENV === 'production',

    // MUDANÇA AQUI: 'lax' permite que o cookie seja enviado entre portas diferentes (4200 -> 3000)
    sameSite: 'lax' as const,

    maxAge: 7 * 24 * 60 * 60 * 1000
};

export class AuthController {

    // 1. LOGIN FASE 1: Credenciais
    static async login(request: FastifyRequest, reply: FastifyReply) {
        const credentials = request.body as LoginRequestDTO;
        const result = await AuthService.login(credentials);

        // 🌟 SE GEROU REFRESH TOKEN (Ou seja, não pediu 2FA), SETA O COOKIE
        if (result.refreshToken) {
            reply.setCookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
            delete result.refreshToken; // Remove do corpo para não ir pro Angular
        }

        return reply.status(200).send({
            success: true,
            message: result.requires_2fa ? result.message : 'Login realizado com sucesso',
            ...result
        });
    }

    // 2. LOGIN FASE 2: Validação TOTP (6 dígitos)
    static async login2FA(request: FastifyRequest, reply: FastifyReply) {
        const { preAuthToken, token2fa } = request.body as { preAuthToken: string, token2fa: string };

        if (!preAuthToken || !token2fa) {
            return reply.status(400).send({
                success: false,
                message: 'Token temporário e código 2FA são obrigatórios'
            });
        }

        const result = await AuthService.login2FA(preAuthToken, token2fa);

        // 🌟 SETA O COOKIE APÓS O 2FA PASSAR
        if (result.refreshToken) {
            reply.setCookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
            delete result.refreshToken;
        }

        return reply.status(200).send({
            success: true,
            message: 'Autenticação 2FA realizada com sucesso',
            ...result
        });
    }

    // 3. 🌟 NOVO: ROTA DE REFRESH TOKEN
    static async refreshToken(request: FastifyRequest, reply: FastifyReply) {
        // Pega o token invisível que o navegador enviou automaticamente
        const tokenFromCookie = request.cookies.refreshToken;

        if (!tokenFromCookie) {
            return reply.status(401).send({
                success: false,
                message: 'Refresh token não encontrado. Faça login novamente.'
            });
        }

        // Chama o nosso AuthService para validar no banco
        const result = await AuthService.refreshAccessToken(tokenFromCookie);

        // Atualiza o cookie com o novo Refresh Token de 7 dias
        if (result.refreshToken) {
            reply.setCookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
            delete result.refreshToken;
        }

        return reply.status(200).send({
            success: true,
            message: 'Sessão renovada com sucesso',
            ...result // Devolve o novo Access Token de 15 min pro Angular
        });
    }

    // 4. SETUP: Gerar o QR Code
    static async setup2FA(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;
        const { email } = request.body as { email: string };

        const result = await AuthService.setup2FA(user.id, user.role, user.empresa_id, email || 'Usuário MATIA');

        return reply.status(200).send({
            success: true,
            ...result
        });
    }

    // 5. CONFIRMAR: Ativar definitivamente
    static async confirm2FA(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;
        const { token } = request.body as { token: string };

        if (!token) {
            return reply.status(400).send({ success: false, message: 'O código de 6 dígitos é obrigatório' });
        }

        const result = await AuthService.confirm2FA(user.id, user.role, user.empresa_id, token);
        return reply.status(200).send({ success: true, ...result });
    }

    // 6. STATUS: Verifica se o 2FA está ativo
    static async get2FAStatus(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;
        const result = await AuthService.get2FAStatus(user.id, user.role, user.empresa_id);

        return reply.status(200).send({ success: true, ...result });
    }

    // 7. DESATIVAR: Remove a proteção
    static async disable2FA(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;
        const { token } = request.body as { token: string };

        const result = await AuthService.disable2FA(user.id, user.role, user.empresa_id, token);
        return reply.status(200).send({ success: true, ...result });
    }

    // 8. 🌟 ATUALIZADO: LOGOUT (Mata o cookie)
    static async logout(request: FastifyRequest, reply: FastifyReply) {
        // Limpa o cookie do navegador
        reply.clearCookie('refreshToken', { path: '/' });

        // (Opcional) Se a sua função AuthService.logout() precisar do user para apagar no banco:
        // const user = (request as any).user;
        // if (user) await AuthService.logout(user.id, user.role, user.empresa_id);

        return reply.status(200).send({ success: true, message: 'Logout realizado com sucesso' });
    }

    static async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
        const { email } = request.body as { email: string };

        // O service cuida de verificar se o user existe e enviar o e-mail
        const result = await AuthService.forgotPassword(email);

        return reply.status(200).send({
            success: true,
            message: result.message
        });
    }

    static async resetPassword(request: FastifyRequest, reply: FastifyReply) {
        const { token, newPassword } = request.body as any;

        try {
            const result = await AuthService.resetPassword(token, newPassword);
            return reply.status(200).send({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            // Se o token for inválido ou expirar, cai aqui
            return reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    }

    // AuthController.ts

    static async changePassword(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { currentPassword, newPassword } = request.body as any;

            // O ID vem do token decodificado pelo seu middleware de auth
            const userId = (request.user as any).id;

            const result = await AuthService.changePassword(userId, currentPassword, newPassword);

            return reply.status(200).send({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    }
}