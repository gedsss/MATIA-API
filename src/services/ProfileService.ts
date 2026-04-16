import { UserRepository } from '../repositories/UserRepository.js';
import type { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '../dtos/UserDTO.js';
import { ConflictError, UserNotFoundError, InternalServerError, DuplicateEmailError } from '../errors/errors.js';
import Profile from '../models/profile.js';
import bcrypt from 'bcryptjs'

export class ProfileService {
    /**
     * 🛠️ MAPPER PRIVADO
     * Garante que o retorno para o Frontend/Swagger seja limpo e tipado.
     */
    private static mapToResponseDTO(user: Profile): UserResponseDTO {
        // Usamos .get({ plain: true }) para evitar problemas de proxy do Sequelize
        const data = user.get({ plain: true }) as any;

        return {
            id: data.id,
            nome: data.nome,
            email: data.email,
            cpf: data.cpf,
            telefone: data.telefone,
            avatar_url: data.avatar_url ?? undefined,
            empresa_id: data.empresa_id, // 👈 Se vier null aqui, o erro está no Save do Repository
            area_juridica: data.area_juridica ?? 'Geral',
            permissoes: data.permissoes,
            role: data.role as 'SUPER-ADMIN' | 'ADMIN' | 'USER',
            status: data.status as 'ativo' | 'inativo',

            // Tratamento de Datas
            data_nascimento: data.data_nascimento ? new Date(data.data_nascimento) : new Date(),

            // O Sequelize usa creation_time conforme configuramos no Model Profile
            creation_time: data.creation_time || data.createdAt || new Date(),
            updated_at: data.updated_at || data.updatedAt || null,
            ultimo_acesso: data.ultimo_acesso ?? null
        };
    }

    /**
     * 🔍 BUSCAR POR ID
     */
    static async buscarPorId(id: string, empresaId: string): Promise<UserResponseDTO> {
        const usuario = await UserRepository.findByIdAndEmpresa(id, empresaId);
        if (!usuario) throw new UserNotFoundError();

        return this.mapToResponseDTO(usuario);
    }

    /**
     * 🔍 LISTAR POR EMPRESA
     */
    static async listarPorEmpresa(empresaId: string): Promise<UserResponseDTO[]> {
        const usuarios = await UserRepository.findAllByEmpresa(empresaId);
        return usuarios.map(u => this.mapToResponseDTO(u));
    }

    /**
     * ➕ CADASTRAR (Novo Usuário via Painel)
     */
    static async cadastrar(data: CreateUserDTO, empresaIdLogada: string): Promise<UserResponseDTO> {
        const emailExiste = await UserRepository.findByEmail(data.email);
        if (emailExiste) throw new DuplicateEmailError(data.email);

        // Criptografia
        const salt = await bcrypt.genSalt(12); // Aumentado para 12 para seguir o padrão do CompanyService
        const hashedPassword = await bcrypt.hash(data.profile_password!, salt);

        // 🚨 IMPORTANTE: Injetamos o empresaIdLogada explicitamente
        const novoUsuario = await UserRepository.create({
            ...data,
            profile_password: hashedPassword,
            empresa_id: empresaIdLogada // Garante o vínculo Multi-tenant
        });

        return this.mapToResponseDTO(novoUsuario);
    }

    /**
     * 📝 ATUALIZAR
     */
    static async atualizar(id: string, empresaId: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
        // Se houver troca de senha, criptografamos a nova
        if (data.profile_password) {
            const salt = await bcrypt.genSalt(12);
            data.profile_password = await bcrypt.hash(data.profile_password, salt);
        }

        const atualizado = await UserRepository.update(id, empresaId, data);
        if (!atualizado) throw new UserNotFoundError();

        return this.mapToResponseDTO(atualizado);
    }

    /**
     * 🗑️ EXCLUIR
     */
    static async excluir(id: string, empresaId: string): Promise<void> {
        const rows = await UserRepository.delete(id, empresaId);
        if (rows === 0) throw new UserNotFoundError();
    }


     // 👤 BUSCAR MEU PERFIL (Rota /me)

    static async obterMeuPerfil(userId: string, empresaId: string): Promise<UserResponseDTO & { two_factor_enabled: boolean }> {
        const usuario = await UserRepository.findById(userId, empresaId);
        if (!usuario) throw new UserNotFoundError();
        const response = this.mapToResponseDTO(usuario);
        // O status do 2FA para o card do Angular
        return {
            ...response,
            two_factor_enabled: !!(usuario as any).two_factor_secret
        };
    }
}