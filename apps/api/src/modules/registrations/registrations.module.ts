/**
 * ============================================================================
 * MÓDULO DE REGISTROS
 * ============================================================================
 */

import { Module } from '@nestjs/common'
import { DiscountsModule } from '../discounts/discounts.module'
import { EmailModule } from '../email/email.module'
import { RegistrationsController } from './registrations.controller'
import { RegistrationsService } from './registrations.service'

@Module({
  imports: [DiscountsModule, EmailModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
