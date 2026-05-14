import type { FastifyInstance } from 'fastify';
import { ChatMatiaController } from '../controllers/ChatMatiaController.js';
import type { AskQuestionDTO } from '../dtos/ChatDTO.js';

const chatMatiaRoutes = async (fastify: FastifyInstance) => {


    fastify.post<{ Body: AskQuestionDTO }>(
        '/matia/ask',
        {
            schema: {
                tags: ['Matia AI'],
                summary: 'Faz uma pergunta jurídica para a IA (RAG)',
                description: 'Envia a pergunta para o motor Python, valida a empresa/SaaS e retorna a resposta com fontes.',
                security: [{ bearerAuth: [] }],
            },
            preHandler: [fastify.authenticate],
        },
        ChatMatiaController.askQuestion
    );
};

export default chatMatiaRoutes;