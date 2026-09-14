/**
 * ============================================================================
 * CONTROLADOR DE SALUD Y READINESS (/api/v1/health)
 * ============================================================================
 */

import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../prisma/prisma.service'

@ApiTags('Monitoreo y Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar salud de la API y conexión a base de datos',
  })
  @ApiResponse({ status: 200, description: 'Servicio en óptimas condiciones' })
  async check() {
    let dbStatus = 'healthy'
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch (e) {
      dbStatus = 'degraded'
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'PTdisagro Promotions API',
      version: '1.0.0',
      database: dbStatus,
    }
  }
}
