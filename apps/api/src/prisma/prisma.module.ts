/**
 * ============================================================================
 * MÓDULO PRISMA
 * ============================================================================
 *
 * Expone PrismaService globalmente para que todos los módulos de la aplicación
 * puedan inyectarlo y realizar consultas con tipado seguro.
 */

import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
