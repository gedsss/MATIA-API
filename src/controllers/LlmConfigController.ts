import type { FastifyRequest, FastifyReply } from 'fastify'
import { LlmConfigService } from '../services/LlmConfigService.js'
import type { CreateLlmConfigDTO, UpdateLlmConfigDTO } from '../dtos/LlmConfigDTO.js'

export class LlmConfigController {

    static async listar(request: FastifyRequest, reply: FastifyReply) {
        const configs = await LlmConfigService.listar()
        return reply.status(200).send({ success: true, data: configs })
    }

    static async buscarPorId(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const config = await LlmConfigService.buscarPorId(id)
        return reply.status(200).send({ success: true, data: config })
    }

    static async criar(request: FastifyRequest, reply: FastifyReply) {
        const body = request.body as CreateLlmConfigDTO
        const config = await LlmConfigService.criar(body)
        return reply.status(201).send({ success: true, data: config })
    }

    static async atualizar(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        const body = request.body as UpdateLlmConfigDTO
        const config = await LlmConfigService.atualizar(id, body)
        return reply.status(200).send({ success: true, data: config })
    }

    static async excluir(request: FastifyRequest, reply: FastifyReply) {
        const { id } = request.params as { id: string }
        await LlmConfigService.excluir(id)
        return reply.status(200).send({ success: true, message: 'Configuração removida com sucesso.' })
    }
}