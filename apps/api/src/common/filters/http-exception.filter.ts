/**
 * ============================================================================
 * FILTRO GLOBAL DE EXCEPCIONES HTTP
 * ============================================================================
 *
 * Captura todas las excepciones que ocurren en la aplicación y las transforma
 * a una respuesta JSON estandarizada con código de error, detalles de validación,
 * requestId para trazabilidad y marca de tiempo.
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { v4 as uuidv4 } from 'uuid'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  /**
   * Captura y formatea cualquier excepción lanzada durante el procesamiento de la solicitud.
   *
   * @param exception - La excepción interceptada (HttpException o Error genérico)
   * @param host - Contenedor de argumentos que permite acceder a la solicitud y respuesta de Fastify
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    const requestId = (request.headers['x-request-id'] as string) || uuidv4()

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let code = 'INTERNAL_SERVER_ERROR'
    let message = 'Ha ocurrido un error inesperado en el servidor'
    let errors: Array<{ field: string; message: string }> | undefined = undefined

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
        code = this.obtenerCodigoSegunStatus(statusCode)
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const respObj = exceptionResponse as Record<string, any>
        message = respObj.message || message
        code = respObj.code || this.obtenerCodigoSegunStatus(statusCode)

        // Si la validación de DTOs devolvió una lista de errores
        if (Array.isArray(respObj.message)) {
          message = 'Los datos proporcionados no son válidos'
          code = 'VALIDATION_ERROR'
          errors = respObj.message.map((msg: string) => {
            const partes = msg.split(' ')
            return {
              field: partes[0] || 'campo',
              message: msg,
            }
          })
        } else if (respObj.errors) {
          errors = respObj.errors
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${requestId}] Error no controlado: ${exception.message}`,
        exception.stack,
      )
    }

    const payload = {
      statusCode,
      code,
      message,
      ...(errors ? { errors } : {}),
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(statusCode).send(payload)
  }

  /**
   * Asigna un código nemotécnico estándar basado en el código de estado HTTP.
   *
   * @param status - Código de estado HTTP numérico
   * @returns Cadena identificadora del tipo de error
   */
  private obtenerCodigoSegunStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST'
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED'
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN'
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND'
      case HttpStatus.CONFLICT:
        return 'CONFLICT'
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR'
      default:
        return 'INTERNAL_SERVER_ERROR'
    }
  }
}
