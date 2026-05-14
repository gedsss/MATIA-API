import crypto from 'node:crypto'; // Para o token do e-mail
import { UserRepository } from '../repositories/UserRepository.js';
import type { LoginRequestDTO, LoginResponseDTO } from '../dtos/AuthDTO.js';
import { UnauthorizedError, InternalServerError, InvalideCredentialsError } from '../errors/errors.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
import Profile from "../models/profile.js";
import {MailService} from "..services/MailService.js";
import {Op} from "sequelize";

export class AuthService {

    // 1. LOGIN FASE 1: Credenciais
    static async login(data: LoginRequestDTO): Promise<any> {
        const userInstance = await UserRepository.findByEmail(data.email);
        if (!userInstance) throw new UnauthorizedError('Credenciais inválidas');

        const user = userInstance.get({ plain: true });

        const passwordMatch = await bcrypt.compare(data.profile_password, user.profile_password);
        if (!passwordMatch) throw new InvalideCredentialsError();

        if (user.two_factor_enabled) {
            const preAuthToken = jwt.sign(
                { id: user.id, isPreAuth: true },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '5m' }
            );

            return {
                requires_2fa: true,
                message: 'Código de autenticação necessário',
                preAuthToken
            };
        }

        return this.generateFinalTokens(user);
    }

    // 2. LOGIN FASE 2: Verificação do Código TOTP
    static async login2FA(preAuthToken: string, token2fa: string | number): Promise<LoginResponseDTO> {
        try {
            const decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET || 'secret_key') as any;
            if (!decoded.isPreAuth) throw new UnauthorizedError('Token inválido');

            const userInstance = await UserRepository.findByIdForAuth(decoded.id);
            if (!userInstance) throw new UnauthorizedError('Usuário não encontrado');

            const user = userInstance.get({ plain: true });

            if (!user.two_factor_secret) {
                throw new UnauthorizedError('Configuração 2FA não encontrada');
            }
            const cleanToken = String(token2fa).trim();

            const isValid = this.verifyTOTP(cleanToken, user.two_factor_secret, user.email);

            if (!isValid) throw new UnauthorizedError('Código 2FA inválido ou expirado');

            return this.generateFinalTokens(user);

        } catch (error) {
            if (error instanceof UnauthorizedError) throw error;
            throw new UnauthorizedError('Sessão expirada. Tente logar novamente.');
        }
    }

    // 3. SETUP: Gerar Secret e QR Code (🌟 INJETADO ROLE E TIPAGEM NULL)
    static async setup2FA(userId: string, role: string, empresaId: string | null, email: string): Promise<{ qrCodeDataUrl: string, secret: string }> {
        const secret = new OTPAuth.Secret({ size: 20 }).base32;
        const totp = new OTPAuth.TOTP({
            issuer: 'Matia SaaS',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret),
        });

        const qrCodeDataUrl = await QRCode.toDataURL(totp.toString());

        await UserRepository.update(userId, role, empresaId, { two_factor_secret: secret } as any);

        return { qrCodeDataUrl, secret };
    }

    // 4. CONFIRMAÇÃO: Ativar o 2FA definitivamente (🌟 INJETADO ROLE E TIPAGEM NULL)
    static async confirm2FA(userId: string, role: string, empresaId: string | null, token: string): Promise<{ message: string }> {
        const userInstance = await UserRepository.findByIdWithSecret(userId, role, empresaId);

        if (!userInstance) {
            throw new InternalServerError('Usuário não encontrado.');
        }

        const user = userInstance.get({ plain: true });

        if (!user.two_factor_secret) {
            throw new InternalServerError('Setup de 2FA não iniciado.');
        }

        const isValid = this.verifyTOTP(token, user.two_factor_secret, user.email);

        if (!isValid) throw new UnauthorizedError('Código de confirmação inválido.');

        await UserRepository.update(userId, role, empresaId, { two_factor_enabled: true } as any);

        return { message: '2FA ativado com sucesso!' };
    }

    // 5. DESATIVAR: Remover proteção 2FA (🌟 INJETADO ROLE E TIPAGEM NULL)
    static async disable2FA(userId: string, role: string, empresaId: string | null, token: string): Promise<{ message: string }> {
        const userInstance = await UserRepository.findById(userId, role, empresaId);

        if (!userInstance || !userInstance.two_factor_secret) {
            throw new UnauthorizedError('Usuário não encontrado ou 2FA não configurado');
        }

        const user = userInstance.get({ plain: true });
        const isValid = this.verifyTOTP(token, user.two_factor_secret!, user.email);

        if (!isValid) throw new UnauthorizedError('Código inválido. Não foi possível desativar.');

        await UserRepository.update(userId, role, empresaId, {
            two_factor_enabled: false,
            two_factor_secret: null
        } as any);

        return { message: '2FA desativado.' };
    }

    // 6. STATUS (🌟 INJETADO ROLE E TIPAGEM NULL)
    static async get2FAStatus(userId: string, role: string, empresaId: string | null): Promise<{ enabled: boolean }> {
        const user = await UserRepository.findById(userId, role, empresaId);
        return { enabled: !!user?.two_factor_enabled };
    }

    private static verifyTOTP(token: string, secret: string, email: string): boolean {
        const totp = new OTPAuth.TOTP({
            issuer: 'Matia SaaS',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret),
        });

        const delta = totp.validate({ token, window: 2 });
        return delta !== null;
    }
    private static async generateFinalTokens(user: any): Promise<LoginResponseDTO> {
        // Atualiza o último acesso (mantendo sua lógica original)
        await UserRepository.updateLastAccess(user.id);

        const payload = {
            id: user.id,
            empresa_id: user.empresa_id,
            role: user.role
        };

        // Access Token: Curto (15 minutos) - O Front-end usa no Header
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '15m' }
        );

        // Refresh Token: Longo (7 dias) - O navegador guarda no Cookie
        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
            { expiresIn: '7d' }
        );

        // Salva o Refresh Token no banco de dados
        await UserRepository.updateRefreshToken(user.id, user.role, user.empresa_id, refreshToken);

        return {
            token,
            refreshToken, // Retorna para o Controller criar o Cookie
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role as 'SUPER-ADMIN' | 'ADMIN' | 'USER',
                empresa_id: user.empresa_id,
                avatar_url: user.avatar_url,
                primeiro_acesso: user.primeiro_acesso
            }
        };
    }

    // 2. VALIDAÇÃO E RENOVAÇÃO DO TOKEN (Adicione esta nova função)
    static async refreshAccessToken(tokenFromCookie: string): Promise<LoginResponseDTO> {
        if (!tokenFromCookie) {
            throw new Error('Refresh token não fornecido. Faça login novamente.');
        }

        try {
            // 1. Verifica se a assinatura do token é válida e se ele não expirou (matemática do JWT)
            const decoded = jwt.verify(
                tokenFromCookie,
                process.env.JWT_REFRESH_SECRET || 'refresh_secret_key'
            ) as any;

            // 2. Busca o usuário no banco usando os dados do payload
            // O seu método findById usa .unscoped(), então ele já traz o refresh_token oculto
            const userInstance = await UserRepository.findById(decoded.id, decoded.role, decoded.empresa_id);

            if (!userInstance) {
                throw new Error('Usuário não encontrado.');
            }

            const user = userInstance.get({ plain: true });

            // 3. A VERIFICAÇÃO DE OURO: O token do cookie bate exatamente com o do banco?
            if (user.refresh_token !== tokenFromCookie) {
                throw new Error('Sessão inválida ou revogada. Faça login novamente.');
            }

            // 4. Tudo válido! Gera novos tokens (renovando por mais 15m e 7d) e atualiza o banco
            return await this.generateFinalTokens(user);

        } catch (error) {
            // Cai aqui se o token passou dos 7 dias, foi adulterado, ou se os checks acima falharem
            throw new Error('Sessão expirada ou inválida. Faça login novamente.');
        }
    }

    static async forgotPassword(email: string) {
        const user = await Profile.findOne({ where: { email } });
        if (!user) return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' };

        // 1. Gera o token (O que estava dando erro de types)
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        // 2. Salva no banco
        await user.update({
            password_reset_token: token,
            password_reset_expires: expires
        });

        // 3. Envia o e-mail
        await MailService.sendPasswordResetEmail(user.email, token);

        return { message: 'Se o e-mail existir, um link de recuperação foi enviado.' };
    }

    static async resetPassword(token: string, newPassword: string) {
        // 1. Busca o usuário pelo token e verifica se não expirou
        const user = await Profile.findOne({
            where: {
                password_reset_token: token,
                password_reset_expires: { [Op.gt]: new Date() } // Op.gt = Maior que agora
            }
        });

        if (!user) throw new Error('Token inválido ou expirado.');

        // 2. Gera o Hash da nova senha com bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Atualiza a senha e limpa o token
        await user.update({
            profile_password: hashedPassword,
            password_reset_token: null,
            password_reset_expires: null
        });

        return { message: 'Senha alterada com sucesso!' };
    }

   //altera a senha com usuário logado
    static async changePassword(userId: string, currentPassword: string, newPassword: string) {
        // 1. Busca o usuário pelo ID
        const user = await Profile.unscoped().findByPk(userId);
        if (!user) throw new Error('Usuário não encontrado.');

        // 2. Verifica se a senha atual está correta
        const isPasswordValid = await bcrypt.compare(currentPassword, user.profile_password);
        if (!isPasswordValid) throw new Error('A senha atual está incorreta.');

        // 3. Gera o hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Atualiza no banco
        await user.update({
            profile_password: hashedPassword
        });

        return { message: 'Senha alterada com sucesso!' };
    }


    //  Troca de senha obrigatória do Primeiro Acesso
    static async changeFirstAccessPassword(userId: string, currentPassword: string, newPassword: string) {
        // 1. Busca o usuário pelo ID (usamos unscoped para o Sequelize trazer o hash da senha)
        const user = await Profile.unscoped().findByPk(userId);
        if (!user) throw new InternalServerError('Usuário não encontrado.');

        // 2. Verifica se a senha temporária informada está correta
        const isPasswordValid = await bcrypt.compare(currentPassword, user.profile_password);
        if (!isPasswordValid) throw new UnauthorizedError('A senha atual está incorreta.');

        // 3. Gera o hash da NOVA senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Dispara a atualização dupla lá no nosso Repository!
        await UserRepository.updatePasswordAndFirstAccess(userId, hashedPassword);

        return { message: 'Senha inicial alterada com sucesso! Acesso liberado.' };
    }

    static async logout(): Promise<{ message: string }> {
        return { message: 'Sessão encerrada com sucesso.' };
    }
}