'use client'

import React, { useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import confetti from 'canvas-confetti'

interface ConfirmationVoucherProps {
  registration: any
  onEdit?: () => void
}

export default function ConfirmationVoucher({
  registration,
  onEdit,
}: ConfirmationVoucherProps) {
  useEffect(() => {
    // Lanzar confeti corporativo elegante de confirmación
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2e7d32', '#4caf50', '#81c784', '#1565c0'],
    })
  }, [])

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(registration.confirmationCode)
    alert('Código copiado al portapapeles: ' + registration.confirmationCode)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className='max-w-2xl mx-auto space-y-6 py-6'>
      {/* Banner de Éxito */}
      <div className='bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center shadow-xs'>
        <div className='w-14 h-14 bg-[#2e7d32] text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md'>
          <i className='ri-check-line text-3xl' />
        </div>
        <h2 className='text-2xl font-black text-gray-900 tracking-tight'>
          ¡Asistencia y Portafolio Confirmados!
        </h2>
        <p className='text-sm text-gray-600 mt-1 max-w-md mx-auto'>
          Hemos preparado su cotización promocional exclusiva. Presente este
          código al ingresar a la <strong>Feria Disagro 2026</strong>.
        </p>
      </div>

      {/* Voucher Imprimible */}
      <Card
        id='printable-voucher'
        className='border border-borderColor rounded-2xl shadow-lg overflow-hidden bg-backgroundPaper'
      >
        {/* Encabezado del Voucher */}
        <div className='bg-[#24292e] text-white p-6 flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-9 h-9 rounded-lg bg-[#2e7d32] flex items-center justify-center font-bold text-white text-lg'>
              D
            </div>
            <div>
              <h3 className='font-bold text-lg text-white'>DISAGRO</h3>
              <p className='text-xs text-gray-300'>Comprobante de Registro Promocional 2026</p>
            </div>
          </div>
          <div className='text-right'>
            <span className='text-[10px] text-gray-400 block uppercase'>Estado</span>
            <span className='text-xs font-bold text-emerald-400 uppercase tracking-wider'>
              {registration.status || 'CONFIRMADO'}
            </span>
          </div>
        </div>

        {/* Código Único de Registro */}
        <div className='p-6 bg-actionHover border-b border-borderColor text-center'>
          <span className='text-xs font-semibold text-textSecondary uppercase tracking-wider block mb-1'>
            Código Único de Confirmación
          </span>
          <div className='flex items-center justify-center space-x-2'>
            <span className='text-2xl sm:text-3xl font-mono font-black text-textPrimary tracking-widest bg-backgroundPaper px-5 py-2 rounded-xl border border-borderColor shadow-inner'>
              {registration.confirmationCode}
            </span>
            <Tooltip title='Copiar código'>
              <Button
                size='small'
                variant='outlined'
                onClick={copyCodeToClipboard}
                sx={{
                  minWidth: 42,
                  height: 42,
                  borderColor: 'var(--mui-palette-divider)',
                  color: 'var(--mui-palette-text-primary)',
                }}
              >
                <i className='ri-file-copy-line text-lg' />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Contenido del Comprobante */}
        <CardContent className='p-6 space-y-6 bg-backgroundPaper text-textPrimary'>
          {/* Información del Cliente */}
          <div className='grid grid-cols-2 gap-4 text-xs'>
            <div>
              <span className='text-textSecondary block'>Participante:</span>
              <strong className='text-textPrimary font-semibold text-sm'>
                {registration.customer?.fullName}
              </strong>
            </div>
            <div>
              <span className='text-textSecondary block'>Correo de Contacto:</span>
              <strong className='text-textPrimary font-semibold text-sm'>
                {registration.customer?.email}
              </strong>
            </div>
            <div>
              <span className='text-textSecondary block'>Teléfono:</span>
              <strong className='text-textPrimary font-semibold text-sm'>
                {registration.customer?.phone}
              </strong>
            </div>
            <div>
              <span className='text-textSecondary block'>Fecha de Asistencia:</span>
              <strong className='text-textPrimary font-semibold text-sm'>
                {registration.customer?.attendanceDate || 'Por confirmar'}
              </strong>
            </div>
          </div>

          <Divider className='border-borderColor' />

          {/* Tabla de Ítems */}
          <div>
            <h4 className='text-xs font-bold text-textPrimary uppercase tracking-wider mb-2'>
              Detalle del Portafolio Elegido
            </h4>
            <div className='border border-borderColor rounded-lg overflow-hidden'>
              <table className='w-full text-xs text-left'>
                <thead className='bg-actionHover text-textSecondary font-semibold border-b border-borderColor'>
                  <tr>
                    <th className='p-2.5'>Ítem</th>
                    <th className='p-2.5 text-center'>Tipo</th>
                    <th className='p-2.5 text-center'>Cant.</th>
                    <th className='p-2.5 text-right'>Precio</th>
                    <th className='p-2.5 text-right'>Total</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-borderColor'>
                  {registration.items?.map((item: any) => (
                    <tr key={item.id} className='hover:bg-actionHover'>
                      <td className='p-2.5 font-medium text-textPrimary'>
                        {item.nameSnapshot}
                      </td>
                      <td className='p-2.5 text-center'>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            item.itemType === 'SERVICE'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-blue-500/15 text-blue-500'
                          }`}
                        >
                          {item.itemType === 'SERVICE' ? 'Servicio' : 'Producto'}
                        </span>
                      </td>
                      <td className='p-2.5 text-center font-semibold text-textPrimary'>
                        {item.quantity}
                      </td>
                      <td className='p-2.5 text-right text-textSecondary'>
                        Q. {Number(item.unitPriceSnapshot).toFixed(2)}
                      </td>
                      <td className='p-2.5 text-right font-bold text-textPrimary'>
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
          <div className='bg-actionHover rounded-xl p-4 space-y-2 text-xs border border-borderColor'>
            <div className='flex justify-between text-textSecondary'>
              <span>Subtotal Servicios:</span>
              <span className='font-semibold text-textPrimary'>Q. {Number(registration.serviceSubtotal).toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-textSecondary'>
              <span>Subtotal Productos:</span>
              <span className='font-semibold text-textPrimary'>Q. {Number(registration.productSubtotal).toFixed(2)}</span>
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
            <div className='flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-borderColor pt-1'>
              <span>Ahorro Total Obtenido:</span>
              <span>Q. {Number(registration.totalDiscountAmount).toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center text-sm font-black text-textPrimary border-t-2 border-borderColor pt-2'>
              <span>Total Estimado a Invertir:</span>
              <span className='text-xl font-black text-emerald-600 dark:text-emerald-400'>
                Q. {Number(registration.estimatedTotal).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones del Voucher */}
      <div className='flex flex-col sm:flex-row gap-3 items-center justify-between'>
        <Button
          variant='outlined'
          color='inherit'
          onClick={onEdit}
          sx={{ textTransform: 'none' }}
          startIcon={<i className='ri-edit-line' />}
        >
          Modificar Selección
        </Button>

        <div className='flex items-center space-x-3'>
          <Button
            variant='contained'
            onClick={handlePrint}
            sx={{
              backgroundColor: '#2e7d32',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#1b5e20' },
            }}
            startIcon={<i className='ri-printer-line' />}
          >
            Descargar / Imprimir Voucher
          </Button>
        </div>
      </div>
    </div>
  )
}
