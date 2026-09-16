/**
 * ============================================================================
 * DTOS DE REGISTROS DE PARTICIPANTES Y PREVIEW
 * ============================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
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
  @IsString()
  @IsNotEmpty()
  catalogItemId: string

  @ApiPropertyOptional({
    description: 'Cantidad solicitada (por defecto 1)',
    default: 1,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity: number
}

export class CustomerInfoDto {
  @ApiProperty({
    description: 'Nombre completo del participante',
    example: 'Carlos Roberto Morales',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string

  @ApiPropertyOptional({
    description: 'Nombres',
    example: 'Carlos Roberto',
  })
  @IsString()
  @IsOptional()
  firstName?: string

  @ApiPropertyOptional({
    description: 'Apellidos',
    example: 'Morales',
  })
  @IsString()
  @IsOptional()
  lastName?: string

  @ApiProperty({
    description: 'Correo electrónico corporativo o personal',
    example: 'cmorales@empresa.com.gt',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    description: 'Teléfono o celular de contacto',
    example: '+502 5555-1234',
  })
  @IsString()
  @IsNotEmpty()
  phone: string

  @ApiPropertyOptional({
    description: 'Empresa o finca donde labora',
    example: 'Agropecuaria El Roble',
  })
  @IsString()
  @IsOptional()
  company?: string

  @ApiPropertyOptional({
    description: 'Cargo o puesto del cliente',
    example: 'Gerente de Producción Agrícola',
  })
  @IsString()
  @IsOptional()
  jobTitle?: string

  @ApiPropertyOptional({
    description: 'Fecha y hora elegida para asistir al evento',
    example: '2026-10-15 10:00 AM',
  })
  @IsString()
  @IsOptional()
  attendanceDate?: string

  @ApiPropertyOptional({
    description: 'Canal de contacto preferido',
    enum: ContactPreference,
    default: ContactPreference.EMAIL,
  })
  @IsEnum(ContactPreference)
  @IsOptional()
  preferredContactMethod?: ContactPreference = ContactPreference.EMAIL

  @ApiProperty({
    description: 'Indica si aceptó los términos y política de privacidad',
    example: true,
  })
  @IsBoolean()
  acceptedTerms: boolean
}

export class PreviewRegistrationDto {
  @ApiProperty({
    description: 'Lista de ítems seleccionados para calcular descuentos en vivo',
    type: [SelectedItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedItemDto)
  items: SelectedItemDto[]
}

export class CreateRegistrationDto {
  @ApiProperty({
    description: 'ID único del evento activo',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string

  @ApiProperty({
    description: 'Datos personales y de contacto del cliente',
    type: CustomerInfoDto,
  })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto

  @ApiProperty({
    description: 'Lista de servicios y productos seleccionados',
    type: [SelectedItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedItemDto)
  items: SelectedItemDto[]

  @ApiPropertyOptional({
    description: 'Clave de idempotencia para prevenir dobles envíos accidentales',
    example: 'idem-f8a1-432a-bc91-23098f98c',
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string
}

export class UpdateRegistrationDto {
  @ApiProperty({
    description: 'Lista actualizada de servicios y productos seleccionados',
    type: [SelectedItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedItemDto)
  items: SelectedItemDto[]
}
