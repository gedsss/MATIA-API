import { CompanyRepository } from "..repositories/CompanyRepository.js";
// 🌟 Importe os seus erros específicos
import {
    UserNotFoundError,
    ConflictError,
    InternalServerError,
    DuplicateEmailError // Use este para e-mail duplicado!
} from "..errors/errors.js";
import { CompanyResponseDTO, CreateCompanyDTO, UpdateCompanyDTO } from "..dtos/CompanyDTO.js";
import { CreateUserDTO } from "..dtos/UserDTO.js";
import Company from "..models/company.js";
import { UserRepository } from "..repositories/UserRepository.js";
import sequelize from "..db.js";
import bcrypt from "bcryptjs";
import {ValidationError} from "sequelize";

export class CompanyService {

    private static mapToResponseDTO(company: Company): CompanyResponseDTO {
        const raw = company.get({ plain: true }) as any;
        return {
            id: raw.id,
            name: raw.name,
            code: raw.code,
            cnpj: raw.cnpj,
            email: raw.email,
            phone: raw.phone,
            active: raw.active ?? true,
            data_cadastro: new Date(raw.data_cadastro),
            usuarios_count: Number(raw.usuarios_count || 0),
            consulta_mes: Number(raw.consulta_mes ?? 0),
            custo_mes: Number(raw.custo_mes ?? 0),
            plano: raw.plano,
            created_at: raw.created_at,
            updated_at: raw.updated_at
        };
    }

    static async registrarNovaEmpresa(
        companyData: CreateCompanyDTO,
        adminData: CreateUserDTO
    ): Promise<{ empresa: CompanyResponseDTO, admin: any }> {

        const emailExiste = await UserRepository.findByEmail(adminData.email);
        if (emailExiste) {
            // 🌟 Usando sua classe específica que já define o 409 e a mensagem
            throw new DuplicateEmailError(adminData.email);
        }

        const transaction = await sequelize.transaction();

        try {
            const novaEmpresa = await CompanyRepository.create(companyData, transaction);
            if (!novaEmpresa.id) throw new Error('Erro ao gerar ID da empresa.');

            if (!adminData.profile_password) {
                throw new Error('A senha do administrador é obrigatória.');
            }
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(adminData.profile_password, salt);

            const adminPayload: CreateUserDTO = {
                ...adminData,
                profile_password: hashedPassword,
                empresa_id: novaEmpresa.id,
                role: 'ADMIN',
                status: 'ativo'
            };

            const novoAdmin = await UserRepository.create(adminPayload, transaction);
            await transaction.commit();

            const adminPlain = novoAdmin.get({ plain: true });

            return {
                empresa: this.mapToResponseDTO(novaEmpresa),
                admin: {
                    id: adminPlain.id,
                    nome: adminPlain.nome,
                    email: adminPlain.email,
                    role: adminPlain.role,
                    empresa_id: adminPlain.empresa_id
                }
            };

        } catch (error: any) {
            if (transaction) await transaction.rollback();
            console.error(`[CompanyService] Erro crítico no registro: ${error.message}`);

            // 🌟 Se já for um erro que a gente tratou, só repassa
            if (error instanceof ConflictError || error instanceof ValidationError) throw error;

            // 🌟 Sua classe InternalServerError já define o status 500 sozinha!
            throw new InternalServerError('Falha ao registrar empresa e administrador.', { originalError: error.message });
        }
    }

    static async listarTodas(): Promise<CompanyResponseDTO[]> {
        const empresas = await CompanyRepository.findAll();
        return empresas.map(empresa => this.mapToResponseDTO(empresa));
    }

    static async buscarPorId(id: string): Promise<CompanyResponseDTO> {
        const empresa = await CompanyRepository.findById(id);
        // 🌟 Usando seu UserNotFoundError (que recebe o identificador)
        if (!empresa) throw new UserNotFoundError(id);
        return this.mapToResponseDTO(empresa);
    }

    static async atualizar(id: string, data: UpdateCompanyDTO): Promise<CompanyResponseDTO> {
        const atualizada = await CompanyRepository.update(id, data);
        if (!atualizada) throw new UserNotFoundError(id);
        return this.mapToResponseDTO(atualizada);
    }

    static async excluir(id: string): Promise<void> {
        const rowsDeleted = await CompanyRepository.delete(id);
        if (rowsDeleted === 0) throw new UserNotFoundError(id);
    }
}