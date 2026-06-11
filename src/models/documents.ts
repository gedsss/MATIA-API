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
  public id!: string
  public user_id!: string
  public original_name!: string
  public storage_path!: string
  public file_type!: string
  public file_size!: number
  public status!: 'enviando' | 'processando' | 'completo' | 'erro' | null
  public progress!: number | null
  public uploaded_at!: Date
  public processed_at!: Date | null
  public rag_document_id!: string | null
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
