/**
 * ============================================================================
 * SCRIPT DE SEMBRADO DE DATOS (SEED) - FERIA DE PROMOCIONES DISAGRO
 * ============================================================================
 *
 * Este script inicializa la base de datos con:
 * 1. Usuario Administrador del sistema con contraseña hasheada (bcrypt).
 * 2. Evento Anual Activo ("Feria de Promociones Disagro").
 * 3. Catálogo representativo con al menos 6 Servicios y 8 Productos.
 * 4. Registros de demostración con snapshots y cálculos de descuento auditados.
 */

import {
  CatalogItemType,
  ContactPreference,
  EventStatus,
  PrismaClient,
  RegistrationStatus,
  UserRole,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

/**
 * Función principal que orquesta la inserción ordenada de datos iniciales.
 */
async function main() {
  console.info('🌱 Iniciando sembrado de datos en la base de datos...')

  // 1. Crear o actualizar Usuario Administrador
  const adminEmail = 'admin@disagro.com'
  const adminPassword = 'AdminPassword2026!'
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(adminPassword, salt)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
    },
    create: {
      name: 'Administrador Disagro',
      email: adminEmail,
      passwordHash,
      role: UserRole.SUPERADMIN,
    },
  })
  console.info(`✅ Administrador asegurado: ${admin.email}`)

  // 2. Crear Evento Anual Activo
  const existingEvent = await prisma.event.findFirst({
    where: { status: EventStatus.ACTIVE },
  })

  let event = existingEvent
  if (!event) {
    event = await prisma.event.create({
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
    console.info(`✅ Evento activo creado: ${event.name}`)
  }

  // 3. Catálogo de SERVICIOS (Mínimo 6)
  const serviciosData = [
    {
      name: 'Consultoría Tecnológica en Riego y Suelos',
      description:
        'Diagnóstico agronómico y optimización computarizada del sistema de riego por goteo.',
      price: 800.0,
      priceCents: 80000,
      category: 'Consultoría',
      type: CatalogItemType.SERVICE,
    },
    {
      name: 'Auditoría y Análisis Foliar de Nutrientes',
      description:
        'Evaluación integral de laboratorio y recomendaciones personalizadas de fertilización.',
      price: 900.0,
      priceCents: 90000,
      category: 'Laboratorio',
      type: CatalogItemType.SERVICE,
    },
    {
      name: 'Planificación y Monitoreo Agrícola Satelital',
      description:
        'Imágenes multiespectrales NDVI periódicas y alertas tempranas de estrés hídrico.',
      price: 1200.0,
      priceCents: 120000,
      category: 'Agricultura de Precisión',
      type: CatalogItemType.SERVICE,
    },
    {
      name: 'Mantenimiento Preventivo de Equipos de Aspersión',
      description:
        'Calibración y revisión técnica general de boquillas, bombas y presiones.',
      price: 450.0,
      priceCents: 45000,
      category: 'Mantenimiento',
      type: CatalogItemType.SERVICE,
    },
    {
      name: 'Capacitación en Manejo Seguro de Agroquímicos',
      description:
        'Taller certificado para cuadrillas de campo sobre normativas y protocolos de seguridad.',
      price: 650.0,
      priceCents: 65000,
      category: 'Capacitación',
      type: CatalogItemType.SERVICE,
    },
    {
      name: 'Automatización y Conectividad de Invernaderos IoT',
      description:
        'Instalación de sensores telemétricos de humedad, temperatura y luminosidad.',
      price: 1850.0,
      priceCents: 185000,
      category: 'Automatización',
      type: CatalogItemType.SERVICE,
    },
  ]

  // 4. Catálogo de PRODUCTOS (Mínimo 8)
  const productosData = [
    {
      name: 'Fertilizante Especializado NPK Granulado (Saco 50 kg)',
      description:
        'Fórmula balanceada de rápida asimilación para cultivos de exportación.',
      price: 350.0,
      priceCents: 35000,
      category: 'Fertilizantes',
      type: CatalogItemType.PRODUCT,
    },
    {
      name: 'Bioestimulante Foliar con Aminoácidos (Galón)',
      description:
        'Solución concentrada para recuperación vegetal ante choque térmico o sequía.',
      price: 220.0,
      priceCents: 22000,
      category: 'Nutrición',
      type: CatalogItemType.PRODUCT,
    },
    {
      name: 'Kit de Sensores Portátiles de Humedad de Suelo',
      description:
        'Medidor digital con display instantáneo y sonda de acero inoxidable.',
      price: 500.0,
      priceCents: 50000,
      category: 'Herramientas',
      type: CatalogItemType.PRODUCT,
    },
    {
      name: 'Bomba Aspersora Profesional Manual de 20 Litros',
      description:
        'Estructura ergonómica de polietileno de alta densidad con lanza reforzada.',
      price: 480.0,
      priceCents: 48000,
      category: 'Equipamiento',
      type: CatalogItemType.PRODUCT,
    },
    {
      name: 'Coadyuvante Surfactante Agrícola (Caneca 20 L)',
      description:
        'Regulador de pH y adherente de alta dispersión para aplicaciones foliares.',
      price: 600.0,
      priceCents: 60000,
      category: 'Adyuvantes',
      type: CatalogItemType.PRODUCT,
    },
    {
      name: 'Inoculante Microbiano Fijador de Nitrógeno (Pack 5 kg)',
      description:
        'Bacterias benéficas seleccionadas para potenciar el enraizamiento.',
      price: 280.0,
      priceCents: 28000,
      category: 'Biológicos',
      type: CatalogItemType.PRODUCT,
    },
    {
      name: 'Trampa Cromática y Feromonas de Monitoreo (Caja 50 unds)',
      description:
        'Control etológico preventivo contra insectos plaga en plantaciones.',
      price: 180.0,
      priceCents: 18000,
      category: 'Protección',
      type: CatalogItemType.PRODUCT,
    },
    {
      name: 'Manguera de Goteo Autocompensada 100m',
      description:
        'Tubería de polietileno virgen con goteros integrados de flujo constante.',
      price: 320.0,
      priceCents: 32000,
      category: 'Riego',
      type: CatalogItemType.PRODUCT,
    },
  ]

  // Insertar o actualizar catálogo
  for (const item of [...serviciosData, ...productosData]) {
    const existingItem = await prisma.catalogItem.findFirst({
      where: { name: item.name },
    })

    if (!existingItem) {
      await prisma.catalogItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          priceCents: item.priceCents,
          category: item.category,
          type: item.type,
          active: true,
        },
      })
    }
  }
  console.info('✅ Catálogo de Servicios y Productos poblado exitosamente.')

  // 5. Crear un Cliente y Registro de Demostración para pruebas iniciales
  const demoCustomer = await prisma.customer.create({
    data: {
      fullName: 'Carlos Alberto Martínez González',
      email: 'carlos.martinez@agroexport.gt',
      phone: '55443322',
      company: 'Agropecuaria El Mirador, S.A.',
      jobTitle: 'Gerente Agrícola',
      attendanceDate: '2026-10-15 09:30 AM',
      preferredContactMethod: ContactPreference.EMAIL,
    },
  })

  // Obtener algunos items del catálogo para armar la confirmación demo
  const srv1 = await prisma.catalogItem.findFirst({
    where: { name: 'Consultoría Tecnológica en Riego y Suelos' },
  })
  const srv2 = await prisma.catalogItem.findFirst({
    where: { name: 'Auditoría y Análisis Foliar de Nutrientes' },
  })
  const prd1 = await prisma.catalogItem.findFirst({
    where: { name: 'Fertilizante Especializado NPK Granulado (Saco 50 kg)' },
  })
  const prd2 = await prisma.catalogItem.findFirst({
    where: { name: 'Bioestimulante Foliar con Aminoácidos (Galón)' },
  })

  if (srv1 && srv2 && prd1 && prd2 && event) {
    // Escenario de ejemplo: 2 servicios (Q800 + Q900 = Q1,700 -> > Q1500 -> 5% descuento)
    // Productos: 5 productos (2 de prd1 + 3 de prd2 -> 5 productos -> 5% descuento)
    const demoRegistration = await prisma.registration.create({
      data: {
        eventId: event.id,
        customerId: demoCustomer.id,
        confirmationCode: 'DISAGRO-2026-DEMO01',
        editToken: 'token-seguro-demo-01',
        status: RegistrationStatus.CONFIRMED,
        serviceSubtotal: 1700.0,
        productSubtotal: 1360.0,
        serviceDiscountPercentage: 5,
        productDiscountPercentage: 5,
        serviceDiscountAmount: 85.0,
        productDiscountAmount: 68.0,
        totalDiscountAmount: 153.0,
        estimatedTotal: 2907.0,
        items: {
          create: [
            {
              catalogItemId: srv1.id,
              itemType: CatalogItemType.SERVICE,
              quantity: 1,
              nameSnapshot: srv1.name,
              unitPriceSnapshot: srv1.price,
              lineTotal: srv1.price,
            },
            {
              catalogItemId: srv2.id,
              itemType: CatalogItemType.SERVICE,
              quantity: 1,
              nameSnapshot: srv2.name,
              unitPriceSnapshot: srv2.price,
              lineTotal: srv2.price,
            },
            {
              catalogItemId: prd1.id,
              itemType: CatalogItemType.PRODUCT,
              quantity: 2,
              nameSnapshot: prd1.name,
              unitPriceSnapshot: prd1.price,
              lineTotal: Number(prd1.price) * 2,
            },
            {
              catalogItemId: prd2.id,
              itemType: CatalogItemType.PRODUCT,
              quantity: 3,
              nameSnapshot: prd2.name,
              unitPriceSnapshot: prd2.price,
              lineTotal: Number(prd2.price) * 3,
            },
          ],
        },
      },
    })
    console.info(
      `✅ Registro demo creado con código: ${demoRegistration.confirmationCode}`,
    )
  }

  console.info('🌾 Sembrado completado con éxito.')
}

main()
  .catch((e) => {
    console.error('❌ Error durante la ejecución del seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
