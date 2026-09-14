/**
 * ============================================================================
 * DTOS DE REGISTROS DE PARTICIPANTES Y PREVIEW
 * ============================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ContactPreference,
  SelectedItemInput,
  CustomerInfo,
} from '@ptdisagro/contracts'

export class SelectedItemDto implements SelectedItemInput {
  @ApiProperty({
    description: 'Identificador único (UUID) del servicio o producto',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  catalogItemId: string

  @ApiPropertyOptional({
    description: 'Cantidad solicitada (por defecto 1)',
    default: 1,
    example: 1,
  })
  quantity: number
}

export class CustomerInfoDto implements CustomerInfo {
  @ApiProperty({
    description: 'Nombre completo del participante',
    example: 'Carlos Roberto Morales',
  })
  fullName: string

  @ApiPropertyOptional({
    description: 'Nombres',
    example: 'Carlos Roberto',
  })
  firstName?: string

  @ApiPropertyOptional({
    description: 'Apellidos',
    example: 'Morales',
  })
  lastName?: string

  @ApiProperty({
    description: 'Correo electrónico corporativo o personal',
    example: 'cmorales@empresa.com.gt',
  })
  email: string

  @ApiProperty({
    description: 'Teléfono o celular de contacto',
    example: '+502 5555-1234',
  })
  phone: string

  @ApiPropertyOptional({
    description: 'Empresa o finca donde labora',
    example: 'Agropecuaria El Roble',
  })
  company?: string

  @ApiPropertyOptional({
    description: 'Cargo o puesto del cliente',
    example: 'Gerente de Producción Agrícola',
  })
  jobTitle?: string

  @ApiPropertyOptional({
    description: 'Fecha y hora elegida para asistir al evento',
    example: '2026-10-15 10:00 AM',
  })
  attendanceDate?: string

  @ApiPropertyOptional({
    description: 'Canal de contacto preferido',
    enum: ContactPreference,
    default: ContactPreference.EMAIL,
  })
  preferredContactMethod?: ContactPreference

  @ApiProperty({
    description: 'Indica si aceptó los términos y política de privacidad',
    example: true,
  })
  acceptedTerms: boolean
}

export class PreviewRegistrationDto {
  @ApiProperty({
    description: 'Lista de ítems seleccionados para calcular descuentos en vivo',
    type: [SelectedItemDto],
  })
  items: SelectedItemDto[]
}

export class CreateRegistrationDto {
  @ApiProperty({
    description: 'ID único del evento activo',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  eventId: string

  @ApiProperty({
    description: 'Datos personales y de contacto del cliente',
    type: CustomerInfoDto,
  })
  customer: CustomerInfoDto

  @ApiProperty({
    description: 'Lista de servicios y productos seleccionados',
    type: [SelectedItemDto],
  })
  items: SelectedItemDto[]

  @ApiPropertyOptional({
    description: 'Clave de idempotencia para prevenir dobles envíos accidentales',
    example: 'idem-f8a1-432a-bc91-23098f98c',
  })
  idempotencyKey?: string
}

export class UpdateRegistrationDto {
  @ApiProperty({
    description: 'Lista actualizada de servicios y productos seleccionados',
    type: [SelectedItemDto],
  })
  items: SelectedItemDto[]
}
