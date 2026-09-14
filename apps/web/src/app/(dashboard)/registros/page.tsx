'use client'

import React, { useEffect, useState } from 'react'
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
import { api } from '@/services/api'

export default function RegistrosPage() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)

  // Modal de detalle
  const [selectedReg, setSelectedReg] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)

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

  return (
    <div className='space-y-6'>
      {/* Encabezado con Botón de Exportar */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-textPrimary'>
            Participantes y Confirmaciones
          </h1>
          <p className='text-sm text-textSecondary'>
            Gestión de clientes registrados, selección de promociones y exportación de datos.
          </p>
        </div>

        <Button
          variant='contained'
          onClick={handleExportCsv}
          sx={{
            backgroundColor: '#2e7d32',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#1b5e20' },
          }}
          startIcon={<i className='ri-file-excel-2-line' />}
        >
          Exportar a CSV
        </Button>
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
                          sx={{ textTransform: 'none', fontSize: '11px', padding: '2px 8px' }}
                        >
                          Ver Detalle
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

      {/* Modal de Detalle de Registro */}
      {selectedReg && (
        <Dialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          maxWidth='sm'
          fullWidth
          PaperProps={{ className: 'rounded-2xl border border-borderColor bg-backgroundPaper' }}
        >
          <DialogTitle className='bg-[#24292e] text-white p-4 flex justify-between items-center'>
            <span className='font-bold text-sm'>
              Detalle: {selectedReg.confirmationCode}
            </span>
            <Chip
              label={selectedReg.status}
              size='small'
              color='success'
              sx={{ fontSize: '10px' }}
            />
          </DialogTitle>

          <DialogContent className='p-5 space-y-4 text-xs'>
            {/* Info Participante */}
            <div className='bg-actionHover p-3 rounded-lg border border-borderColor space-y-1 text-textPrimary'>
              <div>
                <strong>Cliente:</strong> {selectedReg.customer?.fullName}
              </div>
              <div className='text-textSecondary'>
                <strong>Correo:</strong> {selectedReg.customer?.email} |{' '}
                <strong>Teléfono:</strong> {selectedReg.customer?.phone}
              </div>
              {selectedReg.customer?.company && (
                <div className='text-textSecondary'>
                  <strong>Empresa:</strong> {selectedReg.customer.company} (
                  {selectedReg.customer.jobTitle})
                </div>
              )}
              <div className='text-textSecondary'>
                <strong>Fecha Asistencia:</strong>{' '}
                {selectedReg.customer?.attendanceDate}
              </div>
            </div>

            {/* Lista de Ítems */}
            <div>
              <h4 className='font-bold text-textPrimary mb-2'>
                Ítems Seleccionados ({selectedReg.items?.length || 0})
              </h4>
              <div className='space-y-1.5 max-h-48 overflow-y-auto border border-borderColor rounded-lg p-1'>
                {selectedReg.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className='flex justify-between items-center p-2 rounded bg-actionHover text-xs'
                  >
                    <div>
                      <span className='font-semibold text-textPrimary'>
                        {item.nameSnapshot}
                      </span>{' '}
                      <span className='text-textSecondary'>(x{item.quantity})</span>
                    </div>
                    <span className='font-bold text-textPrimary'>
                      Q. {Number(item.lineTotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className='bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 space-y-1 text-xs'>
              <div className='flex justify-between text-textSecondary'>
                <span>Subtotal Servicios:</span>
                <span>Q. {Number(selectedReg.serviceSubtotal).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-textSecondary'>
                <span>Subtotal Productos:</span>
                <span>Q. {Number(selectedReg.productSubtotal).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-emerald-500 font-bold'>
                <span>Ahorro Total Promocional:</span>
                <span>Q. {Number(selectedReg.totalDiscountAmount).toFixed(2)}</span>
              </div>
              <div className='flex justify-between font-black text-textPrimary pt-1 border-t border-emerald-500/30 text-sm'>
                <span>Total Estimado:</span>
                <span>Q. {Number(selectedReg.estimatedTotal).toFixed(2)}</span>
              </div>
            </div>
          </DialogContent>

          <DialogActions className='p-4 border-t border-borderColor'>
            <Button onClick={() => setModalOpen(false)} sx={{ textTransform: 'none' }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  )
}
