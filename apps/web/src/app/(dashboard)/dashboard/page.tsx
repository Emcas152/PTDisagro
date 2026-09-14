'use client'

import React, { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Link from 'next/link'
import { api } from '@/services/api'

export default function DashboardAnalytics() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await api.getAdminDashboard()
        setMetrics(data)
      } catch (err) {
        console.error('Error cargando métricas:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMetrics()
  }, [])

  return (
    <div className='space-y-6'>
      {/* Banner Superior de Bienvenida */}
      <div className='bg-gradient-to-r from-[#24292e] to-[#2e7d32] text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <div>
          <span className='text-xs font-semibold uppercase tracking-wider text-emerald-300 block mb-1'>
            Control Central
          </span>
          <h1 className='text-2xl sm:text-3xl font-black text-white'>
            Dashboard Ejecutivo - Feria Disagro 2026
          </h1>
          <p className='text-xs sm:text-sm text-gray-200 mt-1 max-w-xl'>
            Monitoreo en tiempo real del registro de clientes, cotizaciones con descuentos
            promocionales aplicados y estadísticas del portafolio.
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Link href='/feria' target='_blank' passHref>
            <Button
              variant='contained'
              sx={{
                backgroundColor: '#ffffff',
                color: '#2e7d32',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#e8f5e9' },
              }}
              startIcon={<i className='ri-external-link-line' />}
            >
              Abrir Formulario Clientes
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className='text-center py-20'>
          <CircularProgress color='success' />
          <p className='text-sm text-textSecondary mt-2'>Cargando estadísticas...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de Métricas Principales (KPIs) */}
          <Grid container spacing={4}>
            {/* KPI 1: Registros Totales */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className='shadow-sm rounded-xl border border-borderColor bg-backgroundPaper'>
                <CardContent className='p-5 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold text-textSecondary uppercase tracking-wider'>
                      Total Registros
                    </span>
                    <div className='w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold'>
                      <i className='ri-user-follow-line text-lg' />
                    </div>
                  </div>
                  <div className='text-2xl font-black text-textPrimary'>
                    {metrics?.totalRegistrations || 0}
                  </div>
                  <span className='text-xs text-emerald-500 font-semibold'>
                    {metrics?.confirmedCount || 0} Confirmados
                  </span>
                </CardContent>
              </Card>
            </Grid>

            {/* KPI 2: Ingresos Estimados */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className='shadow-sm rounded-xl border border-borderColor bg-backgroundPaper'>
                <CardContent className='p-5 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold text-textSecondary uppercase tracking-wider'>
                      Ingreso Proyectado
                    </span>
                    <div className='w-9 h-9 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold'>
                      <i className='ri-money-dollar-circle-line text-lg' />
                    </div>
                  </div>
                  <div className='text-2xl font-black text-textPrimary'>
                    Q.{' '}
                    {(metrics?.totalEstimatedRevenue || 0).toLocaleString('es-GT', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <span className='text-xs text-textSecondary'>
                    Total neto tras descuentos
                  </span>
                </CardContent>
              </Card>
            </Grid>

            {/* KPI 3: Ahorro Total Otorgado */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className='shadow-sm rounded-xl border border-borderColor bg-backgroundPaper'>
                <CardContent className='p-5 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold text-textSecondary uppercase tracking-wider'>
                      Descuentos Otorgados
                    </span>
                    <div className='w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold'>
                      <i className='ri-percent-line text-lg' />
                    </div>
                  </div>
                  <div className='text-2xl font-black text-emerald-500'>
                    Q.{' '}
                    {(metrics?.totalSavingsGranted || 0).toLocaleString('es-GT', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <span className='text-xs text-emerald-500 font-semibold'>
                    Ahorro acumulado clientes
                  </span>
                </CardContent>
              </Card>
            </Grid>

            {/* KPI 4: Servicios vs Productos Solicitados */}
            <Grid item xs={12} sm={6} md={3}>
              <Card className='shadow-sm rounded-xl border border-borderColor bg-backgroundPaper'>
                <CardContent className='p-5 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold text-textSecondary uppercase tracking-wider'>
                      Ítems Solicitados
                    </span>
                    <div className='w-9 h-9 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold'>
                      <i className='ri-shopping-cart-line text-lg' />
                    </div>
                  </div>
                  <div className='text-2xl font-black text-textPrimary'>
                    {(metrics?.totalServicesSelected || 0) +
                      (metrics?.totalProductsSelected || 0)}
                  </div>
                  <span className='text-xs text-textSecondary'>
                    {metrics?.totalServicesSelected || 0} Serv |{' '}
                    {metrics?.totalProductsSelected || 0} Prod
                  </span>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabla de Registros Recientes */}
          <Card className='shadow-sm rounded-xl border border-borderColor bg-backgroundPaper'>
            <div className='p-5 border-b border-borderColor flex justify-between items-center'>
              <h3 className='font-bold text-textPrimary text-base'>
                Últimas Confirmaciones de Participantes
              </h3>
              <Link href='/registros' className='text-xs font-semibold text-emerald-500 hover:underline'>
                Ver todos los registros →
              </Link>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-xs text-left'>
                <thead className='bg-actionHover text-textSecondary font-semibold border-b border-borderColor'>
                  <tr>
                    <th className='p-3.5'>Código</th>
                    <th className='p-3.5'>Participante</th>
                    <th className='p-3.5'>Empresa</th>
                    <th className='p-3.5'>Fecha y Hora Asistencia</th>
                    <th className='p-3.5 text-right'>Descuento</th>
                    <th className='p-3.5 text-right'>Total</th>
                    <th className='p-3.5 text-center'>Estado</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-borderColor'>
                  {metrics?.recentRegistrations?.map((r: any) => (
                    <tr key={r.id} className='hover:bg-actionHover transition-colors'>
                      <td className='p-3.5 font-mono font-bold text-textPrimary'>
                        {r.confirmationCode}
                      </td>
                      <td className='p-3.5 font-semibold text-textPrimary'>
                        {r.customer?.fullName}
                      </td>
                      <td className='p-3.5 text-textSecondary'>
                        {r.customer?.company || '-'}
                      </td>
                      <td className='p-3.5 text-textSecondary'>
                        {r.customer?.attendanceDate || '-'}
                      </td>
                      <td className='p-3.5 text-right font-semibold text-emerald-500'>
                        Q. {Number(r.totalDiscountAmount).toFixed(2)}
                      </td>
                      <td className='p-3.5 text-right font-bold text-textPrimary'>
                        Q. {Number(r.estimatedTotal).toFixed(2)}
                      </td>
                      <td className='p-3.5 text-center'>
                        <Chip
                          label={r.status}
                          size='small'
                          color='success'
                          sx={{ fontSize: '10px', height: 20 }}
                        />
                      </td>
                    </tr>
                  ))}

                  {(!metrics?.recentRegistrations ||
                    metrics.recentRegistrations.length === 0) && (
                    <tr>
                      <td colSpan={7} className='text-center py-10 text-textDisabled'>
                        Aún no hay participantes registrados en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
