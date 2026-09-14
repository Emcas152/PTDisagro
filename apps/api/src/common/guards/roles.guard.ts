/**
 * ============================================================================
 * GUARD DE ROLES (RolesGuard)
 * ============================================================================
 *
 * Verifica que el usuario autenticado posea uno de los roles autorizados
 * definidos mediante el decorador @Roles().
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Evalúa si el rol del usuario actual cumple con los privilegios requeridos.
   *
   * @param context - Contexto de ejecución
   * @returns Verdadero si el usuario tiene el rol permitido
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'No posee los privilegios suficientes para realizar esta acción',
      )
    }

    return true
  }
}
