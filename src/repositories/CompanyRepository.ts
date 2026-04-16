import {Sequelize, Transaction} from 'sequelize';
import  Company, {type CompanyCreationAttributes } from '../models/company.js';
import type { CreateCompanyDTO, UpdateCompanyDTO } from '../dtos/CompanyDTO.js';

export class CompanyRepository {

    // 🔍 BUSCAR TODAS COM CONTAGEM (Versão Dashboard)
    static async findAll(): Promise<Company[]> {
        return await Company.findAll({
            attributes: {
                include: [
                    // 🌟 Injetamos um campo virtual chamado 'userCount'
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM profile AS p
                            WHERE p.empresa_id = "Company".id
                        )`),
                        'usuarios_count'
                    ]
                ]
            },
            order: [['name', 'ASC']]
        });
    }

    // 🔍 BUSCAR POR ID (Também com contagem, se quiser exibir no detalhe)
    static async findById(id: string): Promise<Company | null> {
        return await Company.findByPk(id, {
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM profile AS p
                            WHERE p.empresa_id = "Company".id
                        )`),
                        'usuarios_count'
                    ]
                ]
            }
        });
    }

    // ➕ CRIAR (Sem 'any' e sem data manual!)
    static async create(data: CreateCompanyDTO, transaction?: Transaction): Promise<Company> {
        // O TypeScript agora aceita este objeto porque 'data_cadastro' é opcional no Model
        const companyData: CompanyCreationAttributes = {
            name: data.name,
            code: data.code,
            cnpj: data.cnpj,
            email: data.email,
            phone: data.phone,
            plano: data.plano,
            active: data.active ?? true
            // O Sequelize/Banco cuidará do id e da data_cadastro sozinho
        };

        return await Company.create(companyData, { transaction });
    }

    // 📝 ATUALIZAR
    static async update(id: string, data: UpdateCompanyDTO): Promise<Company | null> {
        const empresa = await Company.findByPk(id);

        if (!empresa) return null;

        // O .update() do Sequelize já aceita o DTO parcial com segurança
        await empresa.update(data);

        return empresa;
    }

    // 🗑️ DELETAR
    static async delete(id: string): Promise<number> {
        return await Company.destroy({ where: { id } });
    }
}