import type { FastifyRequest } from 'fastify'
import type { ActivityLogsAttributes } from '../models/activity_logs.js'
import activityLogs from '../models/activity_logs.js'
import {
  ValidationError,
  MissingFieldError,
  DocumentNotFoundError,
  InternalServerError,
  DataBaseError,
} from '../errors/errors.js'
import { ErrorCodes } from '../errors/errorCodes.js'
import { successResponse } from '../utils/response.js'

interface CreateBody
  extends Omit<ActivityLogsAttributes, 'id' | 'created_at' | 'updated_at'> {}

interface UpdateBody extends Partial<CreateBody> {}

interface Params {
  id: string
}

export const createActivityLogs = async (request: FastifyRequest) => {
  try {
    const payload = request.body as CreateBody
    if (!payload || Object.keys(payload).length === 0) {
      throw new MissingFieldError()
    }
    if (
      payload.action !== 'login' &&
      payload.action !== 'upload_document' &&
      payload.action !== 'delete_user'
    ) {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    if (
      payload.entity_type !== 'conversation' &&
      payload.entity_type !== 'user' &&
      payload.entity_type !== 'document'
    ) {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    const created = await activityLogs.create(payload as any)
    const data = created.toJSON()
    return successResponse(data, 'Sucesso ao criar o documento')
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

export const getActivityLogsById = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const item = await activityLogs.findByPk(id)
    const data = item?.toJSON()
    if (!item) throw new DocumentNotFoundError()
    return successResponse(data, 'Sucesso ao encontrar o documento')
  } catch (err: any) {
    throw new DocumentNotFoundError()
  }
}

export const getActivityLogs = async () => {
  try {
    const item = await activityLogs.findAll()
    if (item.length === 0) {
      return successResponse([], 'nenhum ActivityLogs encontrado')
    }
    return successResponse(item, 'listando todos ActivityLogs')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

export const updateActivityLogs = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const [updatedRows] = await activityLogs.update(
      request.body as UpdateBody,
      {
        where: { id },
      }
    )
    if (updatedRows === 0) throw new DocumentNotFoundError()
    const updated = await activityLogs.findByPk(id)
    const data = updated?.toJSON()
    return successResponse(data, 'Sucesso ao atualizar o documento')
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

export const deleteActivityLogs = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const deleted = await activityLogs.destroy({ where: { id } })
    if (deleted === 0) throw new DocumentNotFoundError()
    return successResponse('Sucesso ao deletar o documento')
  } catch (err: any) {
    throw new InternalServerError('Erro ao deletar o documento', {
      code: ErrorCodes.DELETE_FAILED,
    })
  }
}

export default {
  createActivityLogs,
  getActivityLogsById,
  updateActivityLogs,
  deleteActivityLogs,
}
