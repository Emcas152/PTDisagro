/**
 * ============================================================================
 * MÓDULO RAÍZ DE LA APLICACIÓN (AppModule)
 * ============================================================================
 */

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuditModule } from './modules/audit/audit.module'
import { AuthModule } from './modules/auth/auth.module'
import { EventsModule } from './modules/events/events.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { DiscountsModule } from './modules/discounts/discounts.module'
import { RegistrationsModule } from './modules/registrations/registrations.module'
import { AdminModule } from './modules/admin/admin.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    EventsModule,
    CatalogModule,
    DiscountsModule,
    RegistrationsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
