'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'

// Services
import { api } from '@/services/api'

const AccountDetails = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('SUPERADMIN')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organization, setOrganization] = useState('Disagro Guatemala')
  const [phone, setPhone] = useState('+502 2223-2425')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.getMe()
        if (res?.user) {
          setName(res.user.name || '')
          setEmail(res.user.email || '')
          setRole(res.user.role || 'SUPERADMIN')
        }
      } catch (err) {
        // Fallback a localStorage
        try {
          const cached = localStorage.getItem('disagro_user')
          if (cached) {
            const parsed = JSON.parse(cached)
            setName(parsed.name || '')
            setEmail(parsed.email || '')
            setRole(parsed.role || 'SUPERADMIN')
          }
        } catch {}
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)

    if (!name.trim() || !email.trim()) {
      setErrorMsg('El nombre y el correo electrónico son obligatorios.')
      return
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifique.')
      return
    }

    if (password && password.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    setSaving(true)

    try {
      const payload: { name: string; email: string; password?: string } = {
        name: name.trim(),
        email: email.trim(),
      }

      if (password) {
        payload.password = password
      }

      const res = await api.updateProfile(payload)
      setSuccessMsg('¡Perfil de administrador actualizado exitosamente!')
      setPassword('')
      setConfirmPassword('')

      if (res?.user) {
        setName(res.user.name)
        setEmail(res.user.email)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className='border border-borderColor bg-backgroundPaper p-10 text-center'>
        <CircularProgress color='success' size={32} />
        <p className='text-xs text-textSecondary mt-2'>Cargando información del perfil...</p>
      </Card>
    )
  }

  return (
    <Card className='border border-borderColor bg-backgroundPaper shadow-sm'>
      <CardContent className='p-6 sm:p-8 space-y-6'>
        {/* Cabecera de Usuario */}
        <div className='flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-borderColor'>
          <div className='w-20 h-20 rounded-2xl bg-[#2e7d32] text-white flex items-center justify-center text-3xl font-black shadow-md'>
            {name ? name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className='space-y-1 text-center sm:text-left'>
            <div className='flex items-center gap-3 justify-center sm:justify-start'>
              <h2 className='text-xl font-bold text-textPrimary'>{name || 'Administrador'}</h2>
              <Chip
                label={role}
                size='small'
                color='success'
                sx={{ fontWeight: 'bold', fontSize: '10px' }}
              />
            </div>
            <p className='text-xs text-textSecondary'>{email}</p>
            <p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
              {organization} • Operador Autorizado Feria 2026
            </p>
          </div>
        </div>

        {successMsg && (
          <Alert severity='success' className='text-xs rounded-xl'>
            {successMsg}
          </Alert>
        )}

        {errorMsg && (
          <Alert severity='error' className='text-xs rounded-xl'>
            {errorMsg}
          </Alert>
        )}

        {/* Formulario de Edición */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                label='Nombre Completo *'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                type='email'
                label='Correo Electrónico *'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                label='Organización / Empresa'
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                label='Teléfono de Contacto'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                type='password'
                label='Nueva Contraseña (opcional)'
                placeholder='Dejar en blanco para mantener la actual'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size='small'
                type='password'
                label='Confirmar Nueva Contraseña'
                placeholder='Repita la contraseña ingresada'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Grid>
          </Grid>

          <div className='flex gap-3 pt-4 border-t border-borderColor'>
            <Button
              type='submit'
              variant='contained'
              disabled={saving}
              sx={{
                backgroundColor: '#2e7d32',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#1b5e20' },
              }}
            >
              {saving ? <CircularProgress size={20} color='inherit' /> : 'Guardar Cambios'}
            </Button>

            <Button
              type='button'
              variant='outlined'
              onClick={() => {
                setPassword('')
                setConfirmPassword('')
                setSuccessMsg(null)
                setErrorMsg(null)
              }}
              sx={{ textTransform: 'none' }}
            >
              Restablecer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default AccountDetails
