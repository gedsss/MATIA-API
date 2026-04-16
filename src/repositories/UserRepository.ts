import type { Transaction } from 'sequelize';
import Profile from '../models/profile.js';
import type { ProfileAttributes, ProfileCreationAttributes } from '../models/profile.js';
import type { CreateUserDTO, UpdateUserDTO } from '../dtos/UserDTO.js';

export class UserRepository {

    static async findAllByEmpresa(empresaId: string): Promise<Profile[]> {
        return await Profile.findAll({
            where: { empresa_id: empresaId },
            order: [['nome', 'ASC']]
        });
    }

    static async findByIdAndEmpresa(id: string, empresaId: string): Promise<Profile | null> {
        return await Profile.findOne({
            where: { id, empresa_id: empresaId }
        });
    }

    static async findByEmail(email: string): Promise<Profile | null> {
        // O .unscoped() força o Sequelize a ignorar o "exclude" do Model
        return await Profile.unscoped().findOne({
            where: { email }
        });
    }


    static async create(data: CreateUserDTO, transaction?: Transaction): Promise<Profile> {
        // 1. Tratamento da data para evitar erro de fuso horário/formato
        const dataNascimento = data.data_nascimento ? new Date(data.data_nascimento) : null;

        // 2. Montamos o objeto garantindo que o vínculo da empresa está presente
        const profileData = {
            ...data,
            data_nascimento: dataNascimento,
            profile_password: data.profile_password,
            // Forçamos o mapeamento do empresa_id para garantir que o Sequelize veja a coluna
            empresa_id: data.empresa_id
        };

        // 3. Executamos o Create com 'as any' para evitar erro de tipagem TS2345
        // E usamos returning: true para o Postgres devolver o objeto completo
        return await Profile.create(profileData as any, {
            transaction,
            returning: true
        });
    }
    static async update(id: string, empresaId: string, data: UpdateUserDTO): Promise<Profile | null> {
        const updatePayload: any = { ...data };
        // 🚨 O Ponto Crítico: Se o Angular mandou uma string de data, convertemos para Date
        if (data.data_nascimento) {
            updatePayload.data_nascimento = new Date(data.data_nascimento);
        }
        const [affectedRows] = await Profile.update(updatePayload, {
            where: { id, empresa_id: empresaId }
        });
        if (affectedRows === 0) return null;
        return this.findByIdAndEmpresa(id, empresaId);
    }

    // Método exclusivo para Auth/2FA (ignora as restrições do Model para pegar dados sensíveis)
    static async findByIdForAuth(id: string): Promise<Profile | null> {
        return await Profile.unscoped().findOne({
            where: { id }
        });
    }

    static async delete(id: string, empresaId: string): Promise<number> {
        return await Profile.destroy({
            where: { id, empresa_id: empresaId }
        });
    }

    static async updateLastAccess(id: string): Promise<void> {
        await Profile.update(
            { ultimo_acesso: new Date() }, // Valor novo
            { where: { id } }
        );
    }

// 1. Busca padrão por ID e Empresa (Segurança Multi-tenant)
    static async findById(id: string, empresaId: string) {
        // O .unscoped() força o Sequelize a trazer o two_factor_secret que está escondido
        return await Profile.unscoped().findOne({
            where: {
                id: id,
                empresa_id: empresaId
            }
        });
    }

    static async findByIdWithSecret(id: string, empresaId: string) {
        return await Profile.unscoped().findOne({
            where: { id, empresa_id: empresaId },
            attributes: { include: ['two_factor_secret'] } // Força a inclusão mesmo que o scope exclua
        });
    }


}