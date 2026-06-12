import type { FastifyRequest } from 'fastify'
import type { DocumentsAttributes } from '../models/documents.js'
import documents from '../models/documents.js'
import {
  ValidationError,
  MissingFieldError,
  DocumentNotFoundError,
  InternalServerError,
  DataBaseError,
} from '../errors/errors.js'
import { ErrorCodes } from '../errors/errorCodes.js'
import { successResponse } from '../utils/response.js'
import cacheService from '../utils/cache.js'
import { askDocument, uploadAndIngest } from '../services/DocumentService.js'

interface CreateBody
  extends Omit<DocumentsAttributes, 'id' | 'created_at' | 'updated_at'> {}

interface UpdateBody extends Partial<CreateBody> {}

interface Params {
  id: string
}

export const createDocuments = async (request: FastifyRequest) => {
  try {
    const payload = request.body as CreateBody
    if (!payload || Object.keys(payload).length === 0) {
      throw new MissingFieldError()
    }
    const created = await documents.create(payload as any)
    const data = created.toJSON()

    // Invalida cache da lista ao criar novo documento
    await cacheService.invalidatePrefix('documents:')

    return successResponse(data, 'Documento criado com sucesso')
  } catch (err: any) {
    if (err && err.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    throw new InternalServerError('Erro ao criar o documento', {
      code: ErrorCodes.CREATE_FAILED,
    })
  }
}

export const getDocumentsById = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params

    // Cache-Aside: tenta cache, senão busca do banco
    const data = await cacheService.getOrSet(
      `documents:${id}`,
      async () => {
        const item = await documents.findByPk(id)
        if (!item) throw new DocumentNotFoundError()
        return item.toJSON()
      },
      300 // 5 minutos
    )

    return successResponse(data, 'Documento encontrado com sucesso')
  } catch (err: any) {
    throw new DocumentNotFoundError()
  }
}

export const getDocuments = async () => {
  try {
    // Cache-Aside: tenta cache, senão busca do banco
    const items = await cacheService.getOrSet(
      'documents:all',
      async () => {
        const item = await documents.findAll()
        return item
      },
      120 // 2 minutos (lista muda mais frequentemente)
    )

    if (Array.isArray(items) && items.length === 0) {
      return successResponse([], 'nenhum Documents encontrado')
    }
    return successResponse(items, 'listando todos os Documents')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

export const updateDocuments = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const [updatedRows] = await documents.update(request.body as UpdateBody, {
      where: { id },
    })
    if (updatedRows === 0) throw new DocumentNotFoundError()
    const updated = await documents.findByPk(id)
    const data = updated?.toJSON()

    // Invalida cache do documento atualizado e da lista
    await cacheService.del(`documents:${id}`)
    await cacheService.del('documents:all')

    return successResponse(data, 'Documento atualizado com sucesso')
  } catch (err: any) {
    if (err && err.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    throw new InternalServerError('Erro ao atualizar o documento', {
      code: ErrorCodes.UPDATE_FAILED,
    })
  }
}

export const deleteDocuments = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const deleted = await documents.destroy({ where: { id } })
    if (deleted === 0) throw new DocumentNotFoundError()

    // Invalida cache do documento deletado e da lista
    await cacheService.del(`documents:${id}`)
    await cacheService.del('documents:all')

    return successResponse('Documento deletado com sucesso')
  } catch (err: any) {
    throw new InternalServerError('Erro ao deletar o documento', {
      code: ErrorCodes.DELETE_FAILED,
    })
  }
}

export const uploadDocument = async (request: FastifyRequest) => {
  const user = request.user as { id: string; empresa_id?: string; role?: string }
  const data = await request.file()
  if (!data) throw new MissingFieldError()

  const companyId = user.empresa_id ?? 'matia-super-admin'
  const buffer = await data.toBuffer()

  await cacheService.invalidatePrefix('documents:')

  const result = await uploadAndIngest(user.id, companyId, {
    filename: data.filename,
    mimetype: data.mimetype,
    data: buffer,
  })

  return successResponse(result, 'Documento enviado e processado com sucesso')
}

export const askDocumentController = async (request: FastifyRequest) => {
  const user = request.user as { id: string; empresa_id?: string; role?: string }
  const { question, document_ids } = request.body as { question: string; document_ids?: string[] }

  if (!question) throw new MissingFieldError()

  const companyId = user.empresa_id ?? 'matia-super-admin'
  const result = await askDocument(companyId, question, document_ids)

  return successResponse(result, 'Resposta gerada com sucesso')
}

export default {
  createDocuments,
  getDocumentsById,
  updateDocuments,
  deleteDocuments,
  uploadDocument,
  askDocumentController,
}
