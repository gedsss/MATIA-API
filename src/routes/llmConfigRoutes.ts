import type { FastifyInstance } from 'fastify'
import { LlmConfigController } from '../controllers/LlmConfigController.js'
import { createLlmConfigSchema, updateLlmConfigSchema, llmConfigParamsSchema } from '@/schemas/llmConfigSchema.js'

const llmConfigRoutes = async (fastify: FastifyInstance) => {

    fastify.get('/', {
        schema: { tags: ['LLM Config'], security: [{ bearerAuth: [] }] },
        preHandler: [fastify.authenticate, fastify.requireSuperAdmin],
    }, (request, reply) => LlmConfigController.listar(request, reply)) // <-- Arrow function aqui

    fastify.get('/:id', {
        schema: { tags: ['LLM Config'], params: llmConfigParamsSchema.params, security: [{ bearerAuth: [] }] },
        preHandler: [fastify.authenticate, fastify.requireSuperAdmin],
    }, (request, reply) => LlmConfigController.buscarPorId(request, reply)) // <-- Arrow function aqui

    fastify.post('/', {
        schema: { tags: ['LLM Config'], body: createLlmConfigSchema.body, security: [{ bearerAuth: [] }] },
        preHandler: [fastify.authenticate, fastify.requireSuperAdmin],
    }, (request, reply) => LlmConfigController.criar(request, reply)) // <-- Arrow function aqui

    fastify.put('/:id', {
        schema: { tags: ['LLM Config'], body: updateLlmConfigSchema.body, params: llmConfigParamsSchema.params, security: [{ bearerAuth: [] }] },
        preHandler: [fastify.authenticate, fastify.requireSuperAdmin],
    }, (request, reply) => LlmConfigController.atualizar(request, reply)) // <-- Arrow function aqui

    fastify.delete('/:id', {
        schema: { tags: ['LLM Config'], params: llmConfigParamsSchema.params, security: [{ bearerAuth: [] }] },
        preHandler: [fastify.authenticate, fastify.requireSuperAdmin],
    }, (request, reply) => LlmConfigController.excluir(request, reply)) // <-- Arrow function aqui
}

export default llmConfigRoutes