/**
 * ============================================================================
 * GUARD DE AUTENTICACIÓN (AuthGuard)
 * ============================================================================
 *
 * Valida la existencia y vigencia de la sesión del usuario administrador.
 * 1. Extrae el token de la cookie HttpOnly `disagro_session` (o del header Authorization).
 * 2. Calcula el hash SHA-256 del token recibido.
 * 3. Busca la sesión activa en la base de datos verificando que no esté expirada ni revocada.
 * 4. Adjunta los datos del usuario autenticado a la solicitud (request.user).
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import * as crypto from 'crypto'
import { FastifyRequest } from 'fastify'
import '../../types/fastify'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determina si la solicitud entrante cuenta con una sesión válida.
   *
   * @param context - Contexto de ejecución de NestJS
   * @returns Verdadero si la sesión es válida y no ha sido revocada
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()

    // 1. Extraer el token de la cookie HttpOnly o del header Authorization Bearer
    let rawToken = request.cookies?.['disagro_session']

    if (!rawToken && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        rawToken = parts[1]
      }
    }

    if (!rawToken) {
      throw new UnauthorizedException('No se ha proporcionado una sesión activa')
    }

    // 2. Hashear el token con SHA-256 para compararlo contra la base de datos
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    // 3. Buscar la sesión vigente en la base de datos
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!session) {
      throw new UnauthorizedException('Sesión no encontrada o inválida')
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('La sesión ha sido revocada')
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('La sesión ha expirado. Inicie sesión nuevamente')
    }

    // 4. Inyectar el usuario autenticado y la sesión en el objeto request
    ;(request as any).user = session.user
    ;(request as any).sessionId = session.id

    return true
  }
}
