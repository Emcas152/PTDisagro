/**
 * ============================================================================
 * SERVICIO DE EVENTOS
 * ============================================================================
 *
 * Administra la información de los eventos anuales de promociones,
 * asegurando la disponibilidad del evento activo y sus catálogos asociados.
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import { EventStatus } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el evento promocional que se encuentra en estado ACTIVO.
   *
   * @returns Datos del evento activo
   */
  async getActiveEvent() {
    const event = await this.prisma.event.findFirst({
      where: { status: EventStatus.ACTIVE },
    })

    if (!event) {
      throw new NotFoundException(
        'No hay ningún evento promocional activo en este momento',
      )
    }

    return event
  }

  /**
   * Obtiene el catálogo de Servicios y Productos activos vinculados a un evento.
   *
   * @param eventId - Identificador único del evento
   * @returns Listado de ítems disponibles en el catálogo
   */
  async getEventCatalog(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      throw new NotFoundException('El evento especificado no existe')
    }

    const items = await this.prisma.catalogItem.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return items
  }

  /**
   * Lista todos los eventos registrados en el sistema (panel administrativo).
   */
  async getAllEvents() {
    return this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })
  }

  /**
   * Actualiza el estado o datos de un evento.
   *
   * @param id - Identificador del evento
   * @param data - Campos a modificar
   */
  async updateEvent(id: string, data: any) {
    const event = await this.prisma.event.findUnique({ where: { id } })
    if (!event) {
      throw new NotFoundException('Evento no encontrado')
    }

    return this.prisma.event.update({
      where: { id },
      data,
    })
  }
}
