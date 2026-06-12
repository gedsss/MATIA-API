import type { Optional } from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import sequelize from '../db.js'

export interface DocumentsAttributes {
  id: string
  user_id: string
  original_name: string
  storage_path: string
  file_type: string
  file_size: number
  status: 'enviando' | 'processando' | 'completo' | 'erro' | null
  progress: number | null
  uploaded_at: Date
  processed_at: Date | null
  rag_document_id: string | null
}

export interface DocumentsCreationAttributes
  extends Optional<
    DocumentsAttributes,
    'status' | 'progress' | 'id' | 'processed_at' | 'uploaded_at' | 'rag_document_id'
  > {}

class Documents
  extends Model<DocumentsAttributes, DocumentsCreationAttributes>
  implements DocumentsAttributes
{
  declare id: string
  declare user_id: string
  declare original_name: string
  declare storage_path: string
  declare file_type: string
  declare file_size: number
  declare status: 'enviando' | 'processando' | 'completo' | 'erro' | null
  declare progress: number | null
  declare uploaded_at: Date
  declare processed_at: Date | null
  declare rag_document_id: string | null
}

Documents.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profile',
        key: 'id',
      },
    },
    original_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    storage_path: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    file_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('enviando', 'processando', 'completo', 'erro'),
      allowNull: true,
      defaultValue: 'enviando',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rag_document_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'documents',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: false,
  }
)

export default Documents
