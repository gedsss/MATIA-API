import type { FastifyInstance } from 'fastify'
import * as documentsController from '../controllers/documentsController.js'
import { authorize, adminOnly } from '../middleware/authorize.js'

import {
  createDocumentsSchema,
  documentsParamsSchema,
  updateDocumentsSchema,
} from '../schemas/documentsSchema.js'

const documentsRoutes = async (fastify: FastifyInstance) => {
  // ASK - Pergunta sobre documento(s) indexados no RAG
  fastify.post(
    '/ask',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Faz uma pergunta sobre documentos indexados no RAG',
        body: {
          type: 'object',
          required: ['question'],
          properties: {
            question: { type: 'string' },
            document_ids: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      preHandler: [fastify.authenticate],
    },
    documentsController.askDocumentController
  )

  // UPLOAD + INGEST no RAG - Qualquer usuário autenticado
  fastify.post(
    '/upload',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Faz upload de um arquivo e o ingere no RAG',
        consumes: ['multipart/form-data'],
      },
      preHandler: [fastify.authenticate],
    },
    documentsController.uploadDocument
  )

  // CREATE - Apenas admin pode criar documentos
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Cria um novo documento (realiza o upload) - Admin only',
        body: createDocumentsSchema.body,
      },

      preHandler: [fastify.authenticate, authorize('admin')],
    },
    documentsController.createDocuments
  )

  // READ by ID - Qualquer usuário autenticado pode ver
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Busca um documento pelo seu ID',
        params: documentsParamsSchema.params,
      },

      preHandler: [fastify.authenticate],
    },
    documentsController.getDocumentsById
  )

  // READ ALL - Qualquer usuário autenticado pode listar
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Lista todos os documentos',
      },

      preHandler: [fastify.authenticate],
    },
    documentsController.getDocuments
  )

  // UPDATE - Apenas admin pode atualizar
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['Documents'],
        summary:
          'Atualiza metadados ou informações de um documento existente - Admin only',
        params: documentsParamsSchema.params,
        body: updateDocumentsSchema.body,
      },

      preHandler: [fastify.authenticate, authorize('admin')],
    },
    documentsController.updateDocuments
  )

  // DELETE - Apenas admin pode deletar
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Deleta um documento pelo ID - Admin only',
        params: documentsParamsSchema.params,
      },

      preHandler: [fastify.authenticate, adminOnly()],
    },
    documentsController.deleteDocuments
  )
}

export default documentsRoutes
