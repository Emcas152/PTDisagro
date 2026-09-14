/**
 * ============================================================================
 * SERVICIO DE REGISTROS DE ASISTENCIA Y PROMOCIONES
 * ============================================================================
 *
 * Administra el flujo transaccional de confirmación de participantes,
 * snapshots de precios vigentes y cálculo seguro de descuentos sin confiar
 * en montos provistos por el cliente.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  CalculationItemInput,
  ContactPreference,
  DiscountCalculationResult,
} from '@ptdisagro/contracts'
import { EventStatus, RegistrationStatus } from '@prisma/client'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { DiscountsService } from '../discounts/discounts.service'
import {
  CreateRegistrationDto,
  PreviewRegistrationDto,
  SelectedItemDto,
  UpdateRegistrationDto,
} from './dto/registrations.dto'

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountsService: DiscountsService,
  ) {}

  /**
   * Genera un código único e intuitivo de confirmación.
   * Ejemplo: DISAGRO-2026-7X9K2M
   */
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      const randIndex = crypto.randomInt(0, chars.length)
      code += chars[randIndex]
    }
    return `DISAGRO-2026-${code}`
  }

  /**
   * Valida la existencia y estado de los ítems de catálogo solicitados,
   * y recupera los datos y precios oficiales desde la base de datos.
   */
  private async fetchAndValidateItems(
    selectedItems: SelectedItemDto[],
  ): Promise<{
    calculationInputs: CalculationItemInput[]
    itemsMap: Map<string, any>
  }> {
    if (!selectedItems || selectedItems.length === 0) {
      throw new BadRequestException(
        'Debe seleccionar al menos un servicio o producto para calcular la promoción',
      )
    }

    const itemIds = selectedItems.map((i) => i.catalogItemId)
    const dbItems = await this.prisma.catalogItem.findMany({
      where: {
        id: { in: itemIds },
      },
    })

    const itemsMap = new Map(dbItems.map((item) => [item.id, item]))

    // Validar que todos los ítems existan y se encuentren activos
    for (const selected of selectedItems) {
      const dbItem = itemsMap.get(selected.catalogItemId)

      if (!dbItem) {
        throw new NotFoundException(
          `El ítem con ID ${selected.catalogItemId} no existe en el catálogo`,
        )
      }

      if (!dbItem.active) {
        throw new BadRequestException(
          `El ítem "${dbItem.name}" ya no se encuentra disponible para esta promoción`,
        )
      }

      if (selected.quantity < 1) {
        throw new BadRequestException(
          `La cantidad para "${dbItem.name}" debe ser de al menos 1 unidad`,
        )
      }
    }

    const calculationInputs: CalculationItemInput[] = selectedItems.map(
      (selected) => {
        const dbItem = itemsMap.get(selected.catalogItemId)!
        return {
          catalogItemId: dbItem.id,
          name: dbItem.name,
          priceCents: dbItem.priceCents,
          quantity: selected.quantity || 1,
          type: dbItem.type,
        }
      },
    )

    return { calculationInputs, itemsMap }
  }

  /**
   * PREVIEW DE DESCUENTOS:
   * Calcula el desglose en tiempo real a partir de los precios de base de datos
   * sin alterar ni guardar registros en la base de datos.
   */
  async preview(dto: PreviewRegistrationDto): Promise<{
    breakdown: DiscountCalculationResult
    items: Array<{
      id: string
      name: string
      type: string
      price: number
      quantity: number
      lineTotal: number
    }>
  }> {
    const { calculationInputs, itemsMap } =
      await this.fetchAndValidateItems(dto.items)

    const breakdown = this.discountsService.calculate(calculationInputs)

    const itemDetails = calculationInputs.map((input) => {
      const dbItem = itemsMap.get(input.catalogItemId)
      const unitPrice = Number(dbItem.price)
      const lineTotal = unitPrice * input.quantity
      return {
        id: input.catalogItemId,
        name: dbItem.name,
        type: dbItem.type,
        price: unitPrice,
        quantity: input.quantity,
        lineTotal,
      }
    })

    return {
      breakdown,
      items: itemDetails,
    }
  }

  /**
   * CREAR REGISTRO DEFINITIVO:
   * Ejecuta la confirmación transaccional, guarda snapshots de precios,
   * emite el código único y vincula al cliente.
   */
  async create(dto: CreateRegistrationDto, ipAddress?: string) {
    // 1. Validar el evento activo
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    })

    if (!event) {
      throw new NotFoundException('El evento promocional especificado no existe')
    }

    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException(
        'El evento no se encuentra disponible para registrar asistencia actualmente',
      )
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      throw new BadRequestException(
        'El período de confirmación para este evento ha concluido',
      )
    }

    // 2. Prevenir duplicados accidentales por clave de idempotencia
    if (dto.idempotencyKey) {
      const existing = await this.prisma.registration.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          customer: true,
          items: true,
          event: true,
        },
      })

      if (existing) {
        return existing
      }
    }

    // 3. Obtener ítems y precios de la base de datos
    const { calculationInputs, itemsMap } =
      await this.fetchAndValidateItems(dto.items)

    // 4. Calcular los descuentos oficiales en el backend
    const breakdown = this.discountsService.calculate(calculationInputs)

    // 5. Generar código de confirmación único con reintentos
    let confirmationCode = this.generateConfirmationCode()
    let codeExists = true
    let attempts = 0

    while (codeExists && attempts < 10) {
      const found = await this.prisma.registration.findUnique({
        where: { confirmationCode },
      })
      if (!found) {
        codeExists = false
      } else {
        confirmationCode = this.generateConfirmationCode()
        attempts++
      }
    }

    if (codeExists) {
      throw new ConflictException(
        'No fue posible generar un código único en este momento. Intente de nuevo.',
      )
    }

    // 6. Transacción atómica de base de datos
    const result = await this.prisma.$transaction(async (tx) => {
      // Registrar o actualizar cliente
      const customerEmail = dto.customer.email.toLowerCase().trim()
      let customer = await tx.customer.findFirst({
        where: { email: customerEmail },
      })

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            fullName: dto.customer.fullName.trim(),
            email: customerEmail,
            phone: dto.customer.phone.trim(),
            company: dto.customer.company?.trim() || null,
            jobTitle: dto.customer.jobTitle?.trim() || null,
            attendanceDate: dto.customer.attendanceDate || null,
            preferredContactMethod:
              dto.customer.preferredContactMethod || ContactPreference.EMAIL,
          },
        })
      } else {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            fullName: dto.customer.fullName.trim(),
            phone: dto.customer.phone.trim(),
            company: dto.customer.company?.trim() || customer.company,
            jobTitle: dto.customer.jobTitle?.trim() || customer.jobTitle,
            attendanceDate:
              dto.customer.attendanceDate || customer.attendanceDate,
            preferredContactMethod:
              dto.customer.preferredContactMethod ||
              customer.preferredContactMethod,
          },
        })
      }

      // Crear la confirmación oficial con montos calculados
      const registration = await tx.registration.create({
        data: {
          eventId: event.id,
          customerId: customer.id,
          confirmationCode,
          idempotencyKey: dto.idempotencyKey || null,
          status: RegistrationStatus.CONFIRMED,
          // Montos en Quetzales oficiales calculados de forma exacta
          serviceSubtotal: breakdown.serviceSubtotal,
          productSubtotal: breakdown.productSubtotal,
          serviceDiscountPercentage: breakdown.serviceDiscountPercentage,
          productDiscountPercentage: breakdown.productDiscountPercentage,
          serviceDiscountAmount: breakdown.serviceDiscountAmount,
          productDiscountAmount: breakdown.productDiscountAmount,
          totalDiscountAmount: breakdown.totalSavingsAmount,
          estimatedTotal: breakdown.estimatedTotal,
          confirmedAt: new Date(),
        },
      })

      // Insertar snapshots inmutables de los ítems seleccionados
      for (const input of calculationInputs) {
        const dbItem = itemsMap.get(input.catalogItemId)!
        const unitPrice = Number(dbItem.price)
        const lineTotal = unitPrice * input.quantity

        await tx.registrationItem.create({
          data: {
            registrationId: registration.id,
            catalogItemId: dbItem.id,
            itemType: dbItem.type,
            quantity: input.quantity,
            nameSnapshot: dbItem.name,
            unitPriceSnapshot: dbItem.price,
            lineTotal,
          },
        })
      }

      return tx.registration.findUnique({
        where: { id: registration.id },
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
    })

    return result
  }

  /**
   * Consulta una confirmación por su código único.
   */
  async getByConfirmationCode(confirmationCode: string) {
    const cleanCode = confirmationCode.trim().toUpperCase()

    const registration = await this.prisma.registration.findUnique({
      where: { confirmationCode: cleanCode },
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
      throw new NotFoundException(
        `No se encontró ninguna confirmación con el código ${cleanCode}`,
      )
    }

    return registration
  }

  /**
   * Permite al cliente modificar su selección de servicios y productos.
   * Recalcula automáticamente todos los descuentos con precios actuales de BD.
   */
  async update(confirmationCode: string, dto: UpdateRegistrationDto) {
    const cleanCode = confirmationCode.trim().toUpperCase()

    const existing = await this.prisma.registration.findUnique({
      where: { confirmationCode: cleanCode },
      include: { event: true },
    })

    if (!existing) {
      throw new NotFoundException(
        `No se encontró la confirmación ${cleanCode} para modificar`,
      )
    }

    if (existing.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Esta confirmación se encuentra cancelada')
    }

    // 1. Obtener y validar nuevos ítems
    const { calculationInputs, itemsMap } =
      await this.fetchAndValidateItems(dto.items)

    // 2. Recalcular descuentos
    const breakdown = this.discountsService.calculate(calculationInputs)

    // 3. Actualizar en transacción
    const updated = await this.prisma.$transaction(async (tx) => {
      // Eliminar items anteriores
      await tx.registrationItem.deleteMany({
        where: { registrationId: existing.id },
      })

      // Insertar nuevos items con snapshots vigentes
      for (const input of calculationInputs) {
        const dbItem = itemsMap.get(input.catalogItemId)!
        const unitPrice = Number(dbItem.price)
        const lineTotal = unitPrice * input.quantity

        await tx.registrationItem.create({
          data: {
            registrationId: existing.id,
            catalogItemId: dbItem.id,
            itemType: dbItem.type,
            quantity: input.quantity,
            nameSnapshot: dbItem.name,
            unitPriceSnapshot: dbItem.price,
            lineTotal,
          },
        })
      }

      // Actualizar totales de la confirmación
      return tx.registration.update({
        where: { id: existing.id },
        data: {
          status: RegistrationStatus.MODIFIED,
          serviceSubtotal: breakdown.serviceSubtotal,
          productSubtotal: breakdown.productSubtotal,
          serviceDiscountPercentage: breakdown.serviceDiscountPercentage,
          productDiscountPercentage: breakdown.productDiscountPercentage,
          serviceDiscountAmount: breakdown.serviceDiscountAmount,
          productDiscountAmount: breakdown.productDiscountAmount,
          totalDiscountAmount: breakdown.totalSavingsAmount,
          estimatedTotal: breakdown.estimatedTotal,
        },
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
    })

    return updated
  }
}
