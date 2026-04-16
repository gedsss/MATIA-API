import { UserRepository } from '../repositories/UserRepository.js';
import type { LoginRequestDTO, LoginResponseDTO } from '../dtos/AuthDTO.js';
import { UnauthorizedError, InternalServerError, InvalideCredentialsError } from '../errors/errors.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';

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
        await UserRepository.updateLastAccess(user.id);
        const token = jwt.sign(
            { id: user.id, empresa_id: user.empresa_id, role: user.role },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '8h' }
        );

        return {
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role as 'SUPER-ADMIN' | 'ADMIN' | 'USER',
                empresa_id: user.empresa_id,
                avatar_url: user.avatar_url
            }
        };
    }

    static async logout(): Promise<{ message: string }> {
        return { message: 'Sessão encerrada com sucesso.' };
    }
}