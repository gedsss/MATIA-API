import LlmConfig from '../models/LlmConfig.js'
import type { CreateLlmConfigDTO, UpdateLlmConfigDTO } from '../dtos/LlmConfigDTO.js'

export class LlmConfigRepository {

    static async findAll() {
        return LlmConfig.findAll({ order: [['created_at', 'ASC']] })
    }

    static async findById(id: string) {
        return LlmConfig.findByPk(id)
    }

    static async findPadrao() {
        return LlmConfig.findOne({ where: { padrao: true, ativo: true } })
    }

    static async create(data: CreateLlmConfigDTO) {
        // O Sequelize infere a tipagem, garantindo que "data" segue o DTO
        return LlmConfig.create(data as any)
    }

    static async update(id: string, data: UpdateLlmConfigDTO) {
        // O individualHooks: true é OBRIGATÓRIO aqui para que,
        // se o data vier com padrao: true, o nosso Hook no Modelo seja ativado!
        await LlmConfig.update(data, {
            where: { id },
            individualHooks: true
        })

        return LlmConfig.findByPk(id)
    }

    static async delete(id: string) {
        return LlmConfig.destroy({ where: { id } })
    }

    // 🔥 OTIMIZADO: Aproveitando o Hook do Modelo
    static async definirPadrao(id: string) {
        const instance = await LlmConfig.findByPk(id)

        if (!instance) throw new Error('Configuração de LLM não encontrada')

        // Ao alterar para true e dar .save(), o Sequelize chama nosso Hook
        // e ele próprio se encarrega de dar o "padrao: false" nos outros!
        instance.padrao = true
        await instance.save()

        return instance
    }
}