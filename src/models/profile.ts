import type { Optional } from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import sequelize from '../db.js'

export interface ProfileAttributes {
    id: string
    creation_time: Date
    updated_at: Date | null
    profile_password: string
    cpf: string
    telefone: string
    data_nascimento: Date
    avatar_url: string | null

    nome: string
    email: string

    role: 'SUPER-ADMIN' | 'ADMIN' | 'USER'
    empresa_id: string | null
    area_juridica: string | null
    status: 'ativo' | 'inativo'
    ultimo_acesso: Date | null
    permissoes: any | null
    // ✅ NOVOS CAMPOS DE ESTATÍSTICA E BILHETAGEM
    total_consultas: number
    total_tokens: number
    total_custo_brl: number

    // ✅ NOVOS CAMPOS PARA O 2FA
    two_factor_secret?: string | null
    two_factor_enabled?: boolean

    refresh_token?: string | null
    password_reset_token?: string | null;
    password_reset_expires?: Date | null;
    primeiro_acesso: boolean;
}

export interface ProfileCreationAttributes
    extends Optional<
        ProfileAttributes,
        | 'updated_at'
        | 'avatar_url'
        | 'id'
        | 'creation_time'
        | 'role'
        | 'empresa_id'
        | 'area_juridica'
        | 'status'
        | 'ultimo_acesso'
        | 'permissoes'
        | 'total_consultas'
        | 'total_tokens'
        | 'total_custo_brl'
        | 'two_factor_secret' // ✅ Opcional na criação
        | 'two_factor_enabled' // ✅ Opcional na criação
        | 'refresh_token'
        | 'password_reset_token'
        | 'password_reset_expires'
        | 'primeiro_acesso'
    > {}

class Profile
    extends Model<ProfileAttributes, ProfileCreationAttributes>
    implements ProfileAttributes
{
    declare  public id: string
    declare public creation_time: Date
    declare public updated_at: null | Date
    declare public profile_password: string
    declare public cpf: string
    declare public telefone: string
    declare public data_nascimento: Date
    declare public avatar_url: string | null
    declare public nome: string
    declare public email: string

    declare public role: 'SUPER-ADMIN' | 'ADMIN' | 'USER'
    declare public empresa_id: string | null
    declare public area_juridica: string | null
    declare public status: 'ativo' | 'inativo'
    declare public ultimo_acesso: Date | null
    declare  public permissoes: any | null
    // ✅ Implementação das Estatísticas
    declare public total_consultas: number
    declare public total_tokens: number
    declare public total_custo_brl: number

    // ✅ Implementação na Classe
    declare public two_factor_secret: string | null
    declare public two_factor_enabled: boolean
    declare public refresh_token: string | null
    declare public password_reset_token: string | null
    declare public password_reset_expires: Date | null
    declare public primeiro_acesso: boolean;
}

Profile.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        creation_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        profile_password: {
            type: DataTypes.STRING(60),
            allowNull: false,
        },
        cpf: {
            type: DataTypes.STRING(14),
            allowNull: false,
            unique: true,
        },
        telefone: {
            type: DataTypes.STRING(15),
            allowNull: true,
            unique: true,
        },
        data_nascimento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        avatar_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        role: {
            type: DataTypes.ENUM('SUPER-ADMIN', 'ADMIN', 'USER'),
            allowNull: false,
            defaultValue: 'USER',
        },
        empresa_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'company',
                key: 'id'
            }
        },
        area_juridica: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'Todas',
        },
        status: {
            type: DataTypes.ENUM('ativo', 'inativo'),
            allowNull: false,
            defaultValue: 'ativo',
        },
        ultimo_acesso: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        permissoes: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        // ✅ MAPEAMENTO DAS ESTATÍSTICAS NO BANCO
        total_consultas: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_tokens: {
            type: DataTypes.BIGINT, // BIGINT para suportar milhões de tokens
            allowNull: false,
            defaultValue: 0,
        },
        total_custo_brl: {
            type: DataTypes.DECIMAL(12, 4), // Precisão para os centavos de cada consulta
            allowNull: false,
            defaultValue: 0.0,
        },
        // ✅ Mapeamento no Banco de Dados
        two_factor_secret: {
            type: DataTypes.STRING,
            allowNull: true, // Começa nulo até o usuário gerar o QR Code
        },
        two_factor_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false, // Por padrão, o 2FA vem desativado
        },
        refresh_token: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        password_reset_token: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        password_reset_expires: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        primeiro_acesso: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }
    },
    {
        sequelize,
        tableName: 'profile',
        createdAt: 'creation_time',
        updatedAt: 'updated_at',
        timestamps: true,

        // ✅ PROTEÇÃO ATIVADA: Esconde a senha e a chave secreta de consultas normais!
        defaultScope: {
            attributes: {
                exclude: ['profile_password', 'two_factor_secret', 'refresh_token', 'password_reset_token'],
            },
        },
    }
)

export default Profile