import type { FastifyInstance } from 'fastify'
import { loginSchema } from "../schemas/authSchema.js";
import { AuthController } from "../controllers/AuthController.js";
import {ProfileController} from "../controllers/ProfileController.js";

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
    // ROTA DE REFRESH TOKEN
    fastify.post(
        '/refresh',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Renova o access token utilizando o refreshToken presente nos cookies',
                // Não precisamos de body schema aqui, pois o dado vem do Cookie
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                            token: { type: 'string' }, // O novo Access Token de 15 min
                            user: { type: 'object', additionalProperties: true }
                        }
                    }
                }
            },
            config: {
                rateLimit: {
                    max: 10, // Um pouco mais generoso que o login
                    timeWindow: '15 minutes',
                },
            },
        },
        AuthController.refreshToken
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

    // Rota: Solicitar Recuperação de Senha
    fastify.post(
        '/forgot-password',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Envia e-mail com token de recuperação de senha',
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email' }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' }
                        }
                    }
                }
            },
            config: {
                rateLimit: {
                    max: 3, // Mais restrito que o login por segurança
                    timeWindow: '15 minutes',
                },
            },
        },
        AuthController.forgotPassword
    );

// Rota: Resetar a Senha (Efetivar a troca)
    fastify.post(
        '/reset-password',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Redefine a senha do usuário utilizando o token enviado por e-mail',
                body: {
                    type: 'object',
                    required: ['token', 'newPassword'],
                    properties: {
                        token: { type: 'string' },
                        newPassword: { type: 'string', minLength: 6 }
                    }
                }
            }
        },
        AuthController.resetPassword
    );

    // authRoutes.ts (Dentro do escopo autenticado)

    fastify.post(
        '/change-password',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Altera a senha do usuário logado',
                body: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: { type: 'string' },
                        newPassword: { type: 'string', minLength: 6 }
                    }
                }
            },
            onRequest: [fastify.authenticate]
        },
        AuthController.changePassword
    );
    fastify.post(
        '/first-access',
        {
            schema: {
                tags: ['Auth'],
                summary: 'Altera a senha temporária obrigatória no primeiro acesso do usuário',
                body: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: { type: 'string' },
                        newPassword: { type: 'string', minLength: 6 }
                    }
                }
            },
            onRequest: [fastify.authenticate] // Garante que o usuário tem um token válido
        },
        AuthController.changeFirstAccessPassword
    );
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