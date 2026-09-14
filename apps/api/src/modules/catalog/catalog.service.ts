/**
 * ============================================================================
 * SERVICIO DE CATÁLOGO (Servicios y Productos)
 * ============================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import { CatalogItemType, Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

export interface CatalogQueryFilters {
  type?: CatalogItemType
  search?: string
  category?: string
  activeOnly?: boolean
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de ítems del catálogo aplicando filtros opcionales.
   */
  async getItems(filters: CatalogQueryFilters = {}) {
    const { type, search, category, activeOnly = true } = filters

    const where: Prisma.CatalogItemWhereInput = {}

    if (activeOnly) {
      where.active = true
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    return this.prisma.catalogItem.findMany({
      where,
      orderBy: [{ type: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    })
  }

  /**
   * Obtiene un ítem por su ID único.
   */
  async getItemById(id: string) {
    const item = await this.prisma.catalogItem.findUnique({
      where: { id },
    })

    if (!item) {
      throw new NotFoundException(`Ítem de catálogo con ID ${id} no encontrado`)
    }

    return item
  }

  /**
   * Crea un nuevo ítem en el catálogo.
   */
  async createItem(data: {
    type: CatalogItemType
    name: string
    description?: string
    price: number
    imageUrl?: string
    category?: string
    active?: boolean
  }) {
    const priceCents = Math.round(data.price * 100)

    return this.prisma.catalogItem.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        price: data.price,
        priceCents,
        imageUrl: data.imageUrl,
        category: data.category,
        active: data.active ?? true,
      },
    })
  }

  /**
   * Actualiza los datos de un ítem existente.
   */
  async updateItem(
    id: string,
    data: {
      type?: CatalogItemType
      name?: string
      description?: string
      price?: number
      imageUrl?: string
      category?: string
      active?: boolean
    },
  ) {
    await this.getItemById(id)

    const updateData: Prisma.CatalogItemUpdateInput = { ...data }

    if (data.price !== undefined) {
      updateData.price = data.price
      updateData.priceCents = Math.round(data.price * 100)
    }

    return this.prisma.catalogItem.update({
      where: { id },
      data: updateData,
    })
  }

  /**
   * Alterna el estado activo/inactivo de un ítem.
   */
  async toggleActive(id: string) {
    const item = await this.getItemById(id)

    return this.prisma.catalogItem.update({
      where: { id },
      data: { active: !item.active },
    })
  }
}
