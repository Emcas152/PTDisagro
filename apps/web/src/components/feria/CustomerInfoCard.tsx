'use client'

import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import { ContactPreference } from '@ptdisagro/contracts'

export interface CustomerFormData {
  fullName: string
  email: string
  phone: string
  company?: string
  jobTitle?: string
  attendanceDate: string
  preferredContactMethod: ContactPreference
  acceptedTerms: boolean
}

interface CustomerInfoCardProps {
  formData: CustomerFormData
  onChange: (field: keyof CustomerFormData, value: any) => void
  errors?: Record<string, string>
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--mui-palette-divider, rgba(0, 0, 0, 0.25))',
      borderWidth: '1.5px',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#2e7d32',
      borderWidth: '1.5px',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#2e7d32 !important',
      borderWidth: '2px',
      boxShadow: '0 0 0 3px rgba(46, 125, 50, 0.15)',
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d32f2f !important',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--mui-palette-text-secondary)',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#2e7d32 !important',
      fontWeight: 600,
    },
    '&.Mui-error': {
      color: '#d32f2f !important',
    },
  },
  '& .MuiInputBase-input': {
    color: 'var(--mui-palette-text-primary)',
    fontWeight: 500,
    '&::placeholder': {
      color: 'var(--mui-palette-text-secondary)',
      opacity: 0.65,
    },
  },
  '& .MuiSelect-icon': {
    color: 'var(--mui-palette-text-secondary)',
  },
}

export default function CustomerInfoCard({
  formData,
  onChange,
  errors = {},
}: CustomerInfoCardProps) {
  return (
    <Card className='shadow-md border border-borderColor rounded-2xl overflow-hidden bg-backgroundPaper'>
      {/* Cabecera de la tarjeta con Badge circular verde */}
      <div className='px-6 py-4 border-b border-borderColor flex items-center space-x-3 bg-actionHover'>
        <div className='w-8 h-8 rounded-full bg-[#2e7d32] text-white flex items-center justify-center font-bold text-sm shadow-sm'>
          1
        </div>
        <div>
          <h2 className='text-lg font-bold text-textPrimary leading-tight'>
            Ingrese su información
          </h2>
          <p className='text-xs text-textSecondary'>
            Complete sus datos para personalizar su portafolio de promociones
          </p>
        </div>
      </div>

      <CardContent className='p-6 space-y-4'>
        {/* Nombre completo */}
        <div>
          <TextField
            fullWidth
            label='Nombre Completo *'
            placeholder='Ej: Carlos Roberto Morales'
            value={formData.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            error={!!errors.fullName}
            helperText={errors.fullName}
            size='small'
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-user-line text-textDisabled' />
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Email y Teléfono */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <TextField
            fullWidth
            label='Correo Electrónico *'
            type='email'
            placeholder='ejemplo@correo.com'
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            size='small'
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-mail-line text-textDisabled' />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label='Número de Teléfono *'
            placeholder='Ej: 5555-1234'
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone}
            size='small'
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-phone-line text-textDisabled' />
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Empresa y Cargo */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <TextField
            fullWidth
            label='Empresa / Finca (Opcional)'
            placeholder='Ej: Agropecuaria Santa Fe'
            value={formData.company || ''}
            onChange={(e) => onChange('company', e.target.value)}
            size='small'
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-building-line text-textDisabled' />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label='Puesto o Cargo (Opcional)'
            placeholder='Ej: Administrador General'
            value={formData.jobTitle || ''}
            onChange={(e) => onChange('jobTitle', e.target.value)}
            size='small'
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-briefcase-line text-textDisabled' />
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Fecha y Hora de Asistencia y Preferencia de Contacto */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <TextField
            fullWidth
            label='Fecha y Hora de Asistencia *'
            select
            value={formData.attendanceDate}
            onChange={(e) => onChange('attendanceDate', e.target.value)}
            error={!!errors.attendanceDate}
            helperText={errors.attendanceDate || 'Seleccione cuándo asistirá a la feria'}
            size='small'
            sx={fieldSx}
          >
            <MenuItem value=''>Seleccione una opción...</MenuItem>
            <MenuItem value='2026-10-15 09:00 AM'>Jueves 15 Oct - 09:00 AM (Inauguración)</MenuItem>
            <MenuItem value='2026-10-15 02:00 PM'>Jueves 15 Oct - 02:00 PM (Tarde)</MenuItem>
            <MenuItem value='2026-10-16 09:00 AM'>Viernes 16 Oct - 09:00 AM (Mañana)</MenuItem>
            <MenuItem value='2026-10-16 02:00 PM'>Viernes 16 Oct - 02:00 PM (Tarde)</MenuItem>
            <MenuItem value='2026-10-17 10:00 AM'>Sábado 17 Oct - 10:00 AM (Cierre)</MenuItem>
          </TextField>

          <TextField
            fullWidth
            label='Preferencia de Contacto'
            select
            value={formData.preferredContactMethod}
            onChange={(e) => onChange('preferredContactMethod', e.target.value)}
            size='small'
            sx={fieldSx}
          >
            <MenuItem value='EMAIL'>Correo Electrónico</MenuItem>
            <MenuItem value='WHATSAPP'>WhatsApp Corporativo</MenuItem>
            <MenuItem value='PHONE'>Llamada Telefónica</MenuItem>
          </TextField>
        </div>

        {/* Términos y Condiciones */}
        <div className='pt-2'>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.acceptedTerms}
                onChange={(e) => onChange('acceptedTerms', e.target.checked)}
                sx={{
                  color: '#2e7d32',
                  '&.Mui-checked': {
                    color: '#2e7d32',
                  },
                }}
              />
            }
            label={
              <span className='text-xs text-textSecondary'>
                Acepto los{' '}
                <a href='#' className='text-emerald-600 dark:text-emerald-400 font-semibold underline hover:opacity-80'>
                  términos y condiciones
                </a>{' '}
                y la política de privacidad de Disagro para recibir el portafolio promocional.
              </span>
            }
          />
          {errors.acceptedTerms && (
            <FormHelperText error className='ml-3'>
              {errors.acceptedTerms}
            </FormHelperText>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
