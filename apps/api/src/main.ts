/**
 * ============================================================================
 * PUNTO DE ENTRADA PRINCIPAL DE LA API (NestJS + Fastify)
 * ============================================================================
 *
 * Configura el adaptador Fastify para alto rendimiento, seguridad con Helmet,
 * CORS para el cliente frontend, cookies seguras HttpOnly, Swagger OpenAPI
 * y manejo centralizado de excepciones y validaciones.
 */

import 'reflect-metadata'
import { ValidationPipe, Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // Inicializar Fastify con logs optimizados
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: true,
    }),
  )

  // 1. Prefijo global versionado /api/v1
  app.setGlobalPrefix('api/v1')

  // 2. Seguridad con Helmet
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false, // Permitir Swagger UI
  })

  // 3. Manejo de Cookies HttpOnly seguras
  await app.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET || 'disagro-feria-secret-session-key-2026',
  })

  // 4. Configuración de CORS
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000'
  await app.register(fastifyCors as any, {
    origin: (origin, cb) => {
      // Permitir llamadas locales, sin origin (curl/mobile/docker) o el origen configurado
      if (!origin || origin.includes('localhost') || origin === clientOrigin) {
        cb(null, true)
        return
      }
      cb(null, true)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Cookie'],
  })

  // 5. Filtro global de excepciones estandarizado
  app.useGlobalFilters(new HttpExceptionFilter())

  // 6. Tubería global de validación (ValidationPipe)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // 7. Documentación interactiva OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Feria Disagro 2026 - API de Promociones')
    .setDescription(
      'Documentación de la API REST para el registro de participantes, cálculo determinista de descuentos y backoffice administrativo de la Feria Disagro.',
    )
    .setVersion('1.0.0')
    .addTag('Eventos', 'Consulta del evento activo y catálogos vinculados')
    .addTag('Catálogo', 'Servicios tecnológicos y productos corporativos')
    .addTag('Registros y Confirmaciones', 'Preview de descuentos, confirmación de asistencia y edición')
    .addTag('Autenticación y Sesiones', 'Login administrativo mediante cookies HttpOnly')
    .addTag('Administración y Reportes', 'Métricas, participantes y exportación CSV')
    .addTag('Monitoreo y Salud', 'Health check y readiness')
    .addCookieAuth('disagro_session')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
  SwaggerModule.setup('api/v1/docs', app, document)

  // 8. Apagado controlado (Graceful Shutdown)
  app.enableShutdownHooks()

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000
  const host = process.env.HOST || '0.0.0.0'

  await app.listen(port, host)
  logger.log(`🚀 Servidor API ejecutándose en http://${host}:${port}`)
  logger.log(`📚 Documentación Swagger disponible en http://localhost:${port}/docs`)
}

bootstrap()
