import { Op } from 'sequelize'; // 🌟 IMPORTANTE: Importação dos operadores do Sequelize
import type { Transaction } from 'sequelize';
import Profile from '../models/profile.js';
import type { ProfileAttributes, ProfileCreationAttributes } from '../models/profile.js';
import type { CreateUserDTO, UpdateUserDTO } from '../dtos/UserDTO.js';

export class UserRepository {

    // 1. 🌟 LISTAGEM INTELIGENTE (Raio-X do SUPER-ADMIN)
    static async findAllUsers(role: string, empresaId: string | null): Promise<Profile[]> {
        const queryWhere: any = {};

        if (role !== 'SUPER-ADMIN') {
            // Se não for o dono do sistema, tranca o usuário na própria empresa
            queryWhere.empresa_id = empresaId;
            // E garante que ele nunca veja quem são os SUPER-ADMINS
            queryWhere.role = { [Op.ne]: 'SUPER-ADMIN' };
        }

        return await Profile.findAll({
            where: queryWhere,
            order: [['nome', 'ASC']]
        });
    }

    // 2. 🌟 BUSCA POR ID INTELIGENTE
    static async findByIdAndEmpresa(id: string, role: string, empresaId: string | null): Promise<Profile | null> {
        const queryWhere: any = { id };

        if (role !== 'SUPER-ADMIN') {
            queryWhere.empresa_id = empresaId;
        }

        return await Profile.findOne({
            where: queryWhere
        });
    }

    static async findByEmail(email: string): Promise<Profile | null> {
        // O .unscoped() força o Sequelize a ignorar o "exclude" do Model
        return await Profile.unscoped().findOne({
            where: { email }
        });
    }

    static async create(data: CreateUserDTO, transaction?: Transaction): Promise<Profile> {
        const dataNascimento = data.data_nascimento ? new Date(data.data_nascimento) : null;

        const profileData = {
            ...data,
            data_nascimento: dataNascimento,
            profile_password: data.profile_password,
            empresa_id: data.empresa_id
        };

        return await Profile.create(profileData as any, {
            transaction,
            returning: true
        });
    }

    // 3. 🌟 UPDATE INTELIGENTE
    static async update(id: string, role: string, empresaId: string | null, data: UpdateUserDTO): Promise<Profile | null> {
        const updatePayload: any = { ...data };

        if (data.data_nascimento) {
            updatePayload.data_nascimento = new Date(data.data_nascimento);
        }

        const queryWhere: any = { id };

        if (role !== 'SUPER-ADMIN') {
            queryWhere.empresa_id = empresaId;
        }

        const [affectedRows] = await Profile.update(updatePayload, {
            where: queryWhere
        });

        if (affectedRows === 0) return null;
        return this.findByIdAndEmpresa(id, role, empresaId);
    }

    static async findByIdForAuth(id: string): Promise<Profile | null> {
        return await Profile.unscoped().findOne({
            where: { id }
        });
    }

    // 4. 🌟 DELETE INTELIGENTE
    static async delete(id: string, role: string, empresaId: string | null): Promise<number> {
        const queryWhere: any = { id };

        if (role !== 'SUPER-ADMIN') {
            queryWhere.empresa_id = empresaId;
        }

        return await Profile.destroy({
            where: queryWhere
        });
    }

    static async updateLastAccess(id: string): Promise<void> {
        await Profile.update(
            { ultimo_acesso: new Date() },
            { where: { id } }
        );
    }

    // 5. 🌟 BUSCA DESCOBERTA (2FA e Permissões) INTELIGENTE
    static async findById(id: string, role: string, empresaId: string | null) {
        const queryWhere: any = { id };
        if (role !== 'SUPER-ADMIN') queryWhere.empresa_id = empresaId;

        return await Profile.unscoped().findOne({
            where: queryWhere
        });
    }

    static async findByIdWithSecret(id: string, role: string, empresaId: string | null) {
        const queryWhere: any = { id };
        if (role !== 'SUPER-ADMIN') queryWhere.empresa_id = empresaId;

        return await Profile.unscoped().findOne({
            where: queryWhere,
            attributes: { include: ['two_factor_secret'] }
        });
    }

    static async updateRefreshToken(id: string, role: string, empresaId: string | null, token: string | null): Promise<void> {
        const queryWhere: any = { id };

        // Se não for super-admin, aplica a busca por id da empresa
        if (role !== 'SUPER-ADMIN') {
            queryWhere.empresa_id = empresaId;
        }

        await Profile.update(
            { refresh_token: token } as any,
            { where: queryWhere }
        );
    }
}