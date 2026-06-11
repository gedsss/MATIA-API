import axios from 'axios';
import { UserRepository } from '../repositories/UserRepository.js';
import { CompanyRepository } from '../repositories/CompanyRepository.js';
import { LlmConfigRepository } from '../repositories/LlmConfigRepository.js';
import { ChatRepository } from '../repositories/ChatRepository.js';
import { UserNotFoundError, InternalServerError } from '../errors/errors.js';
import { AskQuestionDTO, ChatResponseDTO } from "../dtos/ChatDTO.js";
import * as http from "node:http";
import * as https from "node:https";

export class ChatService {

    static async askMatia(dto: AskQuestionDTO, userId: string): Promise<ChatResponseDTO> {
        try {
            // 1. Validar o Usuário
            const user = await UserRepository.findByIdForAuth(userId);
            if (!user) throw new UserNotFoundError(userId);

            const rawUser = user.get ? user.get({ plain: true }) : user;
            const role = rawUser.role;
            let companyId = rawUser.empresa_id;

            // 2. Validação de Empresa
            if (role !== 'SUPER-ADMIN') {
                if (!companyId) throw new Error('Usuário não possui uma empresa vinculada para acessar a IA.');

                const company = await CompanyRepository.findById(companyId);
                if (!company) throw new Error('Empresa vinculada ao usuário não encontrada.');

                const rawCompany = company.get ? company.get({ plain: true }) : company;
                if (rawCompany.active === false) throw new Error('O acesso desta empresa está suspenso.');
            } else {
                companyId = null; // Ajustado: para admin não tem company_id atrelado à conversa
            }

            // 3. Buscar a IA Padrão do Banco de Dados
            const config = await LlmConfigRepository.findPadrao();
            if (!config) throw new Error('Nenhuma configuração de Inteligência Artificial ativa foi encontrada no sistema.');

            // 🔥 4. NOVO FLUXO: Salvar a pergunta do usuário no banco ANTES de chamar o RAG
            // (Assumindo que dto pode ter um conversation_id se for continuação de conversa)
            const { conversationId } = await ChatRepository.salvarMensagemTexto(
                userId,
                companyId,
                dto.question,
                (dto as any).conversation_id || null
            );

            // 5. Disparar a requisição para o motor RAG em Python
            const ragUrl = process.env['RAG_API_URL'] ?? 'http://localhost:8001';
            const pythonResponse = await axios.post(`${ragUrl}/ask`, {
                question: dto.question,
                user_id: userId,
                company_id: companyId || "matia-super-admin",
                ia: config.ia,
                ia_model: config.ia_model,
                client_api_key: config.api_key,
                temperature: config.temperatura,
                max_tokens: config.max_tokens,
                chat_history: [], // TODO futuro: buscar histórico do banco se houver conversationId
                include_sources: true,
                response_style: dto.response_style || "equilibrada",
                jurisdicao: "federal"
            }, {
                headers: {
                    'X-API-Key': process.env['MATIA_RAG_API_KEY'],
                    'Content-Type': 'application/json'
                },
                proxy: false,
                httpAgent: new http.Agent({ keepAlive: true }),
                httpsAgent: new https.Agent({ keepAlive: true })
            });

            const data = pythonResponse.data;

            // 🔥 6. NOVO FLUXO: Salvar a resposta da IA no banco
            await ChatRepository.salvarMensagemIA(
                conversationId,
                data.answer,
                config.ia_model
            );

            // 7. Atualizar as estatísticas do perfil no banco
            try {
                await UserRepository.updateStats(
                    userId,
                    data.usage?.llm?.total_tokens || 0,
                    data.cost?.total?.brl || 0
                );
            } catch (statsError) {
                console.error(`[ChatService] Erro ao atualizar estatísticas do usuário ${userId}:`, statsError);
            }

            return {
                answer: data.answer,
                sources: data.sources || [],
                interaction_id: data.metadata?.interaction_id?.toString() || "gerado-localmente",
                // 💡 Mandamos o ID da conversa de volta pro Angular saber onde encaixar as próximas mensagens!
                conversation_id: conversationId,

                usage: {
                    llm: {
                        total_tokens: data.usage?.llm?.total_tokens || 0,
                        input_tokens: data.usage?.llm?.input_tokens || 0,
                        output_tokens: data.usage?.llm?.output_tokens || 0,
                        thoughts_tokens: data.usage?.llm?.thoughts_tokens
                    }
                },
                cost: {
                    total: {
                        brl: data.cost?.total?.brl || 0,
                        usd: data.cost?.total?.usd || 0
                    },
                    exchange_rate: {
                        usd_brl: data.cost?.exchange_rate?.usd_brl || 0
                    }
                },
                confidence: data.confidence,
                risk_level: data.risk_level
            };

        } catch (error: any) {
            if (error.response) {
                console.error(`[ChatService] Erro da API Python (${error.response.status}):`, JSON.stringify(error.response.data));
            } else {
                console.error(`[ChatService] Falha na integração RAG:`, error.message || error);
            }
            throw new InternalServerError('Não foi possível processar a dúvida jurídica neste momento.', { originalError: error.message });
        }
    }
}