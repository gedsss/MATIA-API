import type { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from '../services/ChatService.js';
import type { AskQuestionDTO } from "../dtos/ChatDTO.js";

// Tipagem para o usuário que vem do seu middleware JWT
interface JwtUser {
    id: string;
    role: string;
    empresa_id: string | null;
}

export class ChatMatiaController {

    // 🌟 Aplicando o Generic no Body para o TypeScript saber exatamente o formato
    static async askQuestion(request: FastifyRequest<{ Body: AskQuestionDTO }>, reply: FastifyReply) {
        try {
            const dto = request.body;

            // Extrair o usuário tipando ele de forma limpa (sem o "any")
            const user = request.user as JwtUser;
            const userId = user?.id;

            // Validações básicas de entrada
            if (!userId) {
                return reply.status(401).send({ error: 'Acesso negado. Usuário não autenticado.' });
            }

            if (!dto.question || dto.question.trim() === '') {
                return reply.status(400).send({ error: 'A pergunta jurídica não pode estar vazia.' });
            }

            // Passar a bola para o Service (que agora lê do banco a IA correta!)
            const response = await ChatService.askMatia(dto, userId);

            return reply.status(200).send(response);

        } catch (error: any) {
            console.error('[ChatMatiaController] Erro na rota:', error.message);

            const statusCode = error.statusCode || 500;
            return reply.status(statusCode).send({
                error: error.message || 'Erro interno ao processar a pergunta com a Inteligência Artificial.'
            });
        }
    }
}