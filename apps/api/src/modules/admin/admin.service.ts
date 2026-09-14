/**
 * ============================================================================
 * SERVICIO ADMINISTRATIVO (Backoffice Disagro)
 * ============================================================================
 *
 * Provee agregaciones estadísticas, listado avanzado de participantes,
 * exportación de registros a CSV y control del catálogo comercial.
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import { CatalogItemType, Prisma, RegistrationStatus } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Obtiene métricas ejecutivas para el Dashboard administrativo.
   */
  async getDashboardMetrics() {
    const totalRegistrations = await this.prisma.registration.count()
    const confirmedCount = await this.prisma.registration.count({
      where: { status: RegistrationStatus.CONFIRMED },
    })
    const modifiedCount = await this.prisma.registration.count({
      where: { status: RegistrationStatus.MODIFIED },
    })

    // Suma de montos
    const aggregation = await this.prisma.registration.aggregate({
      _sum: {
        estimatedTotal: true,
        totalDiscountAmount: true,
        serviceSubtotal: true,
        productSubtotal: true,
      },
    })

    // Conteo total de servicios y productos seleccionados
    const itemsCount = await this.prisma.registrationItem.groupBy({
      by: ['itemType'],
      _sum: {
        quantity: true,
      },
    })

    let totalServicesSelected = 0
    let totalProductsSelected = 0

    for (const item of itemsCount) {
      if (item.itemType === CatalogItemType.SERVICE) {
        totalServicesSelected = item._sum.quantity || 0
      } else if (item.itemType === CatalogItemType.PRODUCT) {
        totalProductsSelected = item._sum.quantity || 0
      }
    }

    // Últimos registros para la tabla del dashboard
    const recentRegistrations = await this.prisma.registration.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        event: true,
        items: true,
      },
    })

    return {
      totalRegistrations,
      confirmedCount,
      modifiedCount,
      totalEstimatedRevenue: Number(aggregation._sum.estimatedTotal || 0),
      totalSavingsGranted: Number(aggregation._sum.totalDiscountAmount || 0),
      totalServiceSubtotal: Number(aggregation._sum.serviceSubtotal || 0),
      totalProductSubtotal: Number(aggregation._sum.productSubtotal || 0),
      totalServicesSelected,
      totalProductsSelected,
      recentRegistrations,
    }
  }

  /**
   * Consulta paginada y filtrada de confirmaciones de participantes.
   */
  async getRegistrations(params: {
    search?: string
    status?: RegistrationStatus
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    const { search, status, startDate, endDate, page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const where: Prisma.RegistrationWhereInput = {}

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { confirmationCode: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            fullName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            company: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    const [total, items] = await Promise.all([
      this.prisma.registration.count({ where }),
      this.prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          event: true,
          items: {
            include: {
              catalogItem: true,
            },
          },
        },
      }),
    ])

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Consulta el detalle completo de un registro por ID.
   */
  async getRegistrationById(id: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        customer: true,
        event: true,
        items: {
          include: {
            catalogItem: true,
          },
        },
      },
    })

    if (!registration) {
      throw new NotFoundException(`Registro con ID ${id} no encontrado`)
    }

    return registration
  }

  /**
   * Genera el archivo CSV con los participantes registrados.
   */
  async exportRegistrationsCsv(): Promise<string> {
    const registrations = await this.prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        event: true,
        items: true,
      },
    })

    const headers = [
      'Codigo de Confirmacion',
      'Estado',
      'Fecha Registro',
      'Cliente',
      'Email',
      'Telefono',
      'Empresa',
      'Puesto',
      'Fecha Asistencia',
      'Metodo Contacto',
      'Subtotal Servicios (Q)',
      'Descuento Servicios (%)',
      'Ahorro Servicios (Q)',
      'Subtotal Productos (Q)',
      'Descuento Productos (%)',
      'Ahorro Productos (Q)',
      'Ahorro Total (Q)',
      'Total Estimado (Q)',
      'Items Seleccionados',
    ]

    const rows = registrations.map((r) => {
      const itemsSummary = r.items
        .map((i) => `${i.nameSnapshot} (x${i.quantity})`)
        .join('; ')
        .replace(/"/g, '""')

      return [
        `"${r.confirmationCode}"`,
        `"${r.status}"`,
        `"${r.createdAt.toISOString()}"`,
        `"${r.customer.fullName.replace(/"/g, '""')}"`,
        `"${r.customer.email}"`,
        `"${r.customer.phone}"`,
        `"${(r.customer.company || '').replace(/"/g, '""')}"`,
        `"${(r.customer.jobTitle || '').replace(/"/g, '""')}"`,
        `"${r.customer.attendanceDate || ''}"`,
        `"${r.customer.preferredContactMethod}"`,
        r.serviceSubtotal.toString(),
        `${r.serviceDiscountPercentage}%`,
        r.serviceDiscountAmount.toString(),
        r.productSubtotal.toString(),
        `${r.productDiscountPercentage}%`,
        r.productDiscountAmount.toString(),
        r.totalDiscountAmount.toString(),
        r.estimatedTotal.toString(),
        `"${itemsSummary}"`,
      ].join(',')
    })

    return [headers.join(','), ...rows].join('\n')
  }

  /**
   * Crear nuevo ítem en el catálogo desde el panel administrativo.
   */
  async createCatalogItem(
    userId: string,
    data: {
      type: CatalogItemType
      name: string
      description?: string
      price: number
      imageUrl?: string
      category?: string
      active?: boolean
    },
    ip?: string,
  ) {
    const item = await this.prisma.catalogItem.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        price: data.price,
        priceCents: Math.round(data.price * 100),
        imageUrl: data.imageUrl,
        category: data.category,
        active: data.active ?? true,
      },
    })

    await this.audit.log({
      userId,
      action: 'CATALOG_ITEM_CREATED',
      entity: 'CatalogItem',
      entityId: item.id,
      metadata: { name: item.name, price: item.price, type: item.type },
      ipAddress: ip,
    })

    return item
  }

  /**
   * Modificar ítem existente.
   */
  async updateCatalogItem(
    userId: string,
    id: string,
    data: {
      name?: string
      description?: string
      price?: number
      imageUrl?: string
      category?: string
      active?: boolean
    },
    ip?: string,
  ) {
    const updateData: Prisma.CatalogItemUpdateInput = { ...data }
    if (data.price !== undefined) {
      updateData.price = data.price
      updateData.priceCents = Math.round(data.price * 100)
    }

    const updated = await this.prisma.catalogItem.update({
      where: { id },
      data: updateData,
    })

    await this.audit.log({
      userId,
      action: 'CATALOG_ITEM_UPDATED',
      entity: 'CatalogItem',
      entityId: id,
      metadata: data,
      ipAddress: ip,
    })

    return updated
  }

  /**
   * Cambiar estado activo/inactivo.
   */
  async toggleCatalogItem(userId: string, id: string, ip?: string) {
    const current = await this.prisma.catalogItem.findUnique({
      where: { id },
    })

    if (!current) {
      throw new NotFoundException('Ítem no encontrado')
    }

    const updated = await this.prisma.catalogItem.update({
      where: { id },
      data: { active: !current.active },
    })

    await this.audit.log({
      userId,
      action: updated.active ? 'CATALOG_ITEM_ACTIVATED' : 'CATALOG_ITEM_DEACTIVATED',
      entity: 'CatalogItem',
      entityId: id,
      ipAddress: ip,
    })

    return updated
  }
}
