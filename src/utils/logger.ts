import type { FastifyBaseLogger } from 'fastify'

export interface LogMetadata {
  requestId?: string
  userId?: string
  conversationId?: string
  tokensUsed?: number
  duration?: number
  model?: string
  [key: string]: unknown
}

export class Logger {
  private fastifyLogger?: FastifyBaseLogger

  constructor(fastifyLogger?: FastifyBaseLogger) {
    this.fastifyLogger = fastifyLogger
  }

  private formatLog(
      level: string,
      message: string,
      metadata?: LogMetadata
  ): object {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(metadata ? { metadata } : {}),
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    const log = this.formatLog('info', message, metadata)

    if (this.fastifyLogger) {
      this.fastifyLogger.info(log)
    } else {
      console.log(JSON.stringify(log))
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    const log = this.formatLog('warn', message, metadata)

    if (this.fastifyLogger) {
      this.fastifyLogger.warn(log)
    } else {
      console.warn(JSON.stringify(log))
    }
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    const log = this.formatLog('error', message, {
      ...(metadata ?? {}),
      error: error?.message,
      stack: error?.stack,
    })

    if (this.fastifyLogger) {
      this.fastifyLogger.error(log)
    } else {
      console.error(JSON.stringify(log))
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    const log = this.formatLog('debug', message, metadata)

    if (this.fastifyLogger) {
      this.fastifyLogger.debug(log)
    } else {
      console.debug(JSON.stringify(log))
    }
  }
}

export default Logger