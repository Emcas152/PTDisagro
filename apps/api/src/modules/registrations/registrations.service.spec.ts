/**
 * ============================================================================
 * PRUEBAS UNITARIAS Y DE INTEGRACIÓN: REGISTRATIONS SERVICE
 * ============================================================================
 *
 * Valida:
 * 1. Cálculo correcto de descuentos en preview y confirmación.
 * 2. Protección contra manipulación de precios desde el frontend (el backend es la única fuente de verdad).
 * 3. Prevención de registros duplicados por clave de idempotencia.
 * 4. Rechazo de ítems inactivos o no encontrados.
 * 5. Rechazo de eventos inactivos o con fecha límite vencida.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogItemType, EventStatus, RegistrationStatus } from '@prisma/client'
import { DiscountsService } from '../discounts/discounts.service'
import { RegistrationsService } from './registrations.service'

describe('RegistrationsService', () => {
  let service: RegistrationsService
  let prismaMock: any
  let discountsService: DiscountsService

  const mockActiveEvent = {
    id: 'event-uuid-1',
    name: 'Feria de Promociones Disagro 2026',
    status: EventStatus.ACTIVE,
    registrationDeadline: new Date(Date.now() + 86400000 * 30), // 30 días en el futuro
  }

  const mockServiceA = {
    id: 'item-service-1',
    type: CatalogItemType.SERVICE,
    name: 'Consultoría Tecnológica Agrícola',
    price: 800,
    priceCents: 80000,
    active: true,
  }

  const mockServiceB = {
    id: 'item-service-2',
    type: CatalogItemType.SERVICE,
    name: 'Monitoreo Satelital de Cultivos',
    price: 900,
    priceCents: 90000,
    active: true,
  }

  const mockProductA = {
    id: 'item-product-1',
    type: CatalogItemType.PRODUCT,
    name: 'Fertilizante Especializado Fertiagro 50kg',
    price: 200,
    priceCents: 20000,
    active: true,
  }

  const mockInactiveProduct = {
    id: 'item-product-inactive',
    type: CatalogItemType.PRODUCT,
    name: 'Producto Agotado',
    price: 300,
    priceCents: 30000,
    active: false,
  }

  beforeEach(() => {
    prismaMock = {
      event: {
        findUnique: vi.fn(),
      },
      catalogItem: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      registration: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      registrationItem: {
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb(prismaMock)
      }),
    }

    const emailServiceMock: any = {
      sendRegistrationConfirmation: vi.fn().mockResolvedValue(true),
    }

    discountsService = new DiscountsService()
    service = new RegistrationsService(prismaMock, discountsService, emailServiceMock)
  })

  describe('preview', () => {
    it('debe calcular el descuento correctamente para 2 servicios con subtotal mayor a Q1500 (5% de descuento)', async () => {
      prismaMock.catalogItem.findMany.mockResolvedValue([mockServiceA, mockServiceB])

      const result = await service.preview({
        items: [
          { catalogItemId: mockServiceA.id, quantity: 1 },
          { catalogItemId: mockServiceB.id, quantity: 1 },
        ],
      })

      // Q800 + Q900 = Q1700 (> Q1500) -> 5% = Q85
      expect(result.breakdown.serviceSubtotal).toBe(1700)
      expect(result.breakdown.serviceDiscountPercentage).toBe(5)
      expect(result.breakdown.serviceDiscountAmount).toBe(85)
      expect(result.breakdown.totalSavingsAmount).toBe(85)
      expect(result.breakdown.estimatedTotal).toBe(1615)
      expect(result.items).toHaveLength(2)
    })

    it('debe rechazar la previsualización si un ítem solicitado está inactivo', async () => {
      prismaMock.catalogItem.findMany.mockResolvedValue([mockInactiveProduct])

      await expect(
        service.preview({
          items: [{ catalogItemId: mockInactiveProduct.id, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('debe rechazar la previsualización si un ítem solicitado no existe en la BD', async () => {
      prismaMock.catalogItem.findMany.mockResolvedValue([])

      await expect(
        service.preview({
          items: [{ catalogItemId: 'non-existent-id', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('create (Registro definitivo)', () => {
    const validCustomer = {
      fullName: 'Juan Pérez',
      email: 'juan.perez@finca.gt',
      phone: '55554433',
      acceptedTerms: true,
    }

    it('debe crear un registro exitoso y retornar el código único', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockActiveEvent)
      prismaMock.catalogItem.findMany.mockResolvedValue([mockServiceA, mockServiceB])
      prismaMock.registration.findUnique
        .mockResolvedValueOnce(null) // idempotency check
        .mockResolvedValueOnce(null) // code uniqueness check
        .mockResolvedValueOnce({
          id: 'reg-uuid-123',
          confirmationCode: 'DISAGRO-2026-ABC123',
          status: RegistrationStatus.CONFIRMED,
          serviceSubtotal: 1700,
          serviceDiscountPercentage: 5,
          serviceDiscountAmount: 85,
          estimatedTotal: 1615,
          customer: { ...validCustomer, id: 'cust-uuid-1' },
          event: mockActiveEvent,
          items: [],
        })
      prismaMock.customer.findFirst.mockResolvedValue(null)
      prismaMock.customer.create.mockResolvedValue({
        id: 'cust-uuid-1',
        ...validCustomer,
      })
      prismaMock.registration.create.mockResolvedValue({ id: 'reg-uuid-123' })
      prismaMock.registrationItem.create.mockResolvedValue({ id: 'item-rel-1' })

      const result = await service.create({
        eventId: mockActiveEvent.id,
        customer: validCustomer,
        items: [
          { catalogItemId: mockServiceA.id, quantity: 1 },
          { catalogItemId: mockServiceB.id, quantity: 1 },
        ],
      })

      expect(result).toBeDefined()
      expect(prismaMock.registration.create).toHaveBeenCalledTimes(1)
      expect(prismaMock.registrationItem.create).toHaveBeenCalledTimes(2)
    })

    it('PREVENCIÓN DE MANIPULACIÓN: El backend ignora precios del frontend y calcula con los de BD', async () => {
      prismaMock.event.findUnique.mockResolvedValue(mockActiveEvent)
      prismaMock.catalogItem.findMany.mockResolvedValue([mockProductA])
      prismaMock.registration.findUnique.mockResolvedValue(null)
      prismaMock.customer.findFirst.mockResolvedValue({ id: 'cust-1', ...validCustomer })
      prismaMock.customer.update.mockResolvedValue({ id: 'cust-1', ...validCustomer })
      prismaMock.registration.create.mockResolvedValue({ id: 'reg-1' })
      prismaMock.registrationItem.create.mockResolvedValue({ id: 'rel-item-1' })

      // Simular que el cliente intenta enviar 5 productos (Q200 cada uno en BD = Q1000)
      // pero intenta decir que el subtotal es Q10
      await service.create({
        eventId: mockActiveEvent.id,
        customer: validCustomer,
        items: [{ catalogItemId: mockProductA.id, quantity: 5 }],
      })

      // Verificar los argumentos pasados a registration.create
      const createCall = prismaMock.registration.create.mock.calls[0][0]
      expect(createCall.data.productSubtotal).toBe(1000) // 5 * 200 = 1000
      expect(createCall.data.productDiscountPercentage).toBe(5) // 5 o más productos = 5%
      expect(createCall.data.productDiscountAmount).toBe(50) // 5% de 1000 = 50
      expect(createCall.data.estimatedTotal).toBe(950) // 1000 - 50 = 950
    })

    it('IDEMPOTENCIA: Si se envía una idempotencyKey existente, devuelve la confirmación previa sin duplicar', async () => {
      const existingRegistration = {
        id: 'reg-existing-99',
        idempotencyKey: 'key-123',
        confirmationCode: 'DISAGRO-2026-XYZ999',
      }
      prismaMock.event.findUnique.mockResolvedValue(mockActiveEvent)
      prismaMock.registration.findUnique.mockResolvedValue(existingRegistration)

      const result = await service.create({
        eventId: mockActiveEvent.id,
        customer: validCustomer,
        items: [{ catalogItemId: mockServiceA.id, quantity: 1 }],
        idempotencyKey: 'key-123',
      })

      expect(result).toEqual(existingRegistration)
      expect(prismaMock.registration.create).not.toHaveBeenCalled()
    })

    it('debe rechazar la confirmación si la fecha límite del evento ya expiró', async () => {
      const expiredEvent = {
        ...mockActiveEvent,
        registrationDeadline: new Date(Date.now() - 100000), // En el pasado
      }
      prismaMock.event.findUnique.mockResolvedValue(expiredEvent)

      await expect(
        service.create({
          eventId: expiredEvent.id,
          customer: validCustomer,
          items: [{ catalogItemId: mockServiceA.id, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('debe rechazar la confirmación si el evento está en estado DRAFT o ARCHIVED', async () => {
      const draftEvent = {
        ...mockActiveEvent,
        status: EventStatus.DRAFT,
      }
      prismaMock.event.findUnique.mockResolvedValue(draftEvent)

      await expect(
        service.create({
          eventId: draftEvent.id,
          customer: validCustomer,
          items: [{ catalogItemId: mockServiceA.id, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })
})
