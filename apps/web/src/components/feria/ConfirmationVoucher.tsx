'use client'

import React, { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/services/api'

interface ConfirmationVoucherProps {
  registration: any
  onEdit?: () => void
}

export default function ConfirmationVoucher({
  registration,
  onEdit,
}: ConfirmationVoucherProps) {
  const [voucherUrl, setVoucherUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    // Lanzar confeti corporativo de confirmación
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2e7d32', '#4caf50', '#81c784', '#1565c0'],
      })
    } catch {
      // Ignorar en entornos sin soporte canvas
    }

    if (typeof window !== 'undefined') {
      setVoucherUrl(
        `${window.location.origin}/resumen/${encodeURIComponent(
          registration.confirmationCode || '',
        )}`,
      )
    }
  }, [registration.confirmationCode])

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(registration.confirmationCode)
    setCopied(true)
    setToastMessage('Código copiado al portapapeles')
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleResendEmail = async () => {
    setSendingEmail(true)
    try {
      await api.resendRegistrationEmail(registration.confirmationCode)
      setToastMessage('¡Confirmación enviada exitosamente al correo!')
    } catch (err: any) {
      setToastMessage(err.message || 'No se pudo reenviar el correo.')
    } finally {
      setSendingEmail(false)
    }
  }

  const attendanceDateFormatted = registration.customer?.attendanceDate
    ? new Date(registration.customer.attendanceDate).toLocaleDateString('es-GT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Por confirmar'

  return (
    <div className='max-w-3xl mx-auto space-y-6 py-6 print:py-0 print:space-y-0'>
      {/* Estilos CSS específicos para impresión nítida */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          header,
          footer,
          nav,
          .no-print {
            display: none !important;
          }
          #printable-voucher {
            box-shadow: none !important;
            border: 2px solid #2e7d32 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
          }
          .print-black-text {
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Banner de Éxito en Pantalla (Oculto en Impresión) */}
      <div className='no-print bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center shadow-xs'>
        <div className='w-14 h-14 bg-[#2e7d32] text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md'>
          <i className='ri-checkbox-circle-line text-3xl' />
        </div>
        <h2 className='text-2xl font-black text-gray-900 dark:text-white tracking-tight'>
          ¡Asistencia y Portafolio Confirmados!
        </h2>
        <p className='text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-lg mx-auto'>
          Hemos preparado su cotización promocional exclusiva. Se ha enviado un
          correo de confirmación con este resumen a{' '}
          <strong>{registration.customer?.email}</strong>.
        </p>

        <div className='mt-4 flex flex-wrap items-center justify-center gap-2 text-xs'>
          <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-medium'>
            <i className='ri-mail-check-line text-sm' /> Confirmación enviada al correo
          </span>
          <Button
            size='small'
            variant='text'
            onClick={handleResendEmail}
            disabled={sendingEmail}
            sx={{
              textTransform: 'none',
              fontSize: '11px',
              color: '#2e7d32',
              fontWeight: 700,
            }}
          >
            {sendingEmail ? (
              <>
                <CircularProgress size={12} sx={{ mr: 1 }} color='inherit' /> Reenviando...
              </>
            ) : (
              'Reenviar Correo'
            )}
          </Button>
        </div>
      </div>

      {/* Voucher Oficial Imprimible */}
      <Card
        id='printable-voucher'
        className='border border-borderColor rounded-2xl shadow-xl overflow-hidden bg-backgroundPaper print:border-2 print:border-emerald-700 print:rounded-lg'
      >
        {/* Encabezado Corporativo del Voucher */}
        <div className='bg-[#24292e] text-white p-6 flex items-center justify-between print:bg-[#1b5e20] print:text-white'>
          <div className='flex items-center space-x-3'>
            <div className='w-11 h-11 rounded-xl bg-[#2e7d32] flex items-center justify-center font-black text-white text-2xl shadow-sm'>
              D
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-extrabold text-xl text-white tracking-tight'>
                  DISAGRO
                </h3>
                <span className='text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded'>
                  2026
                </span>
              </div>
              <p className='text-xs text-gray-300 font-medium'>
                Comprobante y Voucher Oficial de Registro Promocional
              </p>
            </div>
          </div>
          <div className='text-right'>
            <span className='text-[10px] text-gray-400 block uppercase tracking-wider'>
              Estado de Asistencia
            </span>
            <span className='text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/30'>
              {registration.status || 'CONFIRMADO'}
            </span>
          </div>
        </div>

        {/* Sección Destacada con QR y Código de Confirmación */}
        <div className='p-6 bg-actionHover/50 border-b border-borderColor print:bg-white print:border-b-2 print:border-gray-200'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-6'>
            {/* Contenedor del Código QR */}
            <div className='flex items-center gap-4'>
              <div className='p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-2 print:border-gray-800 flex items-center justify-center'>
                {voucherUrl ? (
                  <QRCodeSVG
                    value={voucherUrl}
                    size={110}
                    level='M'
                    includeMargin={false}
                  />
                ) : (
                  <div className='w-[110px] h-[110px] bg-gray-100 flex items-center justify-center text-xs text-gray-400'>
                    Cargando QR...
                  </div>
                )}
              </div>

              <div className='space-y-1 text-center sm:text-left'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block'>
                  Código QR de Verificación
                </span>
                <p className='text-xs text-textSecondary max-w-xs'>
                  Escanee este código con la cámara de un teléfono o lector para
                  acceder instantáneamente a la versión digital y validar la
                  autenticidad en la entrada de la feria.
                </p>
                <span className='text-[10px] text-textDisabled font-mono block'>
                  Verificación: {registration.id?.slice(0, 12)}...
                </span>
              </div>
            </div>

            {/* Código Único de Registro */}
            <div className='flex flex-col items-center sm:items-end space-y-1.5'>
              <span className='text-xs font-bold text-textSecondary uppercase tracking-wider'>
                Código Único de Confirmación
              </span>
              <div className='flex items-center space-x-2'>
                <span className='text-2xl sm:text-3xl font-mono font-black text-textPrimary tracking-widest bg-backgroundPaper px-4 py-2 rounded-xl border-2 border-emerald-600/40 shadow-inner print:text-black print:border-black'>
                  {registration.confirmationCode}
                </span>
                <Tooltip title={copied ? 'Copiado' : 'Copiar código'}>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={copyCodeToClipboard}
                    className='no-print'
                    sx={{
                      minWidth: 42,
                      height: 42,
                      borderColor: 'var(--mui-palette-divider)',
                      color: 'var(--mui-palette-text-primary)',
                    }}
                  >
                    <i
                      className={
                        copied
                          ? 'ri-check-line text-lg text-emerald-500'
                          : 'ri-file-copy-line text-lg'
                      }
                    />
                  </Button>
                </Tooltip>
              </div>
              <span className='text-[10px] text-textSecondary'>
                Presente este código en el mostrador de registro
              </span>
            </div>
          </div>
        </div>

        {/* Contenido Principal del Comprobante */}
        <CardContent className='p-6 space-y-6 bg-backgroundPaper text-textPrimary print:bg-white print:text-black'>
          {/* Ficha del Participante */}
          <div>
            <h4 className='text-xs font-black uppercase tracking-wider text-textSecondary mb-3 flex items-center gap-1.5'>
              <i className='ri-user-follow-line text-sm text-emerald-600' />
              Datos del Participante y Asistencia
            </h4>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-actionHover border border-borderColor text-xs print:bg-white print:border-gray-300'>
              <div>
                <span className='text-textSecondary block'>Nombre Completo:</span>
                <strong className='text-textPrimary font-bold text-sm block print-black-text'>
                  {registration.customer?.fullName}
                </strong>
              </div>

              <div>
                <span className='text-textSecondary block'>Correo Electrónico:</span>
                <strong className='text-textPrimary font-bold text-sm block print-black-text'>
                  {registration.customer?.email}
                </strong>
              </div>

              <div>
                <span className='text-textSecondary block'>Teléfono / Celular:</span>
                <strong className='text-textPrimary font-semibold text-xs block print-black-text'>
                  {registration.customer?.phone}
                </strong>
              </div>

              <div>
                <span className='text-textSecondary block'>Empresa / Puesto:</span>
                <strong className='text-textPrimary font-semibold text-xs block print-black-text'>
                  {registration.customer?.company || 'Independiente'}{' '}
                  {registration.customer?.jobTitle
                    ? `(${registration.customer.jobTitle})`
                    : ''}
                </strong>
              </div>

              <div className='sm:col-span-2 pt-2 border-t border-borderColor print:border-gray-300 flex items-center justify-between'>
                <span className='text-textSecondary'>Fecha Programada de Asistencia:</span>
                <strong className='text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase print:text-black'>
                  {attendanceDateFormatted}
                </strong>
              </div>
            </div>
          </div>

          <Divider className='border-borderColor print:border-gray-300' />

          {/* Resumen Completo de Ítems Solicitados */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='text-xs font-black uppercase tracking-wider text-textSecondary flex items-center gap-1.5'>
                <i className='ri-shopping-bag-3-line text-sm text-emerald-600' />
                Resumen de lo Solicitado ({registration.items?.length || 0} ítems)
              </h4>
              <span className='text-[11px] text-textSecondary font-mono'>
                Moneda: Quetzales (GTQ)
              </span>
            </div>

            <div className='border border-borderColor rounded-xl overflow-hidden print:border-gray-400'>
              <table className='w-full text-xs text-left'>
                <thead className='bg-actionHover text-textSecondary font-bold border-b border-borderColor print:bg-gray-100 print:text-black'>
                  <tr>
                    <th className='p-3'>Ítem / Solicitud</th>
                    <th className='p-3 text-center'>Tipo</th>
                    <th className='p-3 text-center'>Cant.</th>
                    <th className='p-3 text-right'>Precio Unit.</th>
                    <th className='p-3 text-right'>Total</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-borderColor print:divide-gray-300'>
                  {registration.items?.map((item: any, idx: number) => (
                    <tr
                      key={item.id || idx}
                      className='hover:bg-actionHover/50 print:bg-white'
                    >
                      <td className='p-3 font-medium text-textPrimary print-black-text'>
                        <div className='font-bold'>{item.nameSnapshot}</div>
                        {item.catalogItem?.category && (
                          <span className='text-[10px] text-textSecondary block'>
                            Cat: {item.catalogItem.category}
                          </span>
                        )}
                      </td>
                      <td className='p-3 text-center'>
                        <span
                          className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                            item.itemType === 'SERVICE'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 print:text-black print:border print:border-gray-400'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 print:text-black print:border print:border-gray-400'
                          }`}
                        >
                          {item.itemType === 'SERVICE' ? 'Servicio' : 'Producto'}
                        </span>
                      </td>
                      <td className='p-3 text-center font-bold text-textPrimary print-black-text'>
                        {item.quantity}
                      </td>
                      <td className='p-3 text-right text-textSecondary print-black-text'>
                        Q. {Number(item.unitPriceSnapshot).toFixed(2)}
                      </td>
                      <td className='p-3 text-right font-black text-textPrimary print-black-text'>
                        Q. {Number(item.lineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Divider className='border-borderColor print:border-gray-300' />

          {/* Desglose Financiero y Descuentos */}
          <div className='bg-actionHover/70 rounded-xl p-5 space-y-2.5 text-xs border border-borderColor print:bg-white print:border-gray-400'>
            <div className='flex justify-between text-textSecondary print-black-text'>
              <span>Subtotal Servicios Solicitados:</span>
              <span className='font-semibold text-textPrimary print-black-text'>
                Q. {Number(registration.serviceSubtotal).toFixed(2)}
              </span>
            </div>

            <div className='flex justify-between text-textSecondary print-black-text'>
              <span>Subtotal Productos e Insumos Solicitados:</span>
              <span className='font-semibold text-textPrimary print-black-text'>
                Q. {Number(registration.productSubtotal).toFixed(2)}
              </span>
            </div>

            <div className='flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold print-black-text'>
              <span>
                Descuento Promocional en Servicios ({registration.serviceDiscountPercentage}%):
              </span>
              <span>- Q. {Number(registration.serviceDiscountAmount).toFixed(2)}</span>
            </div>

            <div className='flex justify-between text-blue-600 dark:text-blue-400 font-semibold print-black-text'>
              <span>
                Descuento Promocional en Productos ({registration.productDiscountPercentage}%):
              </span>
              <span>- Q. {Number(registration.productDiscountAmount).toFixed(2)}</span>
            </div>

            <div className='flex justify-between text-emerald-700 dark:text-emerald-400 font-extrabold border-t border-borderColor pt-2 text-sm print-black-text'>
              <span>Ahorro Total Obtenido en la Feria:</span>
              <span>Q. {Number(registration.totalDiscountAmount).toFixed(2)}</span>
            </div>

            <div className='flex justify-between items-center text-sm font-black text-textPrimary border-t-2 border-borderColor pt-3 print:border-black print-black-text'>
              <span className='text-base'>Total Final Estimado a Invertir:</span>
              <span className='text-2xl font-black text-emerald-600 dark:text-emerald-400 print:text-black'>
                Q. {Number(registration.estimatedTotal).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notas Legales e Instrucciones para el Evento */}
          <div className='pt-2 text-[10px] text-textSecondary leading-relaxed print:text-black border-t border-borderColor'>
            <p className='font-bold mb-0.5'>Condiciones de Validez:</p>
            <p>
              1. Este comprobante no constituye factura fiscal obligatoria; es
              una cotización oficial con precios y descuentos preferenciales
              reservados para la Feria Disagro 2026.
            </p>
            <p>
              2. Los descuentos y disponibilidad de inventario se garantizan
              al presentar este voucher físico o el código QR digital en el
              módulo de bienvenida del evento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botones de Acción (Ocultos al Imprimir) */}
      <div className='no-print flex flex-col sm:flex-row gap-3 items-center justify-between pt-2'>
        <Button
          variant='outlined'
          color='inherit'
          onClick={onEdit}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            borderColor: 'var(--mui-palette-divider)',
          }}
          startIcon={<i className='ri-edit-line' />}
        >
          Modificar Selección
        </Button>

        <div className='flex flex-wrap items-center gap-3'>
          <Button
            variant='outlined'
            onClick={handleResendEmail}
            disabled={sendingEmail}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              borderColor: '#2e7d32',
              color: '#2e7d32',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#1b5e20',
                backgroundColor: 'rgba(46, 125, 50, 0.04)',
              },
            }}
            startIcon={
              sendingEmail ? (
                <CircularProgress size={16} color='inherit' />
              ) : (
                <i className='ri-mail-send-line' />
              )
            }
          >
            {sendingEmail ? 'Enviando...' : 'Reenviar al Correo'}
          </Button>

          <Button
            variant='contained'
            onClick={handlePrint}
            sx={{
              backgroundColor: '#2e7d32',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              paddingX: 3,
              '&:hover': { backgroundColor: '#1b5e20' },
            }}
            startIcon={<i className='ri-printer-line' />}
          >
            Descargar / Imprimir Voucher con QR
          </Button>
        </div>
      </div>

      {/* Toast de Notificaciones */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity='success'
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}
