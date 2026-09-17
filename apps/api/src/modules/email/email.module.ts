/**
 * ============================================================================
 * MÓDULO DE CORREOS ELECTRÓNICOS (EmailModule)
 * ============================================================================
 */

import { Module } from '@nestjs/common'
import { EmailService } from './email.service'

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
