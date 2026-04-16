import type { FastifyInstance } from 'fastify'
import { loginSchema } from "../schemas/authSchema.js";
import { AuthController } from "../controllers/AuthController.js";
import {ProfileController} from "@/controllers/ProfileController.js";

const loginRoutes = async (fastify: FastifyInstance) => {

    // 1. LOGIN FASE 1: Credenciais
    fastify.post(
        '/login',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Realiza login e retorna token JWT (ou preAuthToken se 2FA estiver ativo)',
                body: loginSchema.body,
            },
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: '15 minutes',
                },
            },
        },
        AuthController.login
    )

    // 2. LOGIN FASE 2: Validação TOTP (6 dígitos)
    fastify.post(
        '/login-2fa',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Valida o código de 6 dígitos e retorna o JWT final',
                body: {
                    type: 'object',
                    required: ['preAuthToken', 'token2fa'],
                    properties: {
                        preAuthToken: { type: 'string' },
                        token2fa: { type: 'string', minLength: 6, maxLength: 6 }
                    }
                }
            },
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: '5 minutes',
                },
            },
        },
        AuthController.login2FA
    )

    // 3. SETUP: Gerar o QR Code (Precisa estar logado)
    fastify.post(
        '/setup-2fa',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Gera o QR Code e a chave secreta para configurar o 2FA',
            },
            preHandler: [fastify.authenticate],
        },
        AuthController.setup2FA
    )

    // 4. CONFIRMAR: Ativar definitivamente o 2FA
    fastify.post(
        '/confirm-2fa',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Valida o primeiro código e ativa o 2FA no banco',
                body: {
                    type: 'object',
                    required: ['token'],
                    properties: {
                        token: { type: 'string', minLength: 6, maxLength: 6 }
                    }
                }
            },
            preHandler: [fastify.authenticate],
        },
        AuthController.confirm2FA
    )

    // 5. STATUS: Verifica se o 2FA está ativo
    fastify.get(
        '/2fa-status',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Retorna se o utilizador atual tem o 2FA ativo',
            },
            preHandler: [fastify.authenticate],
        },
        AuthController.get2FAStatus
    )

    // 6. DESATIVAR: Remover a proteção
    fastify.post(
        '/disable-2fa',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Desativa o 2FA (exige o código atual por segurança)',
                body: {
                    type: 'object',
                    required: ['token'],
                    properties: {
                        token: { type: 'string', minLength: 6, maxLength: 6 }
                    }
                }
            },
            preHandler: [fastify.authenticate],
        },
        AuthController.disable2FA
    )

    // 7. LOGOUT
    fastify.post(
        '/logout',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Encerra a sessão do utilizador',
            },
            preHandler: [fastify.authenticate],
        },
        AuthController.logout
    )
}

export default loginRoutes