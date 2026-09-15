'use client'

import React, { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import {
  DiscountCalculationResult,
  CustomerInfoSchema,
  ContactPreference,
} from '@ptdisagro/contracts'
import FeriaHeader from '@components/feria/FeriaHeader'
import FeriaFooter from '@components/feria/FeriaFooter'
import CustomerInfoCard, { CustomerFormData } from '@components/feria/CustomerInfoCard'
import CatalogSelectorCard, { CatalogItem } from '@components/feria/CatalogSelectorCard'
import ConfirmationModal from '@components/feria/ConfirmationModal'
import ConfirmationVoucher from '@components/feria/ConfirmationVoucher'
import { api, ApiClientError } from '@/services/api'

// Catálogo inicial de respaldo en caso de desconexión de red o mientras carga la API
const FALLBACK_CATALOG: CatalogItem[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'SERVICE',
    name: 'Consultoría Tecnológica Agrícola',
    description: 'Diagnóstico nutricional de suelos y recomendación de fertilización',
    price: 800,
    category: 'Consultoría',
    active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    type: 'SERVICE',
    name: 'Monitoreo Satelital de Cultivos',
    description: 'Imágenes multiespectrales NDVI para detección temprana de plagas',
    price: 900,
    category: 'Tecnología',
    active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    type: 'SERVICE',
    name: 'Análisis Foliar y de Suelos de Alta Precisión',
    description: 'Laboratorio químico certificado con entrega en 48 horas',
    price: 450,
    category: 'Laboratorio',
    active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    type: 'SERVICE',
    name: 'Calibración de Equipos de Aspersión',
    description: 'Optimización de dosis y cobertura para reducción de desperdicios',
    price: 350,
    category: 'Mantenimiento',
    active: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    type: 'PRODUCT',
    name: 'Fertilizante Especializado Fertiagro 50kg',
    description: 'Fórmula balanceada NPK 15-15-15 de absorción rápida',
    price: 200,
    category: 'Nutrición Vegetal',
    active: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    type: 'PRODUCT',
    name: 'Bioestimulante Radicular Agrovigor 1L',
    description: 'Extracto de algas marinas para desarrollo de raíces vigorosas',
    price: 150,
    category: 'Bioestimulantes',
    active: true,
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    type: 'PRODUCT',
    name: 'Fungicida Sistémico Curativo 1L',
    description: 'Protección prolongada contra roya y tizón tardío',
    price: 250,
    category: 'Protección de Cultivos',
    active: true,
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    type: 'PRODUCT',
    name: 'Insecticida Ecológico Biodegradable 1L',
    description: 'Control de mosca blanca y pulgones sin periodo de carencia',
    price: 180,
    category: 'Protección de Cultivos',
    active: true,
  },
]

export default function FeriaPage() {
  const [event, setEvent] = useState<any>(null)
  const [catalog, setCatalog] = useState<CatalogItem[]>(FALLBACK_CATALOG)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Estado del formulario de cliente
  const [formData, setFormData] = useState<CustomerFormData>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    attendanceDate: '',
    preferredContactMethod: ContactPreference.EMAIL,
    acceptedTerms: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Selección de ítems (ID -> cantidad)
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map())

  // Preview de descuentos
  const [previewBreakdown, setPreviewBreakdown] = useState<DiscountCalculationResult | null>(null)
  const [previewItemsList, setPreviewItemsList] = useState<any[]>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  // Modales y confirmación
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedRegistration, setConfirmedRegistration] = useState<any>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Cargar evento y catálogo al inicio
  useEffect(() => {
    async function loadInitialData() {
      try {
        const activeEvent = await api.getActiveEvent()
        setEvent(activeEvent)

        const items = await api.getEventCatalog(activeEvent.id)
        if (items && items.length > 0) {
          setCatalog(items)
        }
      } catch (err) {
        console.warn('Usando catálogo inicial:', err)
      } finally {
        setIsLoadingData(false)
      }
    }
    loadInitialData()
  }, [])

  // Recalcular preview de descuentos cuando cambian los ítems seleccionados
  useEffect(() => {
    async function updatePreview() {
      if (selectedItems.size === 0) {
        setPreviewBreakdown(null)
        setPreviewItemsList([])
        return
      }

      setIsLoadingPreview(true)
      const itemsPayload = Array.from(selectedItems.entries()).map(
        ([catalogItemId, quantity]) => ({
          catalogItemId,
          quantity,
        }),
      )

      try {
        const result = await api.previewRegistration(itemsPayload)
        setPreviewBreakdown(result.breakdown)
        setPreviewItemsList(result.items)
      } catch (error) {
        console.error('Error calculando preview:', error)
      } finally {
        setIsLoadingPreview(false)
      }
    }

    const timer = setTimeout(updatePreview, 250)
    return () => clearTimeout(timer)
  }, [selectedItems])

  // Manejo de cambios en el formulario de cliente
  const handleCustomerChange = (field: keyof CustomerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Alternar selección de ítem
  const handleToggleItem = (item: CatalogItem) => {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.set(item.id, 1)
      }
      return next
    })
  }

  // Actualizar cantidad de producto
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev)
      const current = next.get(itemId) || 1
      const updated = current + delta
      if (updated > 0) {
        next.set(itemId, updated)
      }
      return next
    })
  }

  // Validar y abrir Modal de Confirmación
  const handleOpenConfirmation = () => {
    setSubmitError(null)

    // Validar datos de cliente con Zod
    const validation = CustomerInfoSchema.safeParse(formData)
    if (!validation.success) {
      const errors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as string
        errors[path] = issue.message
      }
      setFormErrors(errors)
      window.scrollTo({ top: 120, behavior: 'smooth' })
      return
    }

    // Validar selección de ítems
    if (selectedItems.size === 0) {
      setSubmitError('Debe seleccionar al menos un servicio o producto para registrarse.')
      return
    }

    setIsModalOpen(true)
  }

  // Confirmar definitivamente con la API
  const handleConfirmRegistration = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const itemsPayload = Array.from(selectedItems.entries()).map(
      ([catalogItemId, quantity]) => ({
        catalogItemId,
        quantity,
      }),
    )

    try {
      const result = await api.createRegistration({
        eventId: event?.id || 'event-uuid-active',
        customer: formData,
        items: itemsPayload,
      })

      setConfirmedRegistration(result)
      setIsModalOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error: any) {
      setIsModalOpen(false)
      const msg = error.message || 'Error al procesar la confirmación'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-backgroundDefault text-textPrimary flex flex-col transition-colors duration-200'>
      <FeriaHeader />

      {/* Si ya confirmó, mostrar el Voucher */}
      {confirmedRegistration ? (
        <main className='flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'>
          <ConfirmationVoucher
            registration={confirmedRegistration}
            onEdit={() => {
              setConfirmedRegistration(null)
            }}
          />
        </main>
      ) : (
        <main className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6'>
          {/* Banner de Bienvenida */}
          <div className='bg-gradient-to-r from-[#24292e] to-[#2e7d32] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
            <div className='space-y-2'>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'>
                {event?.name || 'Feria de Promociones Disagro 2026'}
              </span>
              <h1 className='text-2xl sm:text-3xl font-black tracking-tight text-white'>
                Cotice su Portafolio con Descuentos Especiales
              </h1>
              <p className='text-xs sm:text-sm text-gray-300 max-w-2xl'>
                Seleccione 2 o más servicios para obtener hasta un 5% de descuento,
                y combine con 3 o más productos para maximizar su ahorro total en feria.
              </p>
            </div>

            <div className='bg-black/25 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-xs space-y-1 shrink-0'>
              <div className='text-emerald-300 font-bold'>
                📍 {event?.location || 'Parque de la Industria, Guatemala'}
              </div>
              <div className='text-gray-200'>
                🗓️ Fecha:{' '}
                {event?.startDate
                  ? new Date(event.startDate).toLocaleDateString('es-GT')
                  : '15 al 17 de Octubre, 2026'}
              </div>
              <div className='text-gray-300'>
                ⏰ Cierre de Registro:{' '}
                {event?.registrationDeadline
                  ? new Date(event.registrationDeadline).toLocaleDateString('es-GT')
                  : '14 Octubre, 2026'}
              </div>
            </div>
          </div>

          {submitError && (
            <Alert severity='error' onClose={() => setSubmitError(null)} className='rounded-xl shadow-xs'>
              {submitError}
            </Alert>
          )}

          {/* Formulario en 2 Tarjetas (Alineado con Guía Visual) */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* Tarjeta 1: Información del Participante */}
            <div className='lg:col-span-5'>
              <CustomerInfoCard
                formData={formData}
                onChange={handleCustomerChange}
                errors={formErrors}
              />
            </div>

            {/* Tarjeta 2: Catálogo y Descuentos */}
            <div className='lg:col-span-7'>
              <CatalogSelectorCard
                items={catalog}
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onUpdateQuantity={handleUpdateQuantity}
                discountBreakdown={previewBreakdown}
                isLoadingPreview={isLoadingPreview}
              />
            </div>
          </div>

          {/* Botón Principal de Confirmación */}
          <div className='flex justify-center pt-4'>
            <Button
              variant='contained'
              onClick={handleOpenConfirmation}
              sx={{
                backgroundColor: '#1b5e20',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1rem',
                padding: '14px 48px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 8px 20px rgba(27, 94, 32, 0.35)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  backgroundColor: '#0d3811',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px rgba(27, 94, 32, 0.45)',
                },
              }}
              endIcon={<i className='ri-arrow-right-line text-lg' />}
            >
              CONFIRMAR ASISTENCIA
            </Button>
          </div>
        </main>
      )}

      {/* Modal de Resumen y Confirmación */}
      <ConfirmationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRegistration}
        isSubmitting={isSubmitting}
        customer={formData}
        itemsList={previewItemsList}
        breakdown={previewBreakdown}
      />

      <FeriaFooter />
    </div>
  )
}
