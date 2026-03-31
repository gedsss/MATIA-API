import { FastifySchema } from 'fastify'

export const createCompanySchema: FastifySchema = {
  body: {
    type: 'object',
    required: [
      'name',
      'code',
      'cnpj',
      'responsable',
      'email',
      'phone',
      'active',
      'data_cadastro',
    ],
    properties: {
      name: {
        type: 'string',
      },
      code: {
        type: 'string',
      },
      cnpj: {
        type: 'string',
      },
      responssable: {
        type: 'string',
      },
      email: {
        type: 'string',
        format: 'email',
      },
      phone: {
        type: 'string',
      },
      active: {
        type: 'boolean',
      },
      data_cadastro: {
        type: 'string',
        format: 'date',
      },
      usuarios_count: {
        type: 'number',
      },
      consulta_mes: {
        type: 'number',
      },
      custo_mes: {
        type: 'number',
      },
      plano: {
        type: 'string',
        enum: ['trial', 'basico', 'profissional', 'enterprise'],
      },
    } as const,
    additopnalProperties: false,
  },
}

export const updateCompanySchema: FastifySchema = {
  body: {
    type: 'object',
    required: [],
    properties: {
      name: {
        type: 'string',
      },
      code: {
        type: 'string',
      },
      cnpj: {
        type: 'string',
      },
      responssable: {
        type: 'string',
      },
      email: {
        type: 'string',
        format: 'email',
      },
      phone: {
        type: 'string',
      },
      active: {
        type: 'boolean',
      },
      data_cadastro: {
        type: 'string',
        format: 'date',
      },
      usuarios_count: {
        type: 'number',
      },
      consulta_mes: {
        type: 'number',
      },
      custo_mes: {
        type: 'number',
      },
      plano: {
        type: 'string',
        enum: ['trial', 'basico', 'profissional', 'enterprise'],
      },
    } as const,
    additopnalProperties: false,
  },
}

export const companyParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    } as const,
    additionalProperties: false,
  },
}
