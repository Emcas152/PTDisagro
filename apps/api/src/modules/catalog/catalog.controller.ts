/**
 * ============================================================================
 * CONTROLADOR DE CATÁLOGO PÚBLICO (/api/v1/catalog)
 * ============================================================================
 */

import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CatalogItemType } from '@prisma/client'
import { CatalogService } from './catalog.service'

@ApiTags('Catálogo')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Obtiene la lista completa de servicios y productos activos.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar ítems del catálogo',
    description:
      'Devuelve el catálogo de servicios y productos disponibles, con filtros opcionales por tipo, categoría o término de búsqueda.',
  })
  @ApiQuery({ name: 'type', enum: CatalogItemType, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Lista de ítems obtenida' })
  async getCatalog(
    @Query('type') type?: CatalogItemType,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.catalogService.getItems({
      type,
      category,
      search,
      activeOnly: true,
    })
  }

  /**
   * Obtiene los detalles de un ítem por su ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de ítem del catálogo' })
  @ApiResponse({ status: 200, description: 'Detalle del ítem' })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado' })
  async getItem(@Param('id') id: string) {
    return this.catalogService.getItemById(id)
  }
}
