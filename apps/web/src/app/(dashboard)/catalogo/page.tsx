'use client'

import React, { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { api } from '@/services/api'

export default function CatalogoPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL')
  const [search, setSearch] = useState('')

  // Modal para agregar ítem
  const [openModal, setOpenModal] = useState(false)
  const [newItem, setNewItem] = useState({
    type: 'SERVICE' as 'SERVICE' | 'PRODUCT',
    name: '',
    description: '',
    price: '',
    category: '',
  })
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadCatalog = async () => {
    setLoading(true)
    try {
      const res = await api.getCatalog({
        type: filterType !== 'ALL' ? filterType : undefined,
        search: search || undefined,
      })
      setItems(res || [])
    } catch (err) {
      console.error('Error cargando catálogo:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadCatalog, 300)
    return () => clearTimeout(timer)
  }, [filterType, search])

  const handleToggleActive = async (id: string) => {
    try {
      await api.toggleCatalogItem(id)
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, active: !item.active } : item,
        ),
      )
    } catch (err) {
      console.error('Error alternando estado:', err)
    }
  }

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.price) {
      setErrorMsg('Nombre y Precio son requeridos.')
      return
    }

    setSaving(true)
    setErrorMsg(null)
    try {
      await api.createCatalogItem({
        type: newItem.type,
        name: newItem.name.trim(),
        description: newItem.description.trim(),
        price: parseFloat(newItem.price),
        category: newItem.category.trim(),
      })
      setOpenModal(false)
      setNewItem({ type: 'SERVICE', name: '', description: '', price: '', category: '' })
      loadCatalog()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el ítem')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Gestión de Catálogo Comercial
          </h1>
          <p className='text-sm text-gray-500'>
            Administración de servicios tecnológicos y productos para la Feria Disagro.
          </p>
        </div>

        <Button
          variant='contained'
          onClick={() => setOpenModal(true)}
          sx={{
            backgroundColor: '#2e7d32',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#1b5e20' },
          }}
          startIcon={<i className='ri-add-line' />}
        >
          Nuevo Ítem
        </Button>
      </div>

      <Card className='shadow-sm rounded-xl border border-gray-200'>
        <CardHeader
          title={
            <div className='flex flex-col sm:flex-row gap-3 items-center justify-between'>
              <div className='w-full sm:w-80'>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Buscar por nombre o categoría...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='ri-search-line text-gray-400' />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <div className='flex items-center space-x-2 bg-gray-100 p-1 rounded-lg'>
                <button
                  type='button'
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterType === 'ALL'
                      ? 'bg-white text-gray-900 shadow-sm font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type='button'
                  onClick={() => setFilterType('SERVICE')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterType === 'SERVICE'
                      ? 'bg-white text-[#2e7d32] shadow-sm font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Servicios
                </button>
                <button
                  type='button'
                  onClick={() => setFilterType('PRODUCT')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterType === 'PRODUCT'
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Productos
                </button>
              </div>
            </div>
          }
        />

        <CardContent className='p-0'>
          {loading ? (
            <div className='text-center py-16'>
              <CircularProgress color='success' />
              <p className='text-xs text-gray-500 mt-2'>Cargando catálogo...</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-xs text-left'>
                <thead className='bg-gray-50 text-gray-600 font-semibold border-y border-gray-200'>
                  <tr>
                    <th className='p-3.5'>Nombre</th>
                    <th className='p-3.5'>Tipo</th>
                    <th className='p-3.5'>Categoría</th>
                    <th className='p-3.5 text-right'>Precio Oficial</th>
                    <th className='p-3.5 text-center'>Estado</th>
                    <th className='p-3.5 text-center'>Habilitar</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {items.map((item) => (
                    <tr key={item.id} className='hover:bg-gray-50/70 transition-colors'>
                      <td className='p-3.5'>
                        <div className='font-semibold text-gray-900'>{item.name}</div>
                        {item.description && (
                          <div className='text-[10px] text-gray-500 line-clamp-1'>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className='p-3.5'>
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            item.type === 'SERVICE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.type === 'SERVICE' ? 'Servicio' : 'Producto'}
                        </span>
                      </td>
                      <td className='p-3.5 text-gray-600'>
                        {item.category || 'General'}
                      </td>
                      <td className='p-3.5 text-right font-bold text-gray-900'>
                        Q. {Number(item.price).toFixed(2)}
                      </td>
                      <td className='p-3.5 text-center'>
                        <Chip
                          label={item.active ? 'Activo' : 'Inactivo'}
                          size='small'
                          color={item.active ? 'success' : 'default'}
                          sx={{ fontSize: '10px', height: 20 }}
                        />
                      </td>
                      <td className='p-3.5 text-center'>
                        <Switch
                          checked={item.active}
                          onChange={() => handleToggleActive(item.id)}
                          color='success'
                          size='small'
                        />
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className='text-center py-12 text-gray-400'>
                        No hay ítems registrados en esta vista.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nuevo Ítem */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ className: 'rounded-2xl' }}
      >
        <DialogTitle className='bg-[#24292e] text-white p-4 font-bold text-base'>
          Agregar Ítem al Catálogo
        </DialogTitle>

        <DialogContent className='p-5 space-y-4 text-xs'>
          {errorMsg && <Alert severity='error'>{errorMsg}</Alert>}

          <TextField
            fullWidth
            select
            label='Tipo de Ítem'
            size='small'
            value={newItem.type}
            onChange={(e) =>
              setNewItem({ ...newItem, type: e.target.value as any })
            }
          >
            <MenuItem value='SERVICE'>Servicio</MenuItem>
            <MenuItem value='PRODUCT'>Producto</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label='Nombre *'
            size='small'
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />

          <TextField
            fullWidth
            label='Precio en Quetzales (Q) *'
            size='small'
            type='number'
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />

          <TextField
            fullWidth
            label='Categoría'
            size='small'
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          />

          <TextField
            fullWidth
            label='Descripción'
            size='small'
            multiline
            rows={2}
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
          />
        </DialogContent>

        <DialogActions className='p-4 border-t border-gray-200'>
          <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveItem}
            disabled={saving}
            variant='contained'
            sx={{
              backgroundColor: '#2e7d32',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#1b5e20' },
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Ítem'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
