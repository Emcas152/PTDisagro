/**
 * ============================================================================
 * SERVICIO DE NOTIFICACIONES POR CORREO ELECTRÓNICO (EmailService)
 * ============================================================================
 *
 * Envía confirmaciones con diseño corporativo Disagro, código único,
 * desglose financiero de promociones y enlace directo al voucher oficial con QR.
 */

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter: nodemailer.Transporter | null = null

  constructor(private readonly configService: ConfigService) {
    this.initTransporter()
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST')
    const user = this.configService.get<string>('SMTP_USER')
    const pass = this.configService.get<string>('SMTP_PASS')
    const port = Number(this.configService.get<number>('SMTP_PORT')) || 587
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465

    if (host && user) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      })
      this.logger.log(`Servicio de correo SMTP configurado con host: ${host}:${port}`)
    } else {
      this.logger.warn(
        'Variables SMTP no detectadas. El servicio de correo operará en modo Simulación/Desarrollo (los correos se registrarán en los logs).',
      )
    }
  }

  /**
   * Envía el correo de confirmación de registro y cotización de feria.
   */
  async sendRegistrationConfirmation(registration: any): Promise<boolean> {
    const customer = registration.customer
    if (!customer?.email) {
      this.logger.warn(`No se puede enviar confirmación: El registro no contiene correo electrónico.`)
      return false
    }

    const clientUrl =
      this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000'
    const voucherUrl = `${clientUrl}/resumen/${registration.confirmationCode}`

    const subject = `Confirmación de Registro y Cotización - Feria Disagro 2026 [${registration.confirmationCode}]`

    const html = this.buildVoucherEmailHtml({
      registration,
      customer,
      voucherUrl,
    })

    const from =
      this.configService.get<string>('SMTP_FROM') ||
      '"Feria Disagro 2026" <registro@feriadisagro.com>'

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from,
          to: customer.email,
          subject,
          html,
        })
        this.logger.log(
          `Correo de confirmación enviado exitosamente a ${customer.email} (Código: ${registration.confirmationCode})`,
        )
      } else {
        this.logger.log(`
================================================================================
[SIMULACIÓN DE CORREO DISAGRO]
Para: ${customer.fullName} <${customer.email}>
Asunto: ${subject}
Código de Confirmación: ${registration.confirmationCode}
Ahorro Promocional: Q. ${Number(registration.totalDiscountAmount).toFixed(2)}
Total Estimado: Q. ${Number(registration.estimatedTotal).toFixed(2)}
Ver Voucher con QR: ${voucherUrl}
================================================================================
        `)
      }
      return true
    } catch (error: any) {
      this.logger.error(
        `Error al intentar enviar el correo de confirmación a ${customer.email}: ${error.message}`,
        error.stack,
      )
      // No lanzamos excepción para no frustrar la creación del registro
      return false
    }
  }

  /**
   * Plantilla HTML responsiva y corporativa para el correo de confirmación.
   */
  private buildVoucherEmailHtml(params: {
    registration: any
    customer: any
    voucherUrl: string
  }): string {
    const { registration, customer, voucherUrl } = params

    const itemsRows = (registration.items || [])
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 8px; font-size: 13px; color: #1f2937;">
            <strong>${item.nameSnapshot}</strong>
            <span style="display: block; font-size: 11px; color: #6b7280;">
              ${item.itemType === 'SERVICE' ? 'Servicio Agronómico' : 'Insumo / Producto'}
            </span>
          </td>
          <td style="padding: 10px 8px; font-size: 13px; text-align: center; color: #1f2937;">
            ${item.quantity}
          </td>
          <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #4b5563;">
            Q. ${Number(item.unitPriceSnapshot).toFixed(2)}
          </td>
          <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-weight: bold; color: #1f2937;">
            Q. ${Number(item.lineTotal).toFixed(2)}
          </td>
        </tr>`,
      )
      .join('')

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Registro Feria Disagro 2026</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #1f2937;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Header Corporativo -->
    <tr>
      <td style="background-color: #24292e; padding: 24px; text-align: center;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: left;">
              <span style="display: inline-block; background-color: #2e7d32; color: #ffffff; font-weight: 900; font-size: 18px; padding: 6px 12px; border-radius: 6px;">DISAGRO</span>
            </td>
            <td style="text-align: right;">
              <span style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Feria Corporativa 2026</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Banner Principal -->
    <tr>
      <td style="background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #ffffff;">¡Registro y Cotización Confirmados!</h1>
        <p style="margin: 0; font-size: 14px; color: #e8f5e9;">Gracias por acompañarnos en la innovación para el campo guatemalteco.</p>
      </td>
    </tr>

    <!-- Bloque de Código de Confirmación -->
    <tr>
      <td style="padding: 24px; text-align: center; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 1px;">
          Su Código Único de Asistencia
        </p>
        <div style="display: inline-block; background-color: #ffffff; border: 2px dashed #2e7d32; border-radius: 8px; padding: 10px 24px;">
          <span style="font-family: monospace; font-size: 24px; font-weight: 900; color: #2e7d32; letter-spacing: 2px;">
            ${registration.confirmationCode}
          </span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
          Presente este código o el código QR adjunto en el voucher digital al llegar al evento.
        </p>
      </td>
    </tr>

    <!-- Datos del Participante -->
    <tr>
      <td style="padding: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #374151; border-bottom: 2px solid #2e7d32; padding-bottom: 4px; display: inline-block;">
          Datos del Asistente
        </h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #4b5563;">
          <tr>
            <td width="35%" style="font-weight: 600; color: #1f2937;">Participante:</td>
            <td>${customer.fullName}</td>
          </tr>
          ${customer.company ? `<tr><td style="font-weight: 600; color: #1f2937;">Empresa:</td><td>${customer.company} ${customer.jobTitle ? `(${customer.jobTitle})` : ''}</td></tr>` : ''}
          <tr>
            <td style="font-weight: 600; color: #1f2937;">Teléfono:</td>
            <td>${customer.phone}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #1f2937;">Fecha de Asistencia:</td>
            <td><strong>${customer.attendanceDate || 'Por confirmar'}</strong></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Tabla de Ítems Solicitados -->
    <tr>
      <td style="padding: 0 24px 24px 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #374151; border-bottom: 2px solid #2e7d32; padding-bottom: 4px; display: inline-block;">
          Resumen de Portafolio Solicitado
        </h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #4b5563; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #d1d5db;">
              <th style="padding: 8px; text-align: left;">Ítem</th>
              <th style="padding: 8px; text-align: center;">Cant.</th>
              <th style="padding: 8px; text-align: right;">P. Unit.</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Liquidación Financiera y Ahorros -->
    <tr>
      <td style="padding: 0 24px 24px 24px;">
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px;">
            <tr>
              <td style="color: #6b7280;">Subtotal Servicios:</td>
              <td style="text-align: right; font-weight: 600; color: #1f2937;">Q. ${Number(registration.serviceSubtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #6b7280;">Subtotal Productos:</td>
              <td style="text-align: right; font-weight: 600; color: #1f2937;">Q. ${Number(registration.productSubtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #059669;">Descuento en Servicios (${registration.serviceDiscountPercentage}%):</td>
              <td style="text-align: right; font-weight: 600; color: #059669;">- Q. ${Number(registration.serviceDiscountAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #2563eb;">Descuento en Productos (${registration.productDiscountPercentage}%):</td>
              <td style="text-align: right; font-weight: 600; color: #2563eb;">- Q. ${Number(registration.productDiscountAmount).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #d1d5db;">
              <td style="color: #059669; font-weight: bold; padding-top: 8px;">Ahorro Total Promocional:</td>
              <td style="text-align: right; font-weight: 800; color: #059669; padding-top: 8px;">Q. ${Number(registration.totalDiscountAmount).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #1f2937;">
              <td style="font-size: 15px; font-weight: 800; color: #1f2937; padding-top: 8px;">Total Estimado a Invertir:</td>
              <td style="text-align: right; font-size: 18px; font-weight: 900; color: #2e7d32; padding-top: 8px;">Q. ${Number(registration.estimatedTotal).toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Botón de Acción Directo al Voucher con QR -->
    <tr>
      <td style="padding: 0 24px 32px 24px; text-align: center;">
        <a href="${voucherUrl}" target="_blank" style="display: inline-block; background-color: #2e7d32; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
          Abrir e Imprimir Voucher con Código QR
        </a>
        <p style="margin: 12px 0 0 0; font-size: 11px; color: #9ca3af;">
          O copie este enlace en su navegador: <br>
          <a href="${voucherUrl}" style="color: #2e7d32; text-decoration: underline;">${voucherUrl}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
        <p style="margin: 0 0 4px 0;"><strong>DISAGRO de Guatemala S.A.</strong> - Todos los derechos reservados &copy; 2026</p>
        <p style="margin: 0;">Este mensaje contiene información confidencial de su cotización de feria. Si recibió este correo por error, por favor descártelo.</p>
      </td>
    </tr>

  </table>
</body>
</html>
`
  }
}
