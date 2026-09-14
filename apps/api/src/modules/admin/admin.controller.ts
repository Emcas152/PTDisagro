/**
 * ============================================================================
 * CONTROLADOR ADMINISTRATIVO (/api/v1/admin)
 * ============================================================================
 */

import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CatalogItemType, RegistrationStatus } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AdminService } from './admin.service'

@ApiTags('Administración y Reportes')
@ApiCookieAuth()
@UseGuards(AuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Métricas globales del evento y resumen financiero.
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Métricas para el Dashboard',
    description:
      'Devuelve el total de confirmaciones, ingresos estimados, ahorros otorgados y desglose por categoría.',
  })
  async getDashboard() {
    return this.adminService.getDashboardMetrics()
  }

  /**
   * Lista paginada y filtrable de confirmaciones.
   */
  @Get('registrations')
  @ApiOperation({ summary: 'Listar registros de participantes con filtros' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', enum: RegistrationStatus, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRegistrations(
    @Query('search') search?: string,
    @Query('status') status?: RegistrationStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getRegistrations({
      search,
      status,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    })
  }

  /**
   * Exporta todos los registros a CSV.
   */
  @Get('registrations/export')
  @ApiOperation({ summary: 'Exportar participantes a archivo CSV' })
  async exportCsv(@Res() reply: FastifyReply) {
    const csv = await this.adminService.exportRegistrationsCsv()
    const fileName = `participantes-feria-disagro-${new Date().toISOString().slice(0, 10)}.csv`

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .send(csv)
  }

  /**
   * Consulta el detalle de un registro por ID.
   */
  @Get('registrations/:id')
  @ApiOperation({ summary: 'Detalle de un registro de confirmación' })
  async getRegistrationById(@Param('id') id: string) {
    return this.adminService.getRegistrationById(id)
  }

  /**
   * Agrega un nuevo producto o servicio al catálogo.
   */
  @Post('catalog')
  @ApiOperation({ summary: 'Crear ítem en el catálogo' })
  async createCatalogItem(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      type: CatalogItemType
      name: string
      description?: string
      price: number
      imageUrl?: string
      category?: string
      active?: boolean
    },
    @Req() request: FastifyRequest,
  ) {
    return this.adminService.createCatalogItem(userId, body, request.ip)
  }

  /**
   * Actualiza los datos de un producto o servicio del catálogo.
   */
  @Put('catalog/:id')
  @ApiOperation({ summary: 'Actualizar ítem del catálogo' })
  async updateCatalogItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string
      description?: string
      price?: number
      imageUrl?: string
      category?: string
      active?: boolean
    },
    @Req() request: FastifyRequest,
  ) {
    return this.adminService.updateCatalogItem(userId, id, body, request.ip)
  }

  /**
   * Habilita o deshabilita un ítem del catálogo.
   */
  @Patch('catalog/:id/toggle')
  @ApiOperation({ summary: 'Alternar estado activo/inactivo de un ítem' })
  async toggleCatalogItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Req() request: FastifyRequest,
  ) {
    return this.adminService.toggleCatalogItem(userId, id, request.ip)
  }
}
