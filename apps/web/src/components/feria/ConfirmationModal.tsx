'use client'

import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import { DiscountCalculationResult } from '@ptdisagro/contracts'
import { CustomerFormData } from './CustomerInfoCard'

interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  customer: CustomerFormData
  itemsList: Array<{
    id: string
    name: string
    type: string
    price: number
    quantity: number
    lineTotal: number
  }>
  breakdown: DiscountCalculationResult | null
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  customer,
  itemsList,
  breakdown,
}: ConfirmationModalProps) {
  if (!breakdown) return null

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        className: 'rounded-2xl shadow-2xl overflow-hidden',
      }}
    >
      {/* Cabecera del Modal */}
      <DialogTitle className='bg-[#24292e] text-white p-5 flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <i className='ri-file-list-3-line text-emerald-400 text-xl' />
          <span className='font-bold text-lg'>Resumen de su Registro Promocional</span>
        </div>
        <span className='text-xs font-semibold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700'>
          Paso Final
        </span>
      </DialogTitle>

      <DialogContent className='p-6 space-y-5'>
        {/* Datos del Participante */}
        <div className='bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs space-y-1.5'>
          <h4 className='font-bold text-gray-800 text-sm mb-2 flex items-center gap-1.5'>
            <i className='ri-user-follow-line text-[#2e7d32]' /> Datos del Participante
          </h4>
          <div className='grid grid-cols-2 gap-2 text-gray-600'>
            <div>
              <span className='text-gray-400'>Nombre:</span>{' '}
              <strong className='text-gray-800'>{customer.fullName}</strong>
            </div>
            <div>
              <span className='text-gray-400'>Email:</span>{' '}
              <strong className='text-gray-800'>{customer.email}</strong>
            </div>
            <div>
              <span className='text-gray-400'>Teléfono:</span>{' '}
              <strong className='text-gray-800'>{customer.phone}</strong>
            </div>
            <div>
              <span className='text-gray-400'>Asistencia:</span>{' '}
              <strong className='text-gray-800'>{customer.attendanceDate}</strong>
            </div>
          </div>
        </div>

        {/* Lista de Ítems Seleccionados */}
        <div>
          <h4 className='font-bold text-gray-800 text-xs uppercase tracking-wider mb-2'>
            Ítems Seleccionados ({itemsList.length})
          </h4>
          <div className='max-h-44 overflow-y-auto space-y-1.5 pr-1 text-xs'>
            {itemsList.map((item) => (
              <div
                key={item.id}
                className='flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100'
              >
                <div className='flex items-center space-x-2'>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.type === 'SERVICE' ? 'bg-[#2e7d32]' : 'bg-blue-600'
                    }`}
                  />
                  <span className='font-semibold text-gray-800'>
                    {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                  </span>
                </div>
                <span className='font-bold text-gray-700'>
                  Q. {item.lineTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* Desglose Financiero Oficial */}
        <div className='space-y-2 text-xs'>
          <div className='flex justify-between text-gray-600'>
            <span>Subtotal Servicios ({breakdown.servicesCount} items):</span>
            <span>
              Q.{' '}
              {breakdown.serviceSubtotal.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className='flex justify-between text-gray-600'>
            <span>Subtotal Productos ({breakdown.productsCount} items):</span>
            <span>
              Q.{' '}
              {breakdown.productSubtotal.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className='flex justify-between text-[#2e7d32] font-semibold bg-emerald-50 px-2.5 py-1 rounded-md'>
            <span>
              Descuento Servicios ({breakdown.serviceDiscountPercentage}%):
            </span>
            <span>
              - Q.{' '}
              {breakdown.serviceDiscountAmount.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className='flex justify-between text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded-md'>
            <span>
              Descuento Productos ({breakdown.productDiscountPercentage}%):
            </span>
            <span>
              - Q.{' '}
              {breakdown.productDiscountAmount.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className='flex justify-between text-emerald-700 font-bold pt-1 border-t border-gray-100'>
            <span>Ahorro Total Obtenido:</span>
            <span>
              Q.{' '}
              {breakdown.totalSavingsAmount.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className='flex justify-between items-center text-sm font-black text-gray-900 pt-2 border-t-2 border-gray-300'>
            <span>Total Estimado a Invertir:</span>
            <span className='text-lg text-emerald-800 font-black'>
              Q.{' '}
              {breakdown.estimatedTotal.toLocaleString('es-GT', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </DialogContent>

      <DialogActions className='bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between'>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          color='inherit'
          sx={{ textTransform: 'none' }}
        >
          Regresar a modificar
        </Button>

        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          variant='contained'
          sx={{
            backgroundColor: '#2e7d32',
            textTransform: 'none',
            fontWeight: 700,
            padding: '8px 24px',
            '&:hover': {
              backgroundColor: '#1b5e20',
            },
          }}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color='inherit' />
            ) : (
              <i className='ri-checkbox-circle-line' />
            )
          }
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar Asistencia Definitiva'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
