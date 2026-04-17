import './init.js';
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import fastifyEnv from '@fastify/env'
import { rateLimitPlugin } from './plugins/ratelimit.js'
import authenticate from './plugins/authPlugin.js'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { config } from 'dotenv'

// Carrega variáveis de ambiente ANTES de importar db.js
config()
process.env.TZ = 'America/Cuiaba'

// Importação da instância do Sequelize e Models
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
import profileRoutes from './routes/profileRoutes.js'
import userActivityLogsRoutes from './routes/user_activity_logRoutes.js'
import {
  errorHandler,
  setupGlobalErrorHandlers,
} from './middleware/errorHandler.js'
import { helmetPlugin } from './plugins/helmet.js'
import { cachePlugin } from './plugins/cachePlugin.js'
import { setupAssociations } from "./models/setupAssociations.js";

const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
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

// --- CONFIGURAÇÃO DE CORS (AJUSTADA PARA VPS) ---
await fastify.register(cors, {
  origin: [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://103.204.193.6',        // Frontend na porta 80 da VPS
    'http://103.204.193.6:80',
    'http://103.204.193.6:42502',// Garantia para porta 80 explícita
    'https://matia-legal-ai.vercel.app',
    'https://www.matia.com.br',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
})

// --- SWAGGER/OPENAPI (AJUSTADO PARA VPS) ---
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Matia Legal AI API',
      description: 'API completa para chatbot jurídico com IA',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://103.204.193.6:3002',
        description: 'Servidor de Produção (VPS)',
      },
      {
        url: 'http://localhost:3002',
        description: 'Ambiente Local',
      },
    ],
    // ... restante das tags e components (mantidos como no original)
  },
})

// --- REGISTRO DE ROTAS ---
await fastify.register(loginRoutes, { prefix: '/api/auth' })
await fastify.register(companyRoutes, { prefix: '/api/companies' })
await fastify.register(profileRoutes, { prefix: '/api/profile' })
await fastify.register(chatRoutes, { prefix: '/api' })
await fastify.register(messagesRoutes, { prefix: '/api/messages' })
await fastify.register(conversationsRoutes, { prefix: '/api/conversations' })
await fastify.register(conversationDocumentsRoutes, { prefix: '/api/conversation_documents' })
await fastify.register(documentsRoutes, { prefix: '/api/documents' })
await fastify.register(documentsTagsRoutes, { prefix: '/api/documents_tags' })
await fastify.register(documentsTagsRelationsRoutes, { prefix: '/api/documents_tags_relations' })
await fastify.register(documentsAnalysesRoutes, { prefix: '/api/documents_analyses' })
await fastify.register(activityLogsRoutes, { prefix: '/api/activity_logs' })
await fastify.register(userActivityLogsRoutes, { prefix: '/api/user_activity_log' })

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
})

// --- INICIALIZAÇÃO DO SERVIDOR ---
const start = async () => {
  try {
    await sequelize.authenticate()
    fastify.log.info('Conexão com o banco estabelecida com sucesso')

    setupAssociations()
    await sequelize.sync({ alter: true })
    fastify.log.info('Tabelas sincronizadas com sucesso no banco de dados!')

    await fastify.ready()

    // Host 0.0.0.0 é fundamental para o Docker
    await fastify.listen({ port: 3002, host: '0.0.0.0' })

    fastify.log.info(`Servidor rodando em: http://103.204.193.6:3002`)
    fastify.log.info(`Documentação: http://103.204.193.6:3002/docs`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

await start()