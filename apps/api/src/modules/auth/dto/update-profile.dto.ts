import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Super Administrador Disagro',
    description: 'Nombre completo del administrador',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string

  @ApiPropertyOptional({
    example: 'admin@disagro.com',
    description: 'Correo electrónico del administrador',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  email?: string

  @ApiPropertyOptional({
    example: 'NuevaPassword2026!',
    description: 'Nueva contraseña (opcional)',
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  password?: string
}
