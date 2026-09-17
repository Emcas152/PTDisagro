/**
 * ============================================================================
 * CONTROLADOR DE REGISTROS (/api/v1/registrations)
 * ============================================================================
 *
 * Expone los endpoints para previsualizar descuentos, confirmar asistencia,
 * consultar confirmaciones por código y modificar selecciones.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'
import {
  CreateRegistrationDto,
  PreviewRegistrationDto,
  UpdateRegistrationDto,
} from './dto/registrations.dto'
import { RegistrationsService } from './registrations.service'

@ApiTags('Registros y Confirmaciones')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  /**
   * Previsualización instantánea de descuentos sin guardar el registro.
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Previsualizar cálculo de descuentos',
    description:
      'Calcula en el servidor los subtotales, porcentajes de descuento por categoría y total estimado con precios vigentes en la base de datos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Desglose financiero calculado exitosamente',
  })
  async preview(@Body() dto: PreviewRegistrationDto) {
    return this.registrationsService.preview(dto)
  }

  /**
   * Reenvía el correo de confirmación al participante.
   */
  @Post(':confirmationCode/resend-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenviar confirmación por correo electrónico',
    description:
      'Envía nuevamente el correo con el voucher y resumen de la cotización al correo del cliente.',
  })
  async resendEmail(@Param('confirmationCode') confirmationCode: string) {
    const sent =
      await this.registrationsService.resendConfirmationEmail(confirmationCode)
    return {
      success: true,
      sent,
      message: sent
        ? 'Correo de confirmación enviado exitosamente'
        : 'Correo registrado y simulado en el servidor',
    }
  }

  /**
   * Confirmación definitiva del registro de asistencia.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear confirmación de registro',
    description:
      'Valida datos, almacena información del cliente, guarda snapshots de precios, emite el código único y retorna el voucher final.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registro confirmado exitosamente con código único generado',
  })
  @ApiResponse({
    status: 400,
    description: 'Evento inactivo, fecha límite expirada o ítem agotado',
  })
  async create(
    @Body() dto: CreateRegistrationDto,
    @Req() request: FastifyRequest,
  ) {
    const ip = request.ip
    return this.registrationsService.create(dto, ip)
  }

  /**
   * Consulta una confirmación por su código único.
   */
  @Get(':confirmationCode')
  @ApiOperation({
    summary: 'Consultar confirmación por código único',
    description:
      'Recupera el resumen completo del participante, servicios, productos y desglose de descuentos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmación encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Código de confirmación inexistente',
  })
  async getByCode(@Param('confirmationCode') confirmationCode: string) {
    return this.registrationsService.getByConfirmationCode(confirmationCode)
  }

  /**
   * Permite actualizar la selección de servicios y productos de una confirmación.
   */
  @Patch(':confirmationCode')
  @ApiOperation({
    summary: 'Modificar selección de servicios y productos',
    description:
      'Actualiza los ítems elegidos y recalcula los descuentos y totales utilizando los precios vigentes de la base de datos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmación actualizada y recalculada',
  })
  async update(
    @Param('confirmationCode') confirmationCode: string,
    @Body() dto: UpdateRegistrationDto,
  ) {
    return this.registrationsService.update(confirmationCode, dto)
  }
}
