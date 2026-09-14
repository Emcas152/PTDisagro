/**
 * ============================================================================
 * CONTROLADOR DE AUTENTICACIÓN (/api/v1/auth)
 * ============================================================================
 *
 * Expone los endpoints de login, logout y consulta del perfil del usuario autenticado,
 * administrando de forma segura las cookies HttpOnly.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { FastifyReply, FastifyRequest } from 'fastify'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@ApiTags('Autenticación y Sesiones')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inicia sesión, valida credenciales y asigna la cookie de sesión HttpOnly.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión administrativa',
    description:
      'Valida correo y contraseña, y emite una cookie segura HttpOnly con el identificador de sesión.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión iniciada correctamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const ip = request.ip
    const userAgent = request.headers['user-agent']

    const { user, rawToken, expiresAt } = await this.authService.login(
      loginDto,
      ip,
      userAgent,
    )

    // Configurar cookie HttpOnly segura
    reply.setCookie('disagro_session', rawToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    })

    return {
      message: 'Inicio de sesión exitoso',
      user,
      token: rawToken, // Se incluye para facilitar pruebas en clientes como Swagger o Postman
    }
  }

  /**
   * Cierra la sesión activa revocando el token en la base de datos y eliminando la cookie.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Revoca la sesión activa en el servidor y limpia la cookie de autenticación.',
  })
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const rawToken =
      request.cookies?.['disagro_session'] ||
      (request.headers.authorization?.startsWith('Bearer ')
        ? request.headers.authorization.split(' ')[1]
        : '')

    if (rawToken) {
      await this.authService.logout(rawToken)
    }

    reply.clearCookie('disagro_session', { path: '/' })

    return { message: 'Sesión cerrada correctamente' }
  }

  /**
   * Retorna los datos del usuario autenticado a partir de su sesión activa.
   */
  @Get('me')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Consultar usuario autenticado',
    description: 'Devuelve la información de perfil del administrador en sesión.',
  })
  async me(@CurrentUser() user: any) {
    return { user }
  }
}
