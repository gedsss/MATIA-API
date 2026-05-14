import { LlmConfigRepository } from '../repositories/LlmConfigRepository.js'
import { InternalServerError, UserNotFoundError } from '../errors/errors.js' // Nota: Se tiver um "NotFoundError" genérico, seria melhor que UserNotFoundError aqui!
import type { CreateLlmConfigDTO, UpdateLlmConfigDTO, LlmConfigResponseDTO } from '../dtos/LlmConfigDTO.js'
import LlmConfig from '../models/LlmConfig.js'

export class LlmConfigService {

    private static mapToResponseDTO(config: LlmConfig): LlmConfigResponseDTO {
        const raw = config.get({ plain: true }) as any
        return {
            id: raw.id,
            provider: raw.provider,
            ia: raw.ia,
            ia_model: raw.ia_model,
            nome: raw.nome,
            ativo: raw.ativo,
            padrao: raw.padrao,
            max_tokens: raw.max_tokens,
            temperatura: raw.temperatura,
            limite_custo: raw.limite_custo,
            created_at: raw.created_at,
            updated_at: raw.updated_at
            // api_key omitida intencionalmente 🔒
        }
    }

    static async listar(): Promise<LlmConfigResponseDTO[]> {
        const configs = await LlmConfigRepository.findAll()
        return configs.map(c => this.mapToResponseDTO(c))
    }

    static async buscarPorId(id: string): Promise<LlmConfigResponseDTO> {
        const config = await LlmConfigRepository.findById(id)
        if (!config) throw new UserNotFoundError(id)
        return this.mapToResponseDTO(config)
    }

    static async criar(data: CreateLlmConfigDTO): Promise<LlmConfigResponseDTO> {
        try {
            // Se o data vier com padrao: true, o Sequelize já sabe o que fazer!
            const config = await LlmConfigRepository.create(data)
            return this.mapToResponseDTO(config)

        } catch (error: any) {
            throw new InternalServerError('Falha ao criar configuração de LLM.', { originalError: error.message })
        }
    }

    static async atualizar(id: string, data: UpdateLlmConfigDTO): Promise<LlmConfigResponseDTO> {
        const existe = await LlmConfigRepository.findById(id)
        if (!existe) throw new UserNotFoundError(id)

        try {
            // O individualHooks: true que colocamos no Repository garante
            // que a troca de padrão ocorra magicamente aqui dentro!
            const atualizado = await LlmConfigRepository.update(id, data)
            return this.mapToResponseDTO(atualizado!)

        } catch (error: any) {
            throw new InternalServerError('Falha ao atualizar configuração de LLM.', { originalError: error.message })
        }
    }

    static async excluir(id: string): Promise<void> {
        const existe = await LlmConfigRepository.findById(id)
        if (!existe) throw new UserNotFoundError(id)

        const rowsDeleted = await LlmConfigRepository.delete(id)
        if (rowsDeleted === 0) throw new InternalServerError('Falha ao excluir configuração.')
    }
}