'use client'

import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'

interface NotificationSetting {
  id: string
  title: string
  description: string
  email: boolean
  browser: boolean
  app: boolean
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'new_registration',
    title: 'Nuevos Registros de Clientes',
    description: 'Alertas en tiempo real cuando un participante confirme su asistencia y cotización en la Feria.',
    email: true,
    browser: true,
    app: true,
  },
  {
    id: 'modified_registration',
    title: 'Modificaciones de Cotización',
    description: 'Notificar cuando un cliente edite los servicios o productos tecnológicos de su orden.',
    email: true,
    browser: false,
    app: true,
  },
  {
    id: 'urgent_contact',
    title: 'Solicitudes de Contacto Prioritario',
    description: 'Clientes que solicitan atención inmediata vía PBX o WhatsApp corporativo.',
    email: true,
    browser: true,
    app: true,
  },
  {
    id: 'daily_summary',
    title: 'Cierre Ejecutivo Diario',
    description: 'Informe consolidado de montos facturados, descuentos otorgados y asistencia esperada.',
    email: true,
    browser: false,
    app: true,
  },
]

const Notifications = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings)
  const [frequency, setFrequency] = useState('immediate')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [testSuccess, setTestSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('disagro_notifications_config')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.settings) setSettings(parsed.settings)
          if (parsed.frequency) setFrequency(parsed.frequency)
          if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled)
        }
      } catch {}
    }
  }, [])

  const handleToggle = (id: string, channel: 'email' | 'browser' | 'app') => {
    setSettings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [channel]: !item[channel] } : item,
      ),
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setTestSuccess(null)
    const config = { settings, frequency, soundEnabled }
    localStorage.setItem('disagro_notifications_config', JSON.stringify(config))
    setSuccessMsg('¡Preferencias de notificaciones guardadas exitosamente en el sistema!')
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const handleTestNotification = async () => {
    setTestSuccess(null)

    // Si el navegador soporta Notification API
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Feria Disagro 2026', {
          body: 'Notificación de prueba: Sistema de monitoreo administrativo en línea.',
          icon: '/images/favicon.png',
        })
        setTestSuccess('Se ha enviado una notificación de prueba a su navegador.')
        return
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification('Feria Disagro 2026', {
            body: 'Notificación de prueba: Notificaciones activadas exitosamente.',
          })
          setTestSuccess('Permisos concedidos y notificación enviada a su navegador.')
          return
        }
      }
    }

    setTestSuccess('Notificación simulada: Alerta recibida para el operador en sesión.')
  }

  return (
    <Card className='border border-borderColor bg-backgroundPaper shadow-sm'>
      <CardHeader
        title={
          <div className='flex justify-between items-center flex-wrap gap-2'>
            <span className='font-bold text-lg text-textPrimary'>
              Centro de Notificaciones y Alertas del Evento
            </span>
            <Chip
              label='Monitoreo Activo'
              size='small'
              color='success'
              sx={{ fontWeight: 'bold', fontSize: '10px' }}
            />
          </div>
        }
        subheader='Configure los canales y eventos por los cuales el personal administrativo recibirá avisos operativos.'
      />

      <CardContent className='space-y-6'>
        {successMsg && (
          <Alert severity='success' className='text-xs rounded-xl'>
            {successMsg}
          </Alert>
        )}

        {testSuccess && (
          <Alert severity='info' className='text-xs rounded-xl'>
            {testSuccess}
          </Alert>
        )}

        <form onSubmit={handleSave} className='space-y-6'>
          {/* Tabla de Configuración de Canales */}
          <div className='overflow-x-auto border border-borderColor rounded-xl'>
            <table className='w-full text-xs text-left'>
              <thead className='bg-actionHover text-textSecondary font-semibold border-b border-borderColor'>
                <tr>
                  <th className='p-3.5'>Tipo de Notificación</th>
                  <th className='p-3.5 text-center'>Correo Electrónico</th>
                  <th className='p-3.5 text-center'>Navegador (Push)</th>
                  <th className='p-3.5 text-center'>Panel Sistema</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-borderColor'>
                {settings.map((item) => (
                  <tr key={item.id} className='hover:bg-actionHover transition-colors'>
                    <td className='p-3.5'>
                      <Typography className='font-semibold text-xs text-textPrimary'>
                        {item.title}
                      </Typography>
                      <Typography className='text-[11px] text-textSecondary'>
                        {item.description}
                      </Typography>
                    </td>
                    <td className='p-3.5 text-center'>
                      <Checkbox
                        checked={item.email}
                        onChange={() => handleToggle(item.id, 'email')}
                        color='success'
                        size='small'
                      />
                    </td>
                    <td className='p-3.5 text-center'>
                      <Checkbox
                        checked={item.browser}
                        onChange={() => handleToggle(item.id, 'browser')}
                        color='success'
                        size='small'
                      />
                    </td>
                    <td className='p-3.5 text-center'>
                      <Checkbox
                        checked={item.app}
                        onChange={() => handleToggle(item.id, 'app')}
                        color='success'
                        size='small'
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Opciones Adicionales */}
          <Grid container spacing={4} alignItems='center'>
            <Grid item xs={12} sm={6} md={4}>
              <Typography className='text-xs font-semibold text-textPrimary mb-1.5'>
                Frecuencia de Envío:
              </Typography>
              <Select
                fullWidth
                size='small'
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <MenuItem value='immediate'>Inmediatamente al ocurrir el evento</MenuItem>
                <MenuItem value='hourly'>Resumen acumulado cada 2 horas</MenuItem>
                <MenuItem value='daily'>Solo reporte diario al cierre</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography className='text-xs font-semibold text-textPrimary mb-1.5'>
                Sonidos de Alerta:
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    color='success'
                  />
                }
                label={
                  <span className='text-xs text-textPrimary'>
                    {soundEnabled ? 'Sonido activado' : 'Silenciar alertas'}
                  </span>
                }
              />
            </Grid>
          </Grid>

          {/* Botones de Acción */}
          <div className='flex items-center gap-3 pt-4 border-t border-borderColor flex-wrap'>
            <Button
              variant='contained'
              type='submit'
              sx={{
                backgroundColor: '#2e7d32',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#1b5e20' },
              }}
            >
              Guardar Preferencias
            </Button>

            <Button
              variant='outlined'
              type='button'
              onClick={handleTestNotification}
              startIcon={<i className='ri-notification-badge-line' />}
              sx={{ textTransform: 'none' }}
            >
              Probar Notificación Ahora
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default Notifications
