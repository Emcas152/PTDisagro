'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import { api } from '@/services/api'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    async function verifyAuth() {
      if (typeof window === 'undefined') return

      const token = localStorage.getItem('disagro_token')
      if (!token) {
        router.replace('/')
        return
      }

      try {
        await api.getMe()
        if (isMounted) {
          setAuthorized(true)
        }
      } catch (err) {
        localStorage.removeItem('disagro_token')
        localStorage.removeItem('disagro_user')
        if (isMounted) {
          router.replace('/')
        }
      }
    }

    verifyAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  if (!authorized) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-backgroundDefault gap-4'>
        <div className='w-12 h-12 rounded-xl bg-[#2e7d32] flex items-center justify-center font-bold text-white text-2xl shadow-md animate-pulse'>
          D
        </div>
        <CircularProgress size={32} sx={{ color: '#2e7d32' }} />
        <p className='text-xs text-textSecondary font-medium'>
          Verificando sesión autorizada...
        </p>
      </div>
    )
  }

  return <>{children}</>
}
