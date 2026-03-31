import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import fastifyEnv from '@fastify/env'
import { rateLimitPlugin } from './plugins/ratelimit.js'
import authenticate from './plugins/authPlugin.js'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance, FastifyRegisterOptions } from 'fastify'
import Fastify from 'fastify'

// Carrega variáveis de ambiente ANTES de importar db.js
import { config } from 'dotenv'
config()

// Importação da instância do Sequelize (já tipada)
import sequelize from './db.js'
import loginRoutes from './routes/loginRoutes.js'
import activityLogsRoutes from './routes/activity_logsRoutes.js'
import conversationDocumentsRoutes from './routes/conversation_documentsRoutes.js'
import conversationsRoutes from './routes/conversationRoutes.js'
import documentsAnalysesRoutes from './routes/documents_analysisRoutes.js'
import documentsTagsRelationsRoutes from './routes/documents_tags_relationsRoutes.js'
import documentsTagsRoutes from './routes/documents_tagsRoutes.js'
import documentsRoutes from './routes/documentsRoutes.js'
import messagesRoutes from './routes/messagesRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import companyRoutes from './routes/companyRoutes.js'
// Importações dos Módulos de Rotas (agora são arquivos .ts ou .js compilados)
import profileRoutes from './routes/profileRoutes.js'
import userActivityLogsRoutes from './routes/user_activity_logRoutes.js'
import userRoleRoutes from './routes/user_roleRoutes.js'
import {
  errorHandler,
  setupGlobalErrorHandlers,
} from './middleware/errorHandler.js'
import { helmetPlugin } from './plugins/helmet.js'
import { cachePlugin } from './plugins/cachePlugin.js'

// Tipando a instância do Fastify explicitamente
const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL,
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
  disableRequestLogging: false,
  genReqId: () => crypto.randomUUID(),
})

await fastify.register(fastifyEnv, {
  schema: {
    type: 'object',
    required: [
      'JWT_SECRET',
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASS',
      'OPEN_API_KEY',
    ],
    properties: {
      JWT_SECRET: { type: 'string' },
    },
  },

  dotenv: true,
})

await fastify.register(helmetPlugin)

await fastify.register(cachePlugin)

await fastify.register(rateLimitPlugin)

fastify.setErrorHandler(errorHandler)

setupGlobalErrorHandlers(fastify.log)

await fastify.register(authenticate)

await fastify.register(cors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://matia-legal-ai.vercel.app',
    'https://www.matia.com.br',
  ],

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],

  credentials: true,

  maxAge: 86400,
})

// --- SWAGGER/OPENAPI CONFIGURAÇÃO ---
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Matia Legal AI API',
      description: 'API completa para chatbot jurídico com IA',
      version: '1.0.0',
      contact: {
        name: 'Matia Team',
        email: 'contato@matia.com.br',
      },
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Ambiente de Desenvolvimento',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Autenticação e Login' },
      { name: 'Chat', description: 'Endpoints de conversação com IA' },
      { name: 'Profile', description: 'Operações de Usuários' },
      { name: 'UserRole', description: 'Log de Funções de Usuários' },
      { name: 'Messages', description: 'Log de Mensagens' },
      { name: 'Documents', description: 'Log de Documentos' },
      { name: 'DocumentsTags', description: 'Log de Tags de Documenos' },
      {
        name: 'DocumentsTagsRelations',
        description: 'Log de Tags de Relação de Documenos',
      },
      {
        name: 'DocumentsAnalyses',
        description: 'Log de Analises de Documentos',
      },
      { name: 'Conversations', description: 'Log de Conversações' },
      {
        name: 'ConversationDocuments',
        description: 'Log de Documentos de Conversação',
      },
      {
        name: 'ActivityLogs',
        description: 'Log de Atividades de Administrador',
      },
      {
        name: 'UserActivityLogs',
        description: 'Log de Atividades de Usuários',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
})

// --- REGISTRO DE ROTAS ---
await fastify.register(chatRoutes, {
  prefix: '/api',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(companyRoutes, {
  prefix: '/api/companies',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(profileRoutes, {
  prefix: '/api/profile',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(userRoleRoutes, {
  prefix: '/api/user_roles',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(messagesRoutes, {
  prefix: '/api/messages',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(documentsRoutes, {
  prefix: '/api/documents',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(documentsTagsRoutes, {
  prefix: '/api/documents_tags',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(documentsTagsRelationsRoutes, {
  prefix: '/api/documents_tags_relations',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(documentsAnalysesRoutes, {
  prefix: '/api/documents_analyses',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(conversationsRoutes, {
  prefix: '/api/conversations',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(conversationDocumentsRoutes, {
  prefix: '/api/conversation_documents',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(activityLogsRoutes, {
  prefix: '/api/activity_logs',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(userActivityLogsRoutes, {
  prefix: '/api/user_activity_log',
} as FastifyRegisterOptions<FastifyInstance>)
await fastify.register(loginRoutes, {
  prefix: '/api/auth',
})

// --- SWAGGER/OPENAPI CONFIGURAÇÃO ---

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
})

// --- INICIALIZAÇÃO DO SERVIDOR ---
const start = async () => {
  try {
    await sequelize.authenticate()
    fastify.log.info('Conexão com o banco estabelecida com sucesso')

    await fastify.ready()

    await fastify.listen({ port: 3002, host: '0.0.0.0' })
    fastify.log.info('Servidor rodando em http://localhost:3002')
    fastify.log.info(
      'Documentação Swagger disponível em http://localhost:3002/docs'
    )
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

await start()
