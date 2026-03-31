import { DataTypes, type Optional } from 'sequelize'
import { Model } from 'sequelize'
import sequelize from '../db.js'

export interface CompanyAttributes {
  id: string
  name: string
  code: string
  cnpj: string
  responsable: string
  email: string
  phone: string
  active: boolean | null
  data_cadastro: string
  usuarios_count: number | null
  consulta_mes: number | null
  custo_mes: number | null
  plano: 'trial' | 'basico' | 'profissional' | 'enterprise'
  created_at: Date
  updated_at: Date
}

export interface CompanyCreationAttributes
  extends Optional<
    CompanyAttributes,
    | 'id'
    | 'active'
    | 'usuarios_count'
    | 'consulta_mes'
    | 'custo_mes'
    | 'created_at'
    | 'updated_at'
  > {}

class Company
  extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes
{
  public id!: string
  public name!: string
  public code!: string
  public cnpj!: string
  public responsable!: string
  public email!: string
  public phone!: string
  public active!: boolean | null
  public data_cadastro!: string
  public usuarios_count!: number | null
  public consulta_mes!: number | null
  public custo_mes!: number | null
  public plano!: 'trial' | 'basico' | 'profissional' | 'enterprise'
  public created_at!: Date
  public updated_at!: Date
}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    cnpj: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    data_cadastro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    usuarios_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    consulta_mes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    custo_mes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    plano: {
      type: DataTypes.ENUM('trial', 'basico', 'profissional', 'enterprise'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'company',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

export default Company
