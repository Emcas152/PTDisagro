'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Illustrations from '@components/Illustrations'
import ModeDropdown from '@components/layout/shared/ModeDropdown'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { api } from '@/services/api'

const Login = ({ mode }: { mode: Mode }) => {
  const [email, setEmail] = useState('admin@disagro.com')
  const [password, setPassword] = useState('AdminPassword2026!')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'

  const router = useRouter()
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  // Redirigir a /dashboard si ya hay una sesión activa
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('disagro_token')
      if (token) {
        api.getMe()
          .then(() => {
            router.replace('/dashboard')
          })
          .catch(() => {
            localStorage.removeItem('disagro_token')
            localStorage.removeItem('disagro_user')
          })
      }
    }
  }, [router])

  const handleClickShowPassword = () => setIsPasswordShown((show) => !show)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.login({ email: email.trim(), password })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Verifique su correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6 bg-backgroundDefault'>
      {/* Botón superior de modo oscuro/claro */}
      <div className='absolute top-4 right-4 z-20'>
        <ModeDropdown />
      </div>

      <Card className='flex flex-col sm:is-[450px] shadow-xl rounded-2xl border border-borderColor bg-backgroundPaper z-10'>
        <CardContent className='p-6 sm:!p-10'>
          <div className='flex justify-center items-center mbe-6'>
            <div className='w-12 h-12 rounded-xl bg-[#2e7d32] flex items-center justify-center font-bold text-white text-2xl shadow-md'>
              D
            </div>
          </div>

          <div className='flex flex-col gap-5'>
            <div className='text-center'>
              <Typography variant='h5' className='font-bold text-textPrimary'>
                Panel Administrativo Disagro
              </Typography>
              <Typography className='text-xs text-textSecondary mbs-1'>
                Ingrese con sus credenciales autorizadas de operador
              </Typography>
            </div>

            {error && (
              <Alert severity='error' className='text-xs rounded-xl'>
                {error}
              </Alert>
            )}

            <div className='bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300'>
              <strong className='block mb-1 font-bold'>Credenciales de Acceso:</strong>
              <div>Correo: <code className='font-bold'>admin@disagro.com</code></div>
              <div>Contraseña: <code className='font-bold'>AdminPassword2026!</code></div>
            </div>

            <form noValidate onSubmit={handleSubmit} className='flex flex-col gap-4'>
              <TextField
                autoFocus
                fullWidth
                size='small'
                label='Correo Electrónico'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                fullWidth
                size='small'
                label='Contraseña'
                type={isPasswordShown ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={loading}
                sx={{
                  backgroundColor: '#2e7d32',
                  textTransform: 'none',
                  fontWeight: 700,
                  padding: '10px',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: '#1b5e20' },
                }}
              >
                {loading ? <CircularProgress size={20} color='inherit' /> : 'Iniciar Sesión'}
              </Button>

              <div className='text-center pt-2'>
                <Link href='/feria' className='text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline'>
                  ← Ir al Portal Público de la Feria
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  )
}

export default Login
