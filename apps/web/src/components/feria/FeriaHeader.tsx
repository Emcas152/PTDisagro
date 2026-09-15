'use client'

import Link from 'next/link'
import Button from '@mui/material/Button'
import ModeDropdown from '@components/layout/shared/ModeDropdown'

export default function FeriaHeader() {
  return (
    <header className='bg-[#24292e] text-white shadow-md border-b border-gray-700 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
        {/* Logo y Nombre del Evento */}
        <div className='flex items-center space-x-3'>
          <div className='w-9 h-9 rounded-lg bg-[#2e7d32] flex items-center justify-center font-bold text-white text-lg tracking-wider shadow'>
            D
          </div>
          <div>
            <span className='text-lg font-bold tracking-tight text-white'>
              DISAGRO
            </span>
            <span className='hidden sm:inline-block ml-2 text-xs uppercase px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-medium border border-emerald-700'>
              Feria de Promociones 2026
            </span>
          </div>
        </div>

        {/* Contacto, Selector de Tema y Botón Administrativo */}
        <div className='flex items-center space-x-3 sm:space-x-4'>
          <div className='hidden md:flex items-center text-xs text-gray-300 space-x-1'>
            <i className='ri-phone-line text-emerald-400 text-sm' />
            <span>Atención:</span>
            <strong className='text-white ml-1 font-semibold'>2223-2425</strong>
          </div>

          <div className='text-white flex items-center'>
            <ModeDropdown />
          </div>

          <Link href='/' passHref>
            <Button
              variant='outlined'
              size='small'
              sx={{
                color: '#e0e0e0',
                borderColor: '#4b5563',
                textTransform: 'none',
                fontSize: '0.8125rem',
                '&:hover': {
                  borderColor: '#2e7d32',
                  backgroundColor: 'rgba(46, 125, 50, 0.15)',
                },
              }}
            >
              Panel Administrativo
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
