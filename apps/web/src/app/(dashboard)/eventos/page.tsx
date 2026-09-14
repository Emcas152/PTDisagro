'use client'

import React, { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { api } from '@/services/api'

export default function EventosPage() {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvent() {
      try {
        const active = await api.getActiveEvent()
        setEvent(active)
      } catch (err) {
        console.error('Error cargando evento:', err)
      } finally {
        setLoading(false)
      }
    }
    loadEvent()
  }, [])

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>
          Configuración del Evento Activo
        </h1>
        <p className='text-sm text-gray-500'>
          Parámetros oficiales, fechas límites y estado del evento anual.
        </p>
      </div>

      {loading ? (
        <div className='text-center py-20'>
          <CircularProgress color='success' />
        </div>
      ) : event ? (
        <Card className='shadow-sm rounded-xl border border-gray-200 overflow-hidden'>
          <div className='bg-[#24292e] text-white p-6 flex justify-between items-center'>
            <div>
              <span className='text-xs uppercase text-emerald-400 font-bold block mb-1'>
                Evento Anual de Promociones
              </span>
              <h2 className='text-xl font-black text-white'>{event.name}</h2>
            </div>
            <Chip
              label={event.status}
              color='success'
              size='small'
              sx={{ fontWeight: 'bold' }}
            />
          </div>

          <CardContent className='p-6 space-y-4 text-sm'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-3 bg-gray-50 rounded-lg border border-gray-100'>
                <span className='text-xs text-gray-400 block'>Ubicación Oficial:</span>
                <strong className='text-gray-800'>{event.location}</strong>
              </div>

              <div className='p-3 bg-gray-50 rounded-lg border border-gray-100'>
                <span className='text-xs text-gray-400 block'>
                  Período del Evento:
                </span>
                <strong className='text-gray-800'>
                  {new Date(event.startDate).toLocaleDateString('es-GT')} al{' '}
                  {new Date(event.endDate).toLocaleDateString('es-GT')}
                </strong>
              </div>

              <div className='p-3 bg-gray-50 rounded-lg border border-gray-100'>
                <span className='text-xs text-gray-400 block'>
                  Fecha Límite para Confirmación:
                </span>
                <strong className='text-rose-700'>
                  {new Date(event.registrationDeadline).toLocaleDateString('es-GT')}
                </strong>
              </div>

              <div className='p-3 bg-gray-50 rounded-lg border border-gray-100'>
                <span className='text-xs text-gray-400 block'>ID del Sistema:</span>
                <span className='text-xs font-mono text-gray-600'>{event.id}</span>
              </div>
            </div>

            <div>
              <span className='text-xs text-gray-400 block mb-1'>
                Descripción del Evento:
              </span>
              <p className='text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100'>
                {event.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className='p-8 text-center text-gray-500'>
          No se encontró ningún evento activo configurado.
        </Card>
      )}
    </div>
  )
}
