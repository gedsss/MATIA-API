import type { FastifyInstance } from 'fastify'
import * as companyController from '../controllers/companyController.js'
import {
  createCompanySchema,
  updateCompanySchema,
  companyParamsSchema,
} from '../schemas/companySchema.js'

const companyRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Company'],
        summary: 'Cria uma nova empresa',
        body: createCompanySchema.body,
      },
      preHandler: [fastify.authenticate],
    },
    companyController.createCompany
  )

  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Company'],
        summary: 'Busca uma empresa pelo ID',
        params: companyParamsSchema.params,
      },
      preHandler: [fastify.authenticate],
    },
    companyController.getCompanybyID
  )

  fastify.get(
    '/',
    {
      schema: {
        tags: ['Company'],
        summary: 'Lista todas as empresas',
      },
      preHandler: [fastify.authenticate],
    },
    companyController.getCompany
  )

  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['Company'],
        summary: 'Atualiza uma empresa existente',
        params: companyParamsSchema.params,
        body: updateCompanySchema.body,
      },
      preHandler: [fastify.authenticate],
    },
    companyController.updateCompany
  )

  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Company'],
        summary: 'Deleta uma empresa pelo ID',
        params: companyParamsSchema.params,
      },
      preHandler: [fastify.authenticate],
    },
    companyController.deleteCompany
  )
}

export default companyRoutes
