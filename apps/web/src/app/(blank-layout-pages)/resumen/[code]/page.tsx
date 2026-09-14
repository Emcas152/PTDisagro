'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import FeriaHeader from '@components/feria/FeriaHeader'
import FeriaFooter from '@components/feria/FeriaFooter'
import ConfirmationVoucher from '@components/feria/ConfirmationVoucher'
import { api } from '@/services/api'

export default function ResumenPage() {
  const params = useParams()
  const router = useRouter()
  const code = params?.code as string

  const [registration, setRegistration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    async function loadRegistration() {
      try {
        const data = await api.getRegistration(code)
        setRegistration(data)
      } catch (err: any) {
        setError(err.message || 'No se encontró la confirmación especificada')
      } finally {
        setLoading(false)
      }
    }

    loadRegistration()
  }, [code])

  return (
    <div className='min-h-screen bg-[#f4f5f7] flex flex-col'>
      <FeriaHeader />

      <main className='flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full'>
        {loading && (
          <div className='text-center py-20'>
            <CircularProgress color='success' />
            <p className='text-sm text-gray-500 mt-3'>Cargando comprobante...</p>
          </div>
        )}

        {error && (
          <div className='space-y-4 text-center py-12'>
            <Alert severity='error' className='max-w-md mx-auto'>
              {error}
            </Alert>
            <Button
              variant='contained'
              onClick={() => router.push('/feria')}
              sx={{ backgroundColor: '#2e7d32', textTransform: 'none' }}
            >
              Ir a la Feria
            </Button>
          </div>
        )}

        {registration && (
          <ConfirmationVoucher
            registration={registration}
            onEdit={() => router.push(`/feria`)}
          />
        )}
      </main>

      <FeriaFooter />
    </div>
  )
}
