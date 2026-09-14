/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN Y SESIONES
 * ============================================================================
 *
 * Gestiona el ciclo de vida de autenticación:
 * - Verificación de credenciales con bcrypt.
 * - Generación de identificadores de sesión aleatorios criptográficamente seguros.
 * - Almacenamiento seguro de tokens hasheados con SHA-256.
 * - Revocación de sesiones activas.
 */

import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Autentica al usuario mediante correo y contraseña, creando una nueva sesión en base de datos.
   *
   * @param loginDto - Credenciales ingresadas por el usuario
   * @param ipAddress - Dirección IP desde la cual se realiza la solicitud
   * @param userAgent - Agente de usuario del navegador o cliente HTTP
   * @returns Datos del usuario, token plano para la cookie y fecha de expiración
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
    })

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    // 1. Generar token criptográficamente seguro de 64 caracteres hexadecimales
    const rawToken = crypto.randomBytes(32).toString('hex')

    // 2. Hashear el token con SHA-256 para almacenamiento seguro
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    // 3. Establecer expiración de la sesión (ej. 7 días)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    try {
      await this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          ipAddress,
          userAgent,
        },
      })
    } catch (error) {
      throw new InternalServerErrorException(
        'No se pudo registrar la sesión activa',
      )
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      rawToken,
      expiresAt,
    }
  }

  /**
   * Revoca una sesión activa identificada por su token plano.
   *
   * @param rawToken - Token sin hashear extraído de la cookie de la solicitud
   */
  async logout(rawToken: string) {
    if (!rawToken) return

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    await this.prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
}
