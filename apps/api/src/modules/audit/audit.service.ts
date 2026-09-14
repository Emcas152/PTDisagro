/**
 * ============================================================================
 * SERVICIO DE AUDITORÍA
 * ============================================================================
 *
 * Registra trazabilidad inmutable de todas las acciones administrativas críticas
 * realizadas en el sistema (modificaciones de catálogo, exportaciones, etc.).
 */

import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface LogAuditParams {
  userId?: string
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, any>
  ipAddress?: string
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inserta un registro en la tabla de auditoría (audit_logs).
   */
  async log(params: LogAuditParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
          ipAddress: params.ipAddress,
        },
      })
    } catch (error) {
      this.logger.error(`Error al registrar auditoría: ${(error as Error).message}`)
    }
  }
}
