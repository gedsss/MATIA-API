import type { FastifyInstance } from 'fastify'
import * as chatController from '../controllers/chatController.js'
import {
  sendMessageSchema,
  newConversationSchema,
  conversationHistoryParamsSchema,
  conversationListSchema,
  deleteConversationSchema,
} from '../schemas/chatSchema.js'
import {AudioController} from "../controllers/Audiocontroller.js";

const chatRoutes = async (fastify: FastifyInstance) => {
  // POST /chat/message - Envia mensagem em conversa existente
  fastify.post(
    '/chat/message',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Envia mensagem em uma conversa existente',
        description:
          'Envia uma mensagem do usuário para uma conversa existente e retorna a resposta da IA. ' +
          'O histórico das últimas 10 mensagens é incluído no contexto enviado para a LLM.',
        body: sendMessageSchema.body,
        response: sendMessageSchema.response,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    chatController.sendMessage
  )

  // POST /chat/new - Inicia nova conversa
  fastify.post(
    '/chat/new',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Inicia uma nova conversa',
        description:
          'Cria uma nova conversa com a primeira mensagem do usuário. ' +
          'Se nenhum título for fornecido, um será gerado automaticamente pela IA baseado na mensagem.',
        body: newConversationSchema.body,
        response: newConversationSchema.response,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    chatController.startNewConversation
  )

  // GET /chat/history/:id - Busca histórico da conversa
  fastify.get(
    '/chat/history/:id',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Busca histórico de mensagens de uma conversa',
        description:
          'Retorna todas as mensagens de uma conversa específica, ordenadas por data (mais antigas primeiro). ' +
          'Suporta paginação e filtro por role (user/assistant/system).',
        params: conversationHistoryParamsSchema.params,
        querystring: conversationHistoryParamsSchema.querystring,
        response: conversationHistoryParamsSchema.response,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    chatController.getConversationHistory
  )

  // GET /chat/conversations - Lista todas conversas do usuário
  fastify.get(
    '/chat/conversations',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Lista todas as conversas do usuário',
        description:
          'Retorna uma lista paginada de todas as conversas do usuário autenticado, ' +
          'ordenadas pela data da última mensagem (mais recentes primeiro). ' +
          'Suporta filtro por conversas favoritas.',
        querystring: conversationListSchema.querystring,
        response: conversationListSchema.response,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    chatController.getConversationsList
  )

    fastify.post(
        '/chat/audio',
        {
            schema: {
                tags: ['Chat'],
                summary: 'Transcreve mensagem de áudio',
                description:
                    'Recebe um arquivo de áudio via upload (multipart/form-data) e o ID da conversa. ' +
                    'O sistema processa o áudio, transcreve utilizando a IA e salva o texto ' +
                    'no histórico da conversa.',
                consumes: ['multipart/form-data'], // Essencial para o Swagger entender que é upload de arquivo
                // body: audioSchema.body, // (Opcional)
                response: {
                    200: {
                        description: 'Áudio transcrito com sucesso',
                        type: 'object',
                        properties: {
                            text: { type: 'string', description: 'Texto falado no áudio' }
                        }
                    },
                    400: {
                        description: 'Erro de validação (ex: arquivo ausente ou ID da conversa faltando)',
                        type: 'object',
                        properties: {
                            error: { type: 'string' }
                        }
                    },
                    500: {
                        description: 'Erro interno no processamento da IA ou Banco de Dados',
                        type: 'object',
                        properties: {
                            error: { type: 'string' }
                        }
                    }
                },
                security: [{ bearerAuth: [] }],
            },
            preHandler: [fastify.authenticate],
        },
        AudioController.transcrever
    )

  // DELETE /chat/conversation/:id - Deleta conversa e mensagens
  fastify.delete(
    '/chat/conversation/:id',
    {
      schema: {
        tags: ['Chat'],
        summary: 'Deleta uma conversa',
        description:
          'Deleta uma conversa específica e todas as suas mensagens associadas. ' +
          'Esta operação não pode ser desfeita.',
        params: deleteConversationSchema.params,
        response: deleteConversationSchema.response,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [fastify.authenticate],
    },
    chatController.deleteConversation
  )
}

export default chatRoutes
