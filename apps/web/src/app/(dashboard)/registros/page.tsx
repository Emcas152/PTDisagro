'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import TablePagination from '@mui/material/TablePagination'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/services/api'

export default function RegistrosPage() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)

  // Modal de detalle y resumen
  const [selectedReg, setSelectedReg] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [originUrl, setOriginUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getAdminRegistrations({
        search: search || undefined,
        status: statusFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
      })
      setRegistrations(res.items || [])
      setTotal(res.pagination?.total || 0)
    } catch (err) {
      console.error('Error cargando registros:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter, page, rowsPerPage])

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank')
  }

  const handleOpenDetail = (reg: any) => {
    setSelectedReg(reg)
    setModalOpen(true)
  }

  const handleResendEmail = async () => {
    if (!selectedReg?.confirmationCode) return
    setResendingEmail(true)
    try {
      await api.resendRegistrationEmail(selectedReg.confirmationCode)
      setToastMessage(
        `Confirmación reenviada con éxito al correo: ${selectedReg.customer?.email}`,
      )
    } catch (err: any) {
      setToastMessage(err.message || 'No se pudo reenviar el correo.')
    } finally {
      setResendingEmail(false)
    }
  }

  const handleOpenPublicVoucher = () => {
    if (!selectedReg?.confirmationCode) return
    window.open(`/resumen/${encodeURIComponent(selectedReg.confirmationCode)}`, '_blank')
  }

  return (
    <div className='space-y-6'>
      {/* Encabezado con Botón de Exportar */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-textPrimary'>
            Participantes y Confirmaciones
          </h1>
          <p className='text-sm text-textSecondary'>
            Gestión de clientes registrados, lectura de resumen de promociones y lectura de códigos QR.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto'>
          <Link href='/validar-qr'>
            <Button
              variant='contained'
              sx={{
                backgroundColor: '#1b5e20',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                '&:hover': { backgroundColor: '#0d3311' },
              }}
              startIcon={<i className='ri-qr-scan-2-line' />}
            >
              Escanear QR / Acreditar
            </Button>
          </Link>

          <Button
            variant='outlined'
            onClick={handleExportCsv}
            sx={{
              borderColor: 'var(--mui-palette-divider)',
              color: 'var(--mui-palette-text-primary)',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
            }}
            startIcon={<i className='ri-file-excel-2-line' />}
          >
            Exportar a CSV
          </Button>
        </div>
      </div>

      {/* Tarjeta de Filtros y Tabla */}
      <Card className='shadow-sm rounded-xl border border-borderColor bg-backgroundPaper'>
        <CardHeader
          title={
            <div className='flex flex-col sm:flex-row gap-3 items-center justify-between'>
              <div className='w-full sm:w-80'>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Buscar por nombre, email o código...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='ri-search-line text-textDisabled' />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <div className='w-full sm:w-48'>
                <TextField
                  fullWidth
                  size='small'
                  select
                  label='Estado'
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value=''>Todos los estados</MenuItem>
                  <MenuItem value='CONFIRMED'>Confirmados</MenuItem>
                  <MenuItem value='MODIFIED'>Modificados</MenuItem>
                  <MenuItem value='CANCELLED'>Cancelados</MenuItem>
                </TextField>
              </div>
            </div>
          }
        />

        <CardContent className='p-0'>
          {loading ? (
            <div className='text-center py-16'>
              <CircularProgress color='success' />
              <p className='text-xs text-textSecondary mt-2'>Cargando registros...</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-xs text-left'>
                <thead className='bg-actionHover text-textSecondary font-semibold border-y border-borderColor'>
                  <tr>
                    <th className='p-3.5'>Código</th>
                    <th className='p-3.5'>Cliente</th>
                    <th className='p-3.5'>Contacto</th>
                    <th className='p-3.5'>Asistencia</th>
                    <th className='p-3.5 text-center'>Estado</th>
                    <th className='p-3.5 text-right'>Ahorro</th>
                    <th className='p-3.5 text-right'>Total</th>
                    <th className='p-3.5 text-center'>Acciones</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-borderColor'>
                  {registrations.map((r) => (
                    <tr key={r.id} className='hover:bg-actionHover transition-colors'>
                      <td className='p-3.5 font-mono font-bold text-textPrimary'>
                        {r.confirmationCode}
                      </td>
                      <td className='p-3.5'>
                        <div className='font-semibold text-textPrimary'>
                          {r.customer?.fullName}
                        </div>
                        {r.customer?.company && (
                          <span className='text-[10px] text-textSecondary block'>
                            {r.customer.company}
                          </span>
                        )}
                      </td>
                      <td className='p-3.5 text-textSecondary'>
                        <div>{r.customer?.email}</div>
                        <div className='text-[10px] text-textDisabled'>{r.customer?.phone}</div>
                      </td>
                      <td className='p-3.5 text-textSecondary'>
                        {r.customer?.attendanceDate || 'No indicada'}
                      </td>
                      <td className='p-3.5 text-center'>
                        <Chip
                          label={r.status}
                          size='small'
                          color={r.status === 'CONFIRMED' ? 'success' : 'default'}
                          sx={{ fontSize: '10px', height: 20 }}
                        />
                      </td>
                      <td className='p-3.5 text-right font-semibold text-emerald-500'>
                        Q. {Number(r.totalDiscountAmount).toFixed(2)}
                      </td>
                      <td className='p-3.5 text-right font-bold text-textPrimary'>
                        Q. {Number(r.estimatedTotal).toFixed(2)}
                      </td>
                      <td className='p-3.5 text-center'>
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => handleOpenDetail(r)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '11px',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            color: '#2e7d32',
                            borderColor: '#2e7d32',
                            '&:hover': {
                              borderColor: '#1b5e20',
                              backgroundColor: 'rgba(46, 125, 50, 0.04)',
                            },
                          }}
                          startIcon={<i className='ri-file-list-3-line' />}
                        >
                          Ver Resumen
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {registrations.length === 0 && (
                    <tr>
                      <td colSpan={8} className='text-center py-12 text-textDisabled'>
                        No se encontraron registros con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <TablePagination
            component='div'
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            labelRowsPerPage='Filas por página:'
          />
        </CardContent>
      </Card>

      {/* Modal / Diálogo de Resumen Completo de Registro con QR */}
      {selectedReg && (
        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          maxWidth='md'
          fullWidth
          PaperProps={{ className: 'rounded-2xl border border-borderColor bg-backgroundPaper overflow-hidden' }}
        >
          {/* Header del Modal */}
          <DialogTitle className='bg-[#24292e] text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2'>
            <div className='flex items-center space-x-3'>
              <div className='w-9 h-9 rounded-lg bg-[#2e7d32] flex items-center justify-center font-black text-white text-lg'>
                D
              </div>
              <div>
                <span className='font-bold text-base text-white block'>
                  Resumen de Solicitud de Registro
                </span>
                <span className='text-xs text-gray-300 font-mono'>
                  {selectedReg.confirmationCode}
                </span>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Chip
                label={selectedReg.status}
                size='small'
                color='success'
                sx={{ fontSize: '11px', fontWeight: 'bold' }}
              />
            </div>
          </DialogTitle>

          <DialogContent className='p-6 space-y-5 text-xs'>
            {/* Banner con Código QR y Resumen Rápido */}
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-actionHover border border-borderColor'>
              <div className='flex items-center gap-4'>
                <div className='p-2 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-center'>
                  <QRCodeSVG
                    value={`${originUrl}/resumen/${encodeURIComponent(
                      selectedReg.confirmationCode || '',
                    )}`}
                    size={90}
                    level='M'
                  />
                </div>
                <div className='space-y-1 text-center sm:text-left'>
                  <span className='text-[10px] font-bold uppercase tracking-wider text-emerald-600 block'>
                    Código QR de Asistencia
                  </span>
                  <p className='text-xs text-textSecondary max-w-xs'>
                    Escanear para acceder directamente a la cotización en línea o validar acreditación en taquilla.
                  </p>
                  <span className='text-[11px] font-mono font-bold text-textPrimary block'>
                    {selectedReg.confirmationCode}
                  </span>
                </div>
              </div>

              {/* Botón para abrir el voucher público */}
              <div className='flex flex-col gap-2 w-full sm:w-auto'>
                <Button
                  size='small'
                  variant='contained'
                  onClick={handleOpenPublicVoucher}
                  sx={{
                    backgroundColor: '#2e7d32',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: '#1b5e20' },
                  }}
                  startIcon={<i className='ri-external-link-line' />}
                >
                  Abrir / Imprimir Voucher
                </Button>

                <Button
                  size='small'
                  variant='outlined'
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    borderColor: 'var(--mui-palette-divider)',
                    color: 'var(--mui-palette-text-primary)',
                  }}
                  startIcon={
                    resendingEmail ? (
                      <CircularProgress size={12} color='inherit' />
                    ) : (
                      <i className='ri-mail-send-line' />
                    )
                  }
                >
                  {resendingEmail ? 'Reenviando...' : 'Reenviar al Correo'}
                </Button>
              </div>
            </div>

            {/* Ficha Completa del Participante */}
            <div>
              <h4 className='font-bold text-textPrimary text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5'>
                <i className='ri-user-3-line text-emerald-600' />
                Datos del Participante
              </h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-actionHover border border-borderColor text-xs'>
                <div>
                  <span className='text-textSecondary block'>Nombre:</span>
                  <strong className='text-textPrimary font-semibold text-xs'>
                    {selectedReg.customer?.fullName}
                  </strong>
                </div>
                <div>
                  <span className='text-textSecondary block'>Correo:</span>
                  <strong className='text-textPrimary font-semibold text-xs'>
                    {selectedReg.customer?.email}
                  </strong>
                </div>
                <div>
                  <span className='text-textSecondary block'>Teléfono:</span>
                  <strong className='text-textPrimary font-semibold text-xs'>
                    {selectedReg.customer?.phone}
                  </strong>
                </div>
                <div>
                  <span className='text-textSecondary block'>Empresa:</span>
                  <strong className='text-textPrimary font-semibold text-xs'>
                    {selectedReg.customer?.company || 'No especificada'}
                  </strong>
                </div>
                <div>
                  <span className='text-textSecondary block'>Puesto / Cargo:</span>
                  <strong className='text-textPrimary font-semibold text-xs'>
                    {selectedReg.customer?.jobTitle || 'No especificado'}
                  </strong>
                </div>
                <div>
                  <span className='text-textSecondary block'>Fecha de Asistencia:</span>
                  <strong className='text-emerald-600 font-bold text-xs'>
                    {selectedReg.customer?.attendanceDate || 'Por confirmar'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Tabla Detallada del Resumen de lo Solicitado */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <h4 className='font-bold text-textPrimary text-xs uppercase tracking-wider flex items-center gap-1.5'>
                  <i className='ri-shopping-basket-line text-emerald-600' />
                  Resumen de lo Solicitado ({selectedReg.items?.length || 0} ítems)
                </h4>
                <span className='text-[10px] text-textSecondary font-mono'>
                  Valores en Quetzales (GTQ)
                </span>
              </div>

              <div className='border border-borderColor rounded-xl overflow-hidden'>
                <table className='w-full text-xs text-left'>
                  <thead className='bg-actionHover text-textSecondary font-semibold border-b border-borderColor'>
                    <tr>
                      <th className='p-2.5'>Ítem Solicitado</th>
                      <th className='p-2.5 text-center'>Tipo</th>
                      <th className='p-2.5 text-center'>Cant.</th>
                      <th className='p-2.5 text-right'>Precio Unit.</th>
                      <th className='p-2.5 text-right'>Total</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-borderColor'>
                    {selectedReg.items?.map((item: any) => (
                      <tr key={item.id} className='hover:bg-actionHover/50'>
                        <td className='p-2.5 font-medium text-textPrimary'>
                          <div className='font-bold'>{item.nameSnapshot}</div>
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
                        <td className='p-2.5 text-center font-bold text-textPrimary'>
                          {item.quantity}
                        </td>
                        <td className='p-2.5 text-right text-textSecondary'>
                          Q. {Number(item.unitPriceSnapshot).toFixed(2)}
                        </td>
                        <td className='p-2.5 text-right font-black text-textPrimary'>
                          Q. {Number(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liquidación de Promociones y Descuentos */}
            <div className='bg-actionHover/80 rounded-xl p-4 space-y-2 text-xs border border-borderColor'>
              <div className='flex justify-between text-textSecondary'>
                <span>Subtotal Servicios Solicitados:</span>
                <span className='font-semibold text-textPrimary'>
                  Q. {Number(selectedReg.serviceSubtotal).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-textSecondary'>
                <span>Subtotal Productos Solicitados:</span>
                <span className='font-semibold text-textPrimary'>
                  Q. {Number(selectedReg.productSubtotal).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-emerald-600 font-semibold'>
                <span>
                  Descuento en Servicios ({selectedReg.serviceDiscountPercentage}%):
                </span>
                <span>- Q. {Number(selectedReg.serviceDiscountAmount).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-blue-600 font-semibold'>
                <span>
                  Descuento en Productos ({selectedReg.productDiscountPercentage}%):
                </span>
                <span>- Q. {Number(selectedReg.productDiscountAmount).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-emerald-600 font-black border-t border-borderColor pt-1.5 text-sm'>
                <span>Ahorro Total Promocional Otorgado:</span>
                <span>Q. {Number(selectedReg.totalDiscountAmount).toFixed(2)}</span>
              </div>
              <div className='flex justify-between items-center text-sm font-black text-textPrimary border-t-2 border-borderColor pt-2'>
                <span className='text-sm'>Total Final Estimado a Invertir:</span>
                <span className='text-lg font-black text-emerald-600'>
                  Q. {Number(selectedReg.estimatedTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </DialogContent>

          <DialogActions className='p-4 border-t border-borderColor bg-actionHover/30 flex justify-between items-center'>
            <span className='text-[10px] text-textSecondary'>
              Fecha de Registro: {new Date(selectedReg.createdAt).toLocaleString('es-GT')}
            </span>
            <Button
              variant='contained'
              onClick={() => setModalOpen(false)}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: '#2e7d32',
                '&:hover': { backgroundColor: '#1b5e20' },
              }}
            >
              Cerrar Resumen
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar / Alerta flotante */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity='success'
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </div>
  )
}
