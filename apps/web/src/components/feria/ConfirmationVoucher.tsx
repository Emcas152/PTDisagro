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
  const [activeTab, setActiveTab] = useState<'voucher' | 'badge'>('badge')

  useEffect(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2e7d32', '#4caf50', '#81c784', '#1565c0'],
      })
    } catch {
      // Ignorar en entornos sin canvas
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
      setToastMessage('¡Confirmación completa enviada exitosamente al correo!')
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
      {/* Estilos CSS de impresión específicos para el Gafete Oficial */}
      <style jsx global>{`
        @media print {
          @page {
            size: portrait;
            margin: 0;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header,
          footer,
          nav,
          .no-print {
            display: none !important;
          }
          .print-badge-container {
            display: flex !important;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            background: #ffffff !important;
          }
          #printable-badge {
            display: block !important;
            width: 380px !important;
            height: 570px !important;
            border: 3px solid #2e7d32 !important;
            border-radius: 16px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Banner de Éxito en Pantalla (Oculto en Impresión) */}
      <div className='no-print bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center shadow-xs'>
        <div className='w-14 h-14 bg-[#2e7d32] text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md'>
          <i className='ri-checkbox-circle-line text-3xl' />
        </div>
        <h2 className='text-2xl font-black text-gray-900 dark:text-white tracking-tight'>
          ¡Registro Confirmado Exitosamente!
        </h2>
        <p className='text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-lg mx-auto'>
          Se ha enviado el desglose completo de su cotización a{' '}
          <strong>{registration.customer?.email}</strong>. Imprima su{' '}
          <strong>Gafete de Acreditación Oficial</strong> para ingresar al evento.
        </p>

        <div className='mt-4 flex flex-wrap items-center justify-center gap-2 text-xs'>
          <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-medium'>
            <i className='ri-mail-check-line text-sm' /> Correo completo enviado
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
              'Reenviar Correo Completo'
            )}
          </Button>
        </div>
      </div>

      {/* Pestañas de Navegación en Pantalla: Gafete de Acceso vs Detalle de Cotización */}
      <div className='no-print flex items-center justify-center gap-2 bg-actionHover p-1.5 rounded-xl border border-borderColor max-w-md mx-auto'>
        <button
          onClick={() => setActiveTab('badge')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'badge'
              ? 'bg-[#2e7d32] text-white shadow-xs'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <i className='ri-id-card-line text-base' /> Gafete de Acceso (Imprimible)
        </button>

        <button
          onClick={() => setActiveTab('voucher')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'voucher'
              ? 'bg-[#2e7d32] text-white shadow-xs'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <i className='ri-file-text-line text-base' /> Detalle de Cotización
        </button>
      </div>

      {/* ==================================================================== */}
      {/* VISTA Y SECCIÓN IMPRIMIBLE: GAFETE OFICIAL DE ACREDITACIÓN           */}
      {/* ==================================================================== */}
      <div className={`print-badge-container ${activeTab === 'badge' ? 'block' : 'hidden print:block'}`}>
        <div
          id='printable-badge'
          className='w-[380px] mx-auto border-4 border-[#2e7d32] rounded-3xl shadow-2xl overflow-hidden bg-white text-gray-900 relative my-4 print:my-0'
        >
          {/* Ranura/Guía para Cinta Colgante o Clip del Gafete */}
          <div className='pt-3 pb-1 bg-[#1b5e20] flex justify-center items-center'>
            <div className='w-14 h-2.5 bg-black/40 rounded-full border border-white/30' />
          </div>

          {/* Banner de Encabezado Corporativo Disagro */}
          <div className='bg-gradient-to-r from-[#2e7d32] to-[#1b5e20] text-white p-4 text-center border-b-2 border-emerald-400/40 relative'>
            <div className='flex items-center justify-center space-x-2 mb-1'>
              <div className='w-8 h-8 rounded-lg bg-white text-[#2e7d32] flex items-center justify-center font-black text-xl shadow-xs'>
                D
              </div>
              <span className='font-black text-2xl tracking-tight text-white'>DISAGRO</span>
            </div>
            <span className='text-[11px] font-extrabold uppercase tracking-widest text-emerald-100 block'>
              FERIA CORPORATIVA 2026
            </span>
            <div className='mt-2 inline-block bg-white/20 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full border border-white/30'>
              GAFETE OFICIAL DE ACREDITACIÓN
            </div>
          </div>

          {/* Cuerpo Principal del Gafete */}
          <div className='p-6 text-center space-y-4 bg-white'>
            {/* Nombre Completo del Participante */}
            <div>
              <span className='text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1'>
                Participante Acreditado
              </span>
              <h3 className='text-2xl font-black text-gray-900 tracking-tight leading-tight uppercase'>
                {registration.customer?.fullName}
              </h3>
            </div>

            {/* Empresa y Cargo */}
            {(registration.customer?.company || registration.customer?.jobTitle) && (
              <div className='bg-gray-100 p-2.5 rounded-xl border border-gray-200'>
                <span className='text-xs font-bold text-gray-800 block'>
                  {registration.customer?.company || 'Independiente'}
                </span>
                {registration.customer?.jobTitle && (
                  <span className='text-[11px] text-gray-600 block italic'>
                    {registration.customer.jobTitle}
                  </span>
                )}
              </div>
            )}

            {/* Fecha de Asistencia */}
            <div className='flex items-center justify-center gap-1.5 text-xs font-bold text-[#2e7d32] bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200'>
              <i className='ri-calendar-check-line text-sm' />
              <span>{attendanceDateFormatted}</span>
            </div>

            {/* Código QR de Acceso Rápido */}
            <div className='py-2 flex flex-col items-center justify-center'>
              <div className='p-3 bg-white border-2 border-gray-900 rounded-2xl shadow-sm'>
                {voucherUrl ? (
                  <QRCodeSVG value={voucherUrl} size={145} level='M' includeMargin={false} />
                ) : (
                  <div className='w-[145px] h-[145px] bg-gray-100 flex items-center justify-center text-xs text-gray-400'>
                    Cargando QR...
                  </div>
                )}
              </div>

              {/* Código Único */}
              <span className='mt-2 font-mono font-black text-lg tracking-widest text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-300 block'>
                {registration.confirmationCode}
              </span>
              <span className='text-[9px] text-gray-500 uppercase tracking-wider block mt-1'>
                Escanee en torniquetes o entrada principal
              </span>
            </div>

            {/* Pie del Gafete */}
            <div className='border-t border-gray-200 pt-3 text-[9px] text-gray-500 leading-tight'>
              Válido para ingreso a salas de exhibición y canje de beneficios promocionales Disagro 2026.
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VISTA EN PANTALLA: DETALLE COMPLETO DE COTIZACIÓN                    */}
      {/* ==================================================================== */}
      <div className={`no-print space-y-6 ${activeTab === 'voucher' ? 'block' : 'hidden'}`}>
        <Card className='border border-borderColor rounded-2xl shadow-lg overflow-hidden bg-backgroundPaper'>
          {/* Header del Voucher */}
          <div className='bg-[#24292e] text-white p-6 flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 rounded-xl bg-[#2e7d32] flex items-center justify-center font-black text-white text-xl'>
                D
              </div>
              <div>
                <h3 className='font-bold text-lg text-white'>DISAGRO 2026</h3>
                <p className='text-xs text-gray-300'>Comprobante de Cotización Promocional</p>
              </div>
            </div>
            <div className='text-right'>
              <span className='text-[10px] text-gray-400 block uppercase tracking-wider'>Estado</span>
              <span className='text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30'>
                {registration.status || 'CONFIRMADO'}
              </span>
            </div>
          </div>

          <CardContent className='p-6 space-y-6 bg-backgroundPaper text-textPrimary'>
            {/* Datos del Cliente */}
            <div>
              <h4 className='text-xs font-black uppercase tracking-wider text-textSecondary mb-3 flex items-center gap-1.5'>
                <i className='ri-user-follow-line text-sm text-emerald-600' />
                Datos del Participante
              </h4>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-actionHover border border-borderColor text-xs'>
                <div>
                  <span className='text-textSecondary block'>Nombre Completo:</span>
                  <strong className='text-textPrimary font-bold text-sm block'>
                    {registration.customer?.fullName}
                  </strong>
                </div>

                <div>
                  <span className='text-textSecondary block'>Correo Electrónico:</span>
                  <strong className='text-textPrimary font-bold text-sm block'>
                    {registration.customer?.email}
                  </strong>
                </div>

                <div>
                  <span className='text-textSecondary block'>Teléfono / Celular:</span>
                  <strong className='text-textPrimary font-semibold text-xs block'>
                    {registration.customer?.phone}
                  </strong>
                </div>

                <div>
                  <span className='text-textSecondary block'>Empresa / Puesto:</span>
                  <strong className='text-textPrimary font-semibold text-xs block'>
                    {registration.customer?.company || 'Independiente'}{' '}
                    {registration.customer?.jobTitle ? `(${registration.customer.jobTitle})` : ''}
                  </strong>
                </div>
              </div>
            </div>

            <Divider className='border-borderColor' />

            {/* Tabla Completa de Ítems Solicitados */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <h4 className='text-xs font-black uppercase tracking-wider text-textSecondary flex items-center gap-1.5'>
                  <i className='ri-shopping-bag-3-line text-sm text-emerald-600' />
                  Resumen de Portafolio Solicitado ({registration.items?.length || 0} ítems)
                </h4>
                <span className='text-[11px] text-textSecondary font-mono'>Moneda: Quetzales (GTQ)</span>
              </div>

              <div className='border border-borderColor rounded-xl overflow-hidden'>
                <table className='w-full text-xs text-left'>
                  <thead className='bg-actionHover text-textSecondary font-bold border-b border-borderColor'>
                    <tr>
                      <th className='p-3'>Ítem</th>
                      <th className='p-3 text-center'>Tipo</th>
                      <th className='p-3 text-center'>Cant.</th>
                      <th className='p-3 text-right'>Precio Unit.</th>
                      <th className='p-3 text-right'>Total</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-borderColor'>
                    {registration.items?.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className='hover:bg-actionHover/50'>
                        <td className='p-3 font-medium text-textPrimary'>
                          <div className='font-bold'>{item.nameSnapshot}</div>
                        </td>
                        <td className='p-3 text-center'>
                          <span
                            className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                              item.itemType === 'SERVICE'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {item.itemType === 'SERVICE' ? 'Servicio' : 'Producto'}
                          </span>
                        </td>
                        <td className='p-3 text-center font-bold text-textPrimary'>{item.quantity}</td>
                        <td className='p-3 text-right text-textSecondary'>
                          Q. {Number(item.unitPriceSnapshot).toFixed(2)}
                        </td>
                        <td className='p-3 text-right font-black text-textPrimary'>
                          Q. {Number(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Divider className='border-borderColor' />

            {/* Totales y Descuentos */}
            <div className='bg-actionHover/70 rounded-xl p-5 space-y-2.5 text-xs border border-borderColor'>
              <div className='flex justify-between text-textSecondary'>
                <span>Subtotal Servicios:</span>
                <span className='font-semibold text-textPrimary'>
                  Q. {Number(registration.serviceSubtotal).toFixed(2)}
                </span>
              </div>

              <div className='flex justify-between text-textSecondary'>
                <span>Subtotal Productos:</span>
                <span className='font-semibold text-textPrimary'>
                  Q. {Number(registration.productSubtotal).toFixed(2)}
                </span>
              </div>

              <div className='flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold'>
                <span>
                  Descuento en Servicios ({registration.serviceDiscountPercentage}%):
                </span>
                <span>- Q. {Number(registration.serviceDiscountAmount).toFixed(2)}</span>
              </div>

              <div className='flex justify-between text-blue-600 dark:text-blue-400 font-semibold'>
                <span>
                  Descuento en Productos ({registration.productDiscountPercentage}%):
                </span>
                <span>- Q. {Number(registration.productDiscountAmount).toFixed(2)}</span>
              </div>

              <div className='flex justify-between text-emerald-700 dark:text-emerald-400 font-extrabold border-t border-borderColor pt-2 text-sm'>
                <span>Ahorro Total Obtenido:</span>
                <span>Q. {Number(registration.totalDiscountAmount).toFixed(2)}</span>
              </div>

              <div className='flex justify-between items-center text-sm font-black text-textPrimary border-t-2 border-borderColor pt-3'>
                <span className='text-base'>Total Estimado a Invertir:</span>
                <span className='text-2xl font-black text-emerald-600 dark:text-emerald-400'>
                  Q. {Number(registration.estimatedTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de Acción Global (Ocultos al Imprimir) */}
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
            {sendingEmail ? 'Enviando...' : 'Reenviar Correo Completo'}
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
            Imprimir Gafete de Acceso
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
