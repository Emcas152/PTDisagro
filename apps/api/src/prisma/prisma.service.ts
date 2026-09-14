/**
 * ============================================================================
 * SERVICIO DE CONEXIÓN PRISMA - ACCESO A BASE DE DATOS
 * ============================================================================
 *
 * Administra el ciclo de vida de la conexión a PostgreSQL a través de Prisma Client,
 * asegurando conexiones controladas y desconexión limpia (graceful shutdown).
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Se ejecuta al inicializar el módulo para abrir la conexión a la base de datos.
   */
  async onModuleInit() {
    await this.$connect()
  }

  /**
   * Se ejecuta al apagar la aplicación para cerrar ordenadamente el pool de conexiones.
   */
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
