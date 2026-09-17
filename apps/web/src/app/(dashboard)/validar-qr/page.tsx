'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import { api } from '@/services/api'
import type { Html5Qrcode } from 'html5-qrcode'

/**
 * Función utilitaria para reproducir un 'beep' positivo de éxito al escanear
 */
function playSuccessBeep() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // Nota A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.18)
  } catch {
    // Si el navegador bloquea audio sin interacción previa
  }
}

/**
 * Extrae el código de confirmación a partir de un texto escaneado
 * (Soporta URLs completas https://.../resumen/DIS-XXXX o texto directo)
 */
function extractConfirmationCode(text: string): string {
  const clean = text.trim()

  // Buscar patrón DIS-XXXXXXXX
  const match = clean.match(/DIS-[A-Z0-9-]+/i)
  if (match) {
    return match[0].toUpperCase()
  }

  // Si es una URL, tomar el último segmento
  if (clean.includes('/')) {
    const parts = clean.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last) return last.toUpperCase()
  }

  return clean.toUpperCase()
}

export default function ValidarQrPage() {
  // Estado de escaneo y búsqueda
  const [manualCode, setManualCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [registration, setRegistration] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [acreditado, setAcreditado] = useState(false)

  // Estado de la cámara
  const [scannerActive, setScannerActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [resendingEmail, setResendingEmail] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = 'qr-reader-container'

  // Cargar lista de cámaras disponibles al montar
  useEffect(() => {
    let isMounted = true

    async function initCameras() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const devices = await Html5Qrcode.getCameras()
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices)
          // Preferir cámara trasera (back / environment) si existe
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('trasera') ||
              d.label.toLowerCase().includes('environment'),
          )
          setSelectedCameraId(backCam ? backCam.id : devices[0].id)
        }
      } catch (err) {
        console.warn('No se pudieron listar cámaras:', err)
      }
    }

    initCameras()

    return () => {
      isMounted = false
      stopScanner()
    }
  }, [])

  // Iniciar el lector de cámara
  const startScanner = async (cameraId?: string) => {
    setError(null)
    setCameraError(null)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      // Si ya existía una instancia previa, limpiarla
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          html5QrCodeRef.current.clear()
        } catch {
          // Ignorar si no estaba corriendo
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId)
      html5QrCodeRef.current = html5QrCode

      const camIdToUse = cameraId || selectedCameraId

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      }

      const cameraConfig = camIdToUse
        ? { deviceId: { exact: camIdToUse } }
        : { facingMode: 'environment' }

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          // Código QR escaneado con éxito
          playSuccessBeep()
          stopScanner()
          const code = extractConfirmationCode(decodedText)
          setManualCode(code)
          handleSearch(code)
        },
        () => {
          // Frame sin QR (ignorar errores de frame)
        },
      )

      setScannerActive(true)
    } catch (err: any) {
      console.error('Error al iniciar la cámara:', err)
      setCameraError(
        'No se pudo acceder a la cámara. Verifique los permisos en el navegador o use la búsqueda por código manual.',
      )
      setScannerActive(false)
    }
  }

  // Detener el lector de cámara
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.warn('Error al detener cámara:', err)
      }
    }
    setScannerActive(false)
  }

  // Búsqueda del registro por código
  const handleSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || manualCode).trim().toUpperCase()
    if (!code) return

    setSearching(true)
    setError(null)
    setRegistration(null)
    setAcreditado(false)

    try {
      const data = await api.getRegistration(code)
      setRegistration(data)
    } catch (err: any) {
      setError(
        err.message ||
          `No se encontró ningún registro para el código "${code}". Verifique que esté bien escrito o que el cliente esté registrado en la feria.`,
      )
    } finally {
      setSearching(false)
    }
  }

  // Marcar como acreditado en sala
  const handleAcreditar = () => {
    playSuccessBeep()
    setAcreditado(true)
    setToastMessage('¡Participante acreditado exitosamente para el evento!')
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Reenviar correo con el comprobante
  const handleResendEmail = async () => {
    if (!registration?.confirmationCode) return
    setResendingEmail(true)
    try {
      await api.resendRegistrationEmail(registration.confirmationCode)
      setToastMessage('Comprobante reenviado al correo del participante.')
    } catch (err: any) {
      setToastMessage(err.message || 'No se pudo reenviar el correo.')
    } finally {
      setResendingEmail(false)
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  // Limpiar para escanear el siguiente
  const handleResetForNext = () => {
    setRegistration(null)
    setManualCode('')
    setError(null)
    setAcreditado(false)
    startScanner()
  }

  // Filtrar ítems en Servicios y Productos
  const servicios =
    registration?.items?.filter(
      (i: any) =>
        i.itemType === 'SERVICE' || i.catalogItem?.type === 'SERVICE',
    ) || []
  const productos =
    registration?.items?.filter(
      (i: any) =>
        i.itemType === 'PRODUCT' || i.catalogItem?.type === 'PRODUCT',
    ) || []

  return (
    <div className='p-4 md:p-6 space-y-6 max-w-6xl mx-auto'>
      {/* Encabezado */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-backgroundPaper p-5 rounded-2xl border border-borderColor shadow-xs'>
        <div className='flex items-center gap-3.5'>
          <div className='w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md'>
            <i className='ri-qr-scan-2-line text-2xl' />
          </div>
          <div>
            <h1 className='text-xl font-black text-textPrimary leading-tight'>
              Acreditación y Validación de QR
            </h1>
            <p className='text-xs text-textSecondary'>
              Escanee el código QR del cliente o ingrese el código para validar su cotización y solicitudes para la Feria Disagro.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <Link href='/registros' className='w-full sm:w-auto'>
            <Button
              variant='outlined'
              size='small'
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                borderColor: 'var(--mui-palette-divider)',
                color: 'var(--mui-palette-text-primary)',
              }}
              startIcon={<i className='ri-list-check' />}
            >
              Ver Todos los Registros
            </Button>
          </Link>
        </div>
      </div>

      {toastMessage && (
        <Alert severity='success' className='rounded-xl shadow-xs'>
          {toastMessage}
        </Alert>
      )}

      {/* Grid Principal: Lector a la Izquierda / Información del Cliente a la Derecha */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* COLUMNA IZQUIERDA: Escáner y Entrada de Código (5 cols) */}
        <div className='lg:col-span-5 space-y-5'>
          {/* Tarjeta del Escáner de Cámara */}
          <Card className='rounded-2xl border border-borderColor shadow-xs overflow-hidden'>
            <div className='bg-[#1b5e20] text-white p-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <i className='ri-camera-lens-line text-lg' />
                <span className='font-bold text-sm'>Escáner de Cámara en Vivo</span>
              </div>
              {scannerActive && (
                <span className='flex items-center gap-1.5 text-[11px] bg-emerald-700/80 px-2 py-0.5 rounded-full font-mono'>
                  <span className='w-2 h-2 rounded-full bg-emerald-300 animate-ping' />
                  Escaneando...
                </span>
              )}
            </div>

            <CardContent className='p-5 space-y-4'>
              {/* Visor de la cámara */}
              <div className='relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center border border-borderColor'>
                <div id={scannerContainerId} className='w-full h-full' />

                {!scannerActive && (
                  <div className='absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10'>
                    <div className='w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400'>
                      <i className='ri-qr-scan-line text-3xl' />
                    </div>
                    <div>
                      <p className='font-bold text-white text-sm'>Cámara desactivada</p>
                      <p className='text-[11px] text-gray-400 max-w-xs mt-1'>
                        Presione el botón para activar la cámara de su laptop, tableta o celular y apuntar al código del cliente.
                      </p>
                    </div>
                    <Button
                      variant='contained'
                      onClick={() => startScanner()}
                      sx={{
                        backgroundColor: '#2e7d32',
                        textTransform: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#1b5e20' },
                      }}
                      startIcon={<i className='ri-camera-fill' />}
                    >
                      Activar Cámara
                    </Button>
                  </div>
                )}
              </div>

              {cameraError && (
                <Alert severity='warning' className='rounded-xl text-xs'>
                  {cameraError}
                </Alert>
              )}

              {/* Controles de la cámara */}
              {scannerActive && (
                <div className='flex gap-2 justify-between items-center pt-1'>
                  {cameras.length > 1 && (
                    <select
                      className='text-xs bg-actionHover border border-borderColor rounded-lg px-2.5 py-1.5 text-textPrimary focus:outline-hidden max-w-[200px] truncate'
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value)
                        startScanner(e.target.value)
                      }}
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label || `Cámara ${c.id.substring(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={stopScanner}
                    sx={{ textTransform: 'none', borderRadius: '8px', ml: 'auto' }}
                    startIcon={<i className='ri-stop-circle-line' />}
                  >
                    Detener Cámara
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarjeta de Entrada Manual / Lector USB */}
          <Card className='rounded-2xl border border-borderColor shadow-xs'>
            <CardContent className='p-5 space-y-3'>
              <div className='flex items-center gap-2'>
                <i className='ri-barcode-box-line text-emerald-600 text-lg' />
                <span className='font-bold text-sm text-textPrimary'>
                  Búsqueda Manual o Lector de Código de Barras / QR USB
                </span>
              </div>
              <p className='text-xs text-textSecondary'>
                Ingrese el código (ej. <span className='font-mono font-bold text-textPrimary'>DIS-2026-XXXX</span>) o use una pistola lectora USB enfocada en este campo.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSearch()
                }}
                className='flex gap-2'
              >
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Ej: DIS-2026-A1B2C3D4'
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  InputProps={{
                    className: 'font-mono uppercase font-bold text-sm',
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='ri-search-line text-textSecondary' />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type='submit'
                  variant='contained'
                  disabled={searching || !manualCode.trim()}
                  sx={{
                    backgroundColor: '#2e7d32',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    px: 3,
                    '&:hover': { backgroundColor: '#1b5e20' },
                  }}
                >
                  {searching ? <CircularProgress size={16} color='inherit' /> : 'Buscar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: ¿Qué desea el cliente? y Validación (7 cols) */}
        <div className='lg:col-span-7 space-y-5'>
          {/* Mensaje de Error si no se encuentra */}
          {error && (
            <Alert severity='error' className='rounded-2xl'>
              {error}
            </Alert>
          )}

          {/* Estado Inicial: Esperando Escaneo */}
          {!registration && !searching && !error && (
            <Card className='rounded-2xl border-2 border-dashed border-borderColor bg-actionHover/30 p-12 text-center'>
              <div className='max-w-sm mx-auto space-y-3'>
                <div className='w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner'>
                  <i className='ri-user-search-line' />
                </div>
                <h3 className='font-bold text-base text-textPrimary'>
                  Listo para Acreditar Participante
                </h3>
                <p className='text-xs text-textSecondary leading-relaxed'>
                  Apunte la cámara al código QR que el cliente presenta en su gafete digital o comprobante, o ingrese el código único manualmente para ver sus solicitudes y descuentos.
                </p>
              </div>
            </Card>
          )}

          {/* Cargando */}
          {searching && (
            <Card className='rounded-2xl border border-borderColor p-12 text-center'>
              <CircularProgress size={40} sx={{ color: '#2e7d32', mb: 2 }} />
              <p className='font-bold text-sm text-textPrimary'>Consultando información del cliente...</p>
              <p className='text-xs text-textSecondary mt-1'>Recuperando solicitudes, descuentos y catálogo en tiempo real.</p>
            </Card>
          )}

          {/* RESULTADO COMPLETO: Datos del Cliente + Qué Desea el Cliente */}
          {registration && (
            <div className='space-y-5 animate-fadeIn'>
              {/* Tarjeta de Encabezado y Acreditación */}
              <Card className='rounded-2xl border border-borderColor shadow-xs overflow-hidden'>
                <div className='bg-[#24292e] text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-xl shadow-xs'>
                      {registration.customer?.fullName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <span className='font-black text-lg text-white block leading-tight'>
                        {registration.customer?.fullName}
                      </span>
                      <span className='text-xs text-gray-300'>
                        {registration.customer?.company || 'Particular'}
                        {registration.customer?.jobTitle ? ` • ${registration.customer.jobTitle}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    {acreditado ? (
                      <Chip
                        label='ACREDITADO EN SALA'
                        color='success'
                        size='small'
                        icon={<i className='ri-checkbox-circle-fill text-sm' />}
                        sx={{ fontWeight: 'black', fontSize: '11px', py: 1 }}
                      />
                    ) : (
                      <Chip
                        label={registration.status || 'CONFIRMADO'}
                        color='primary'
                        size='small'
                        sx={{ fontWeight: 'bold', fontSize: '11px' }}
                      />
                    )}
                  </div>
                </div>

                <CardContent className='p-5 space-y-4 text-xs'>
                  {/* Fila de Datos Rápidos */}
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-actionHover border border-borderColor'>
                    <div>
                      <span className='text-[10px] text-textSecondary uppercase font-bold block'>Código</span>
                      <span className='font-mono font-black text-sm text-textPrimary'>
                        {registration.confirmationCode}
                      </span>
                    </div>
                    <div>
                      <span className='text-[10px] text-textSecondary uppercase font-bold block'>Correo</span>
                      <span className='text-textPrimary font-medium truncate block' title={registration.customer?.email}>
                        {registration.customer?.email}
                      </span>
                    </div>
                    <div>
                      <span className='text-[10px] text-textSecondary uppercase font-bold block'>Teléfono</span>
                      <span className='text-textPrimary font-medium'>
                        {registration.customer?.phone}
                      </span>
                    </div>
                  </div>

                  {/* Acciones Rápidas de la Acreditación */}
                  <div className='flex flex-wrap items-center gap-2 pt-1'>
                    {!acreditado ? (
                      <Button
                        variant='contained'
                        size='medium'
                        onClick={handleAcreditar}
                        sx={{
                          backgroundColor: '#2e7d32',
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '10px',
                          px: 3,
                          '&:hover': { backgroundColor: '#1b5e20' },
                        }}
                        startIcon={<i className='ri-user-shared-line' />}
                      >
                        Marcar Asistencia / Acreditar Cliente
                      </Button>
                    ) : (
                      <Button
                        variant='contained'
                        color='success'
                        disabled
                        size='medium'
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                        startIcon={<i className='ri-check-double-line' />}
                      >
                        Ingreso Registrado
                      </Button>
                    )}

                    <Link
                      href={`/resumen/${encodeURIComponent(registration.confirmationCode)}`}
                      target='_blank'
                    >
                      <Button
                        variant='outlined'
                        size='medium'
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          borderColor: 'var(--mui-palette-divider)',
                          color: 'var(--mui-palette-text-primary)',
                        }}
                        startIcon={<i className='ri-printer-line' />}
                      >
                        Ver / Imprimir Gafete
                      </Button>
                    </Link>

                    <Button
                      variant='outlined'
                      size='medium'
                      onClick={handleResendEmail}
                      disabled={resendingEmail}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        borderColor: 'var(--mui-palette-divider)',
                        color: 'var(--mui-palette-text-primary)',
                      }}
                      startIcon={
                        resendingEmail ? (
                          <CircularProgress size={14} color='inherit' />
                        ) : (
                          <i className='ri-mail-send-line' />
                        )
                      }
                    >
                      {resendingEmail ? 'Enviando...' : 'Reenviar Correo'}
                    </Button>

                    <Button
                      variant='contained'
                      color='secondary'
                      size='medium'
                      onClick={handleResetForNext}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        ml: 'auto',
                      }}
                      startIcon={<i className='ri-user-add-line' />}
                    >
                      Siguiente Cliente
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta: ¿QUÉ DESEA EL CLIENTE? */}
              <Card className='rounded-2xl border border-borderColor shadow-xs overflow-hidden'>
                <div className='bg-actionHover px-5 py-4 border-b border-borderColor flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <i className='ri-shopping-cart-2-fill text-emerald-600 text-lg' />
                    <h2 className='font-black text-sm text-textPrimary uppercase tracking-wider'>
                      ¿Qué desea el cliente? (Servicios y Productos Solicitados)
                    </h2>
                  </div>
                  <span className='text-xs font-bold text-textSecondary'>
                    {registration.items?.length || 0} ítems seleccionados
                  </span>
                </div>

                <CardContent className='p-5 space-y-5 text-xs'>
                  {/* 1. SECCIÓN DE SERVICIOS */}
                  {servicios.length > 0 && (
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between pb-1 border-b border-borderColor'>
                        <span className='font-black text-xs text-emerald-600 uppercase tracking-wide flex items-center gap-1.5'>
                          <i className='ri-tools-line' />
                          Servicios Tecnológicos Solicitados ({servicios.length})
                        </span>
                        <span className='text-[11px] font-semibold text-textSecondary'>
                          Subtotal: Q. {Number(registration.serviceSubtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className='overflow-x-auto'>
                        <table className='w-full text-left'>
                          <thead>
                            <tr className='text-[10px] text-textSecondary uppercase font-bold border-b border-borderColor/60'>
                              <th className='py-2'>Servicio</th>
                              <th className='py-2 text-center'>Cant.</th>
                              <th className='py-2 text-right'>Precio Unit.</th>
                              <th className='py-2 text-right'>Total</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-borderColor/40'>
                            {servicios.map((s: any, idx: number) => (
                              <tr key={s.id || idx} className='hover:bg-actionHover/50'>
                                <td className='py-2 font-medium text-textPrimary'>
                                  {s.nameSnapshot}
                                </td>
                                <td className='py-2 text-center font-bold'>{s.quantity}</td>
                                <td className='py-2 text-right text-textSecondary'>
                                  Q. {Number(s.unitPriceSnapshot).toFixed(2)}
                                </td>
                                <td className='py-2 text-right font-bold text-textPrimary'>
                                  Q. {Number(s.lineTotal).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. SECCIÓN DE PRODUCTOS */}
                  {productos.length > 0 && (
                    <div className='space-y-2 pt-2'>
                      <div className='flex items-center justify-between pb-1 border-b border-borderColor'>
                        <span className='font-black text-xs text-blue-600 uppercase tracking-wide flex items-center gap-1.5'>
                          <i className='ri-seedling-line' />
                          Productos e Insumos Solicitados ({productos.length})
                        </span>
                        <span className='text-[11px] font-semibold text-textSecondary'>
                          Subtotal: Q. {Number(registration.productSubtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className='overflow-x-auto'>
                        <table className='w-full text-left'>
                          <thead>
                            <tr className='text-[10px] text-textSecondary uppercase font-bold border-b border-borderColor/60'>
                              <th className='py-2'>Producto</th>
                              <th className='py-2 text-center'>Cant.</th>
                              <th className='py-2 text-right'>Precio Unit.</th>
                              <th className='py-2 text-right'>Total</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-borderColor/40'>
                            {productos.map((p: any, idx: number) => (
                              <tr key={p.id || idx} className='hover:bg-actionHover/50'>
                                <td className='py-2 font-medium text-textPrimary'>
                                  {p.nameSnapshot}
                                </td>
                                <td className='py-2 text-center font-bold'>{p.quantity}</td>
                                <td className='py-2 text-right text-textSecondary'>
                                  Q. {Number(p.unitPriceSnapshot).toFixed(2)}
                                </td>
                                <td className='py-2 text-right font-bold text-textPrimary'>
                                  Q. {Number(p.lineTotal).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <Divider className='border-borderColor' />

                  {/* DESGLOSE FINANCIERO Y DESCUENTOS DE LA FERIA */}
                  <div className='bg-actionHover/70 rounded-xl p-4 space-y-2 border border-borderColor'>
                    <div className='flex justify-between text-textSecondary'>
                      <span>Subtotal Servicios:</span>
                      <span className='font-semibold text-textPrimary'>
                        Q. {Number(registration.serviceSubtotal || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className='flex justify-between text-textSecondary'>
                      <span>Subtotal Productos:</span>
                      <span className='font-semibold text-textPrimary'>
                        Q. {Number(registration.productSubtotal || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className='flex justify-between text-emerald-600 font-semibold'>
                      <span>
                        Descuento Servicios ({registration.serviceDiscountPercentage || 0}%):
                      </span>
                      <span>- Q. {Number(registration.serviceDiscountAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className='flex justify-between text-blue-600 font-semibold'>
                      <span>
                        Descuento Productos ({registration.productDiscountPercentage || 0}%):
                      </span>
                      <span>- Q. {Number(registration.productDiscountAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className='flex justify-between text-emerald-700 dark:text-emerald-400 font-black border-t border-borderColor pt-2 text-sm'>
                      <span>Ahorro Total Promocional:</span>
                      <span>Q. {Number(registration.totalDiscountAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className='flex justify-between items-center text-sm font-black text-textPrimary border-t-2 border-borderColor pt-3'>
                      <span className='text-base'>Total Estimado a Invertir:</span>
                      <span className='text-2xl font-black text-emerald-600 dark:text-emerald-400'>
                        Q. {Number(registration.estimatedTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
