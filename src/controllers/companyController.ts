import type { FastifyRequest } from 'fastify'
import type { CompanyAttributes } from '../models/company.js'
import Company from '../models/company.js'
import {
  MissingFieldError,
  ValidationError,
  InternalServerError,
  DocumentNotFoundError,
  DataBaseError,
} from '../errors/errors.js'
import { ErrorCodes } from '../errors/errorCodes.js'
import { successResponse } from '../utils/response.js'

interface CreateBody extends Omit<CompanyAttributes, 'id' | 'created_at'> {}

interface UpdateBody extends Partial<CreateBody> {}

interface Params {
  id: string
}

export const createCompany = async (request: FastifyRequest) => {
  try {
    const payload = request.body as CreateBody
    if (!payload || Object.keys(payload).length === 0) {
      throw new MissingFieldError()
    }
    if (
      payload.plano !== 'trial' &&
      payload.plano !== 'basico' &&
      payload.plano !== 'enterprise' &&
      payload.plano !== 'profissional'
    ) {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    const created = await Company.create(payload as any)
    const data = created.toJSON()
    return successResponse(data, 'Sucesso ao criar a empresa')
  } catch (err: any) {
    if (err && err.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    throw new InternalServerError('Erro ao criar a empresa', {
      code: ErrorCodes.CREATE_FAILED,
    })
  }
}

export const getCompanybyID = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const item = await Company.findByPk(id)
    const data = item?.toJSON()
    if (!item) throw new DocumentNotFoundError()
    return successResponse(data, 'Sucesso ao encontrar a empresa')
  } catch (err: any) {
    throw new DocumentNotFoundError()
  }
}

export const getCompany = async () => {
  try {
    const item = await Company.findAll()
    if (item.length === 0) {
      return successResponse([], 'nenhum ActivityLogs encontrado')
    }
    return successResponse(item, 'listando todos ActivityLogs')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

export const updateCompany = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const [updatedRows] = await Company.update(request.body as UpdateBody, {
      where: { id },
    })
    if (updatedRows === 0) throw new DocumentNotFoundError()
    const updated = await Company.findByPk(id)
    const data = updated?.toJSON()
    return successResponse(data, 'Sucesso ao atualizar a empresa')
  } catch (err: any) {
    if (err && err.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    throw new InternalServerError('Erro ao atualizar a empresa', {
      code: ErrorCodes.UPDATE_FAILED,
    })
  }
}

export const deleteCompany = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const deleted = await Company.destroy({ where: { id } })
    if (deleted === 0) throw new DocumentNotFoundError()
    return successResponse('Sucesso ao deletar a empresa')
  } catch (err: any) {
    throw new InternalServerError('Erro ao deletar a empresa', {
      code: ErrorCodes.DELETE_FAILED,
    })
  }
}

export default {
  createCompany,
  getCompany,
  getCompanybyID,
  updateCompany,
  deleteCompany,
}
