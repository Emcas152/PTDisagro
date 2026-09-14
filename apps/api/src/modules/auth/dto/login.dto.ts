/**
 * ============================================================================
 * DTO DE INICIO DE SESIÓN
 * ============================================================================
 *
 * Define la estructura y validación de los datos requeridos para autenticarse.
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    example: 'admin@disagro.com',
    description: 'Correo electrónico institucional del operador o administrador',
  })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string

  @ApiProperty({
    example: 'AdminPassword2026!',
    description: 'Contraseña de acceso',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string
}
