import type { QueryInterface } from 'sequelize'
import { DataTypes } from 'sequelize'

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('documents', 'rag_document_id', {
    type: DataTypes.UUID,
    allowNull: true,
  })
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('documents', 'rag_document_id')
}
