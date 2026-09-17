/**
 * ============================================================================
 * SERVICIO DE CONEXIÓN PRISMA - ACCESO A BASE DE DATOS
 * ============================================================================
 *
 * Administra el ciclo de vida de la conexión a PostgreSQL a través de Prisma Client,
 * asegurando conexiones controladas y desconexión limpia (graceful shutdown).
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import {
  CatalogItemType,
  EventStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('PrismaService')

  /**
   * Se ejecuta al inicializar el módulo para abrir la conexión y asegurar datos base.
   */
  async onModuleInit() {
    await this.$connect()
    await this.seedDefaults()
  }

  /**
   * Se ejecuta al apagar la aplicación para cerrar ordenadamente el pool de conexiones.
   */
  async onModuleDestroy() {
    await this.$disconnect()
  }

  /**
   * Asegura que el usuario administrador, evento y catálogo inicial existan.
   */
  private async seedDefaults() {
    try {
      // 1. Asegurar Admin
      const adminEmail = 'admin@disagro.com'
      const adminExists = await this.user.findUnique({
        where: { email: adminEmail },
      })

      if (!adminExists) {
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash('AdminPassword2026!', salt)
        await this.user.create({
          data: {
            name: 'Administrador Disagro',
            email: adminEmail,
            passwordHash,
            role: UserRole.SUPERADMIN,
          },
        })
        this.logger.log(`✅ Usuario Admin creado: ${adminEmail}`)
      }

      // 2. Asegurar Evento Activo
      const eventExists = await this.event.findFirst({
        where: { status: EventStatus.ACTIVE },
      })

      if (!eventExists) {
        await this.event.create({
          data: {
            name: 'Feria Anual de Promociones Disagro 2026',
            description:
              'Evento corporativo anual para la presentación de paquetes tecnológicos, insumos de alta gama, servicios especializados y promociones exclusivas para clientes.',
            location: 'Centro de Convenciones Disagro / Modalidad Híbrida',
            startDate: new Date('2026-10-15T08:00:00Z'),
            endDate: new Date('2026-10-17T18:00:00Z'),
            registrationDeadline: new Date('2026-10-14T23:59:59Z'),
            status: EventStatus.ACTIVE,
          },
        })
        this.logger.log('✅ Evento Feria Disagro 2026 creado')
      }

      // 3. Asegurar Catálogo base si está vacío
      const itemsCount = await this.catalogItem.count()
      if (itemsCount === 0) {
        const items = [
          {
            name: 'Consultoría Tecnológica en Riego y Suelos',
            description: 'Diagnóstico agronómico y optimización computarizada.',
            price: 800.0,
            priceCents: 80000,
            category: 'Consultoría',
            type: CatalogItemType.SERVICE,
          },
          {
            name: 'Auditoría y Análisis Foliar de Nutrientes',
            description: 'Evaluación de laboratorio y recomendaciones personalizadas.',
            price: 900.0,
            priceCents: 90000,
            category: 'Laboratorio',
            type: CatalogItemType.SERVICE,
          },
          {
            name: 'Planificación y Monitoreo Agrícola Satelital',
            description: 'Imágenes NDVI y alertas de estrés hídrico.',
            price: 1200.0,
            priceCents: 120000,
            category: 'Agricultura de Precisión',
            type: CatalogItemType.SERVICE,
          },
          {
            name: 'Fertilizante Especializado NPK Granulado (Saco 50 kg)',
            description: 'Fórmula balanceada para cultivos de exportación.',
            price: 350.0,
            priceCents: 35000,
            category: 'Fertilizantes',
            type: CatalogItemType.PRODUCT,
          },
          {
            name: 'Bioestimulante Foliar con Aminoácidos (Galón)',
            description: 'Solución concentrada para recuperación vegetal.',
            price: 220.0,
            priceCents: 22000,
            category: 'Nutrición',
            type: CatalogItemType.PRODUCT,
          },
          {
            name: 'Kit de Sensores Portátiles de Humedad de Suelo',
            description: 'Medidor digital con display instantáneo.',
            price: 500.0,
            priceCents: 50000,
            category: 'Herramientas',
            type: CatalogItemType.PRODUCT,
          },
        ]

        for (const item of items) {
          await this.catalogItem.create({
            data: { ...item, active: true },
          })
        }
        this.logger.log('✅ Catálogo básico inicializado')
      }
    } catch (err: any) {
      this.logger.warn(`No se pudo inicializar auto-seed: ${err.message}`)
    }
  }
}
