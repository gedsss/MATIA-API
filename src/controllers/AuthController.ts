import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService.js';
import type { LoginRequestDTO } from '../dtos/AuthDTO.js';

export class AuthController {

    // 1. LOGIN FASE 1: Credenciais
    static async login(request: FastifyRequest, reply: FastifyReply) {
        const credentials = request.body as LoginRequestDTO;
        const result = await AuthService.login(credentials);

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
        return reply.status(200).send({
            success: true,
            message: 'Autenticação 2FA realizada com sucesso',
            ...result
        });
    }

    // 3. SETUP: Gerar o QR Code
    static async setup2FA(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user; // Injetado pelo middleware JWT
        const { email } = request.body as { email: string };

        // 🌟 CABO CONECTADO: Passando user.role
        const result = await AuthService.setup2FA(user.id, user.role, user.empresa_id, email || 'Usuário MATIA');

        return reply.status(200).send({
            success: true,
            ...result
        });
    }

    // 4. CONFIRMAR: Ativar definitivamente após validar código de teste
    static async confirm2FA(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;
        const { token } = request.body as { token: string };

        if (!token) {
            return reply.status(400).send({ success: false, message: 'O código de 6 dígitos é obrigatório' });
        }

        // 🌟 CABO CONECTADO: Passando user.role
        const result = await AuthService.confirm2FA(user.id, user.role, user.empresa_id, token);
        return reply.status(200).send({ success: true, ...result });
    }

    // 5. STATUS: Verifica se o 2FA está ativo (Para o Angular saber o que exibir)
    static async get2FAStatus(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;

        // 🌟 CABO CONECTADO: Passando user.role
        const result = await AuthService.get2FAStatus(user.id, user.role, user.empresa_id);

        return reply.status(200).send({ success: true, ...result });
    }

    // 6. DESATIVAR: Remove a proteção
    static async disable2FA(request: FastifyRequest, reply: FastifyReply) {
        const user = (request as any).user;
        const { token } = request.body as { token: string };

        // 🌟 CABO CONECTADO: Passando user.role
        const result = await AuthService.disable2FA(user.id, user.role, user.empresa_id, token);
        return reply.status(200).send({ success: true, ...result });
    }

    static async logout(request: FastifyRequest, reply: FastifyReply) {
        const result = await AuthService.logout();
        return reply.status(200).send({ success: true, ...result });
    }
}