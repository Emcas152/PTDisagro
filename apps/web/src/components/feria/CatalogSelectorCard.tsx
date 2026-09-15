'use client'

import React, { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { DiscountCalculationResult } from '@ptdisagro/contracts'

export interface CatalogItem {
  id: string
  type: 'SERVICE' | 'PRODUCT'
  name: string
  description?: string
  price: number | string
  category?: string
  active: boolean
}

export interface SelectedItemState {
  catalogItemId: string
  quantity: number
}

interface CatalogSelectorCardProps {
  items: CatalogItem[]
  selectedItems: Map<string, number> // itemId -> quantity
  onToggleItem: (item: CatalogItem) => void
  onUpdateQuantity: (itemId: string, delta: number) => void
  discountBreakdown?: DiscountCalculationResult | null
  isLoadingPreview?: boolean
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--mui-palette-divider, rgba(0, 0, 0, 0.25))',
      borderWidth: '1.5px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#2e7d32',
      borderWidth: '1.5px',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#2e7d32 !important',
      borderWidth: '2px',
      boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.15)',
    },
  },
  '& .MuiInputBase-input': {
    color: 'var(--mui-palette-text-primary)',
    fontWeight: 500,
    '&::placeholder': {
      color: 'var(--mui-palette-text-secondary)',
      opacity: 0.65,
    },
  },
}

export default function CatalogSelectorCard({
  items,
  selectedItems,
  onToggleItem,
  onUpdateQuantity,
  discountBreakdown,
}: CatalogSelectorCardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'SERVICE' | 'PRODUCT'>('ALL')

  // Filtrar ítems por término de búsqueda y pestaña seleccionada
  const filteredItems = items.filter((item) => {
    if (!item.active) return false
    if (filterType !== 'ALL' && item.type !== filterType) return false
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))
    )
  })

  const servicesCount = discountBreakdown?.servicesCount || 0
  const productsCount = discountBreakdown?.productsCount || 0
  const serviceDiscount = discountBreakdown?.serviceDiscountPercentage || 0
  const productDiscount = discountBreakdown?.productDiscountPercentage || 0
  const totalSavings = discountBreakdown?.totalSavingsAmount || 0

  return (
    <Card className='shadow-md border border-borderColor rounded-2xl overflow-hidden bg-backgroundPaper'>
      {/* Cabecera con Badge 2 */}
      <div className='px-6 py-4 border-b border-borderColor flex items-center justify-between flex-wrap gap-2 bg-actionHover'>
        <div className='flex items-center space-x-3'>
          <div className='w-8 h-8 rounded-full bg-[#2e7d32] text-white flex items-center justify-center font-bold text-sm shadow-sm'>
            2
          </div>
          <div>
            <h2 className='text-lg font-bold text-textPrimary leading-tight'>
              Seleccione Servicios y Productos de su interés
            </h2>
            <p className='text-xs text-textSecondary'>
              Los descuentos se calculan de manera automática e independiente en el servidor
            </p>
          </div>
        </div>

        {/* Contador de seleccionados */}
        <div className='flex items-center space-x-2'>
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'>
            {selectedItems.size} seleccionados
          </span>
        </div>
      </div>

      <CardContent className='p-6 space-y-4'>
        {/* Barra de Filtros y Búsqueda */}
        <div className='flex flex-col sm:flex-row gap-3 items-center justify-between'>
          {/* Tabs de tipo */}
          <div className='flex items-center space-x-1 w-full sm:w-auto bg-actionHover p-1 rounded-xl border border-borderColor'>
            <button
              type='button'
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-backgroundPaper text-textPrimary shadow-sm font-semibold'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              type='button'
              onClick={() => setFilterType('SERVICE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterType === 'SERVICE'
                  ? 'bg-backgroundPaper text-emerald-500 shadow-sm font-semibold'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Servicios ({items.filter((i) => i.type === 'SERVICE').length})
            </button>
            <button
              type='button'
              onClick={() => setFilterType('PRODUCT')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterType === 'PRODUCT'
                  ? 'bg-backgroundPaper text-blue-500 shadow-sm font-semibold'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Productos ({items.filter((i) => i.type === 'PRODUCT').length})
            </button>
          </div>

          {/* Buscador */}
          <div className='w-full sm:w-72'>
            <TextField
              fullWidth
              size='small'
              placeholder='Buscar servicio o producto...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line text-textDisabled' />
                  </InputAdornment>
                ),
              }}
            />
          </div>
        </div>

        {/* Lista de Catálogo */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1'>
          {filteredItems.map((item) => {
            const isSelected = selectedItems.has(item.id)
            const quantity = selectedItems.get(item.id) || 1
            const priceNum = typeof item.price === 'string' ? parseFloat(item.price) : item.price

            return (
              <div
                key={item.id}
                onClick={() => onToggleItem(item)}
                className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#2e7d32] bg-emerald-500/10 shadow-sm'
                    : 'border-borderColor hover:border-emerald-500/40 bg-backgroundPaper hover:bg-actionHover'
                }`}
              >
                <div className='flex items-start space-x-3'>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onToggleItem(item)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      padding: 0,
                      marginTop: '2px',
                      color: '#2e7d32',
                      '&.Mui-checked': {
                        color: '#2e7d32',
                      },
                    }}
                  />
                  <div>
                    <div className='flex items-center space-x-2'>
                      <span className='text-sm font-semibold text-textPrimary leading-snug'>
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          item.type === 'SERVICE'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-blue-500/15 text-blue-500'
                        }`}
                      >
                        {item.type === 'SERVICE' ? 'Servicio' : 'Producto'}
                      </span>
                    </div>

                    {item.description && (
                      <p className='text-xs text-textSecondary line-clamp-1 mt-0.5'>
                        {item.description}
                      </p>
                    )}

                    <div className='mt-1 text-xs font-bold text-textPrimary'>
                      Q. {priceNum.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Controles de cantidad solo para productos seleccionados */}
                {isSelected && item.type === 'PRODUCT' && (
                  <div
                    className='flex items-center space-x-1 bg-backgroundPaper border border-borderColor rounded-lg p-0.5 shadow-xs'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton
                      size='small'
                      disabled={quantity <= 1}
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className='text-textSecondary hover:bg-actionHover'
                      sx={{ width: 22, height: 22 }}
                    >
                      <i className='ri-subtract-line text-xs' />
                    </IconButton>
                    <span className='px-1.5 text-xs font-bold text-textPrimary min-w-[20px] text-center'>
                      {quantity}
                    </span>
                    <IconButton
                      size='small'
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className='text-textSecondary hover:bg-actionHover'
                      sx={{ width: 22, height: 22 }}
                    >
                      <i className='ri-add-line text-xs' />
                    </IconButton>
                  </div>
                )}
              </div>
            )
          })}

          {filteredItems.length === 0 && (
            <div className='col-span-2 text-center py-10 text-textSecondary'>
              <i className='ri-inbox-line text-4xl text-textDisabled block mb-2' />
              No se encontraron servicios o productos con ese criterio.
            </div>
          )}
        </div>

        {/* Panel oscuro de Descuentos Obtenidos en Tiempo Real */}
        <div className='bg-[#1e2327] text-white rounded-2xl p-4 shadow-sm border border-borderColor flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='space-y-1 w-full sm:w-auto text-center sm:text-left'>
            <div className='flex items-center justify-center sm:justify-start space-x-2'>
              <span className='text-xs text-gray-300 font-medium'>
                Descuento obtenido en Servicios ({servicesCount}):
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  serviceDiscount > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {serviceDiscount}%
              </span>
            </div>

            <div className='flex items-center justify-center sm:justify-start space-x-2'>
              <span className='text-xs text-gray-300 font-medium'>
                Descuento obtenido en Productos ({productsCount}):
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  productDiscount > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {productDiscount}%
              </span>
            </div>
          </div>

          <div className='flex items-center space-x-4 border-t sm:border-t-0 sm:border-l border-gray-700 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-around sm:justify-end'>
            <div className='text-right'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 block'>
                Ahorro Total Estimado
              </span>
              <span className='text-lg font-extrabold text-emerald-400'>
                Q. {totalSavings.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className='text-right'>
              <span className='text-[10px] uppercase tracking-wider text-gray-400 block'>
                Total Estimado
              </span>
              <span className='text-xl font-black text-white'>
                Q.{' '}
                {(discountBreakdown?.estimatedTotal || 0).toLocaleString('es-GT', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
