/**
 * ============================================================================
 * CONTROLADOR DE EVENTOS (/api/v1/events)
 * ============================================================================
 *
 * Expone la información del evento activo para los clientes y catálogo disponible.
 */

import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EventsService } from './events.service'

@ApiTags('Eventos')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Retorna el evento anual promocional activo.
   */
  @Get('active')
  @ApiOperation({
    summary: 'Obtener evento activo',
    description:
      'Devuelve los detalles, fechas límite y ubicación del evento actualmente habilitado para registros.',
  })
  @ApiResponse({
    status: 200,
    description: 'Evento activo encontrado',
  })
  async getActiveEvent() {
    return this.eventsService.getActiveEvent()
  }

  /**
   * Retorna el catálogo de servicios y productos activos para el evento.
   */
  @Get(':eventId/catalog')
  @ApiOperation({
    summary: 'Obtener catálogo del evento',
    description:
      'Devuelve todos los servicios y productos activos disponibles para selección en la feria.',
  })
  async getEventCatalog(@Param('eventId') eventId: string) {
    return this.eventsService.getEventCatalog(eventId)
  }
}
