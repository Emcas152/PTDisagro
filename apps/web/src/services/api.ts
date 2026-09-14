/**
 * ============================================================================
 * CLIENTE API TIPADO - FERIA DISAGRO 2026
 * ============================================================================
 *
 * Cliente HTTP unificado para comunicarse con la API de NestJS (/api/v1).
 * Maneja credenciales automáticas (cookies HttpOnly) y tipado estricto.
 */

import {
  CalculationItemInput,
  DiscountCalculationResult,
  CustomerInfo,
  SelectedItemInput,
} from '@ptdisagro/contracts'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export interface ApiErrorResponse {
  statusCode: number
  code: string
  message: string | string[]
  errors?: Array<{ field: string; message: string }>
  requestId?: string
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public errors?: Array<{ field: string; message: string }>,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Si existe un token de sesión en localStorage, adjuntarlo como header Bearer
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('disagro_token')
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Para enviar cookies HttpOnly
  })

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null
    try {
      errorData = await response.json()
    } catch {
      // Si la respuesta no es JSON
    }

    const message = errorData?.message
      ? Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message
      : `Error HTTP ${response.status}: ${response.statusText}`

    throw new ApiClientError(
      response.status,
      errorData?.code || 'HTTP_ERROR',
      message,
      errorData?.errors,
    )
  }

  // Si no hay contenido (ej. 204)
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const api = {
  // ==========================================
  // EVENTOS Y CATÁLOGO PÚBLICO
  // ==========================================
  async getActiveEvent() {
    return request<any>('/events/active')
  },

  async getEventCatalog(eventId: string) {
    return request<any[]>(`/events/${eventId}/catalog`)
  },

  async getCatalog(params?: { type?: string; category?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.type) query.set('type', params.type)
    if (params?.category) query.set('category', params.category)
    if (params?.search) query.set('search', params.search)
    return request<any[]>(`/catalog?${query.toString()}`)
  },

  // ==========================================
  // REGISTROS Y DESCUENTOS
  // ==========================================
  async previewRegistration(items: SelectedItemInput[]): Promise<{
    breakdown: DiscountCalculationResult
    items: Array<{
      id: string
      name: string
      type: string
      price: number
      quantity: number
      lineTotal: number
    }>
  }> {
    return request('/registrations/preview', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  },

  async createRegistration(data: {
    eventId: string
    customer: CustomerInfo
    items: SelectedItemInput[]
    idempotencyKey?: string
  }) {
    return request<any>('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getRegistration(confirmationCode: string) {
    return request<any>(`/registrations/${encodeURIComponent(confirmationCode)}`)
  },

  async updateRegistration(
    confirmationCode: string,
    items: SelectedItemInput[],
  ) {
    return request<any>(`/registrations/${encodeURIComponent(confirmationCode)}`, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    })
  },

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================
  async login(credentials: { email: string; password: string }) {
    const res = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (typeof window !== 'undefined') {
      if (res?.token) {
        localStorage.setItem('disagro_token', res.token)
      }
      if (res?.user) {
        localStorage.setItem('disagro_user', JSON.stringify(res.user))
      }
    }

    return res
  },

  async logout() {
    try {
      await request<any>('/auth/logout', {
        method: 'POST',
      })
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('disagro_token')
        localStorage.removeItem('disagro_user')
      }
    }
  },

  async getMe() {
    return request<any>('/auth/me')
  },

  // ==========================================
  // PANEL ADMINISTRATIVO
  // ==========================================
  async getAdminDashboard() {
    return request<any>('/admin/dashboard')
  },

  async getAdminRegistrations(params?: {
    search?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    return request<any>(`/admin/registrations?${query.toString()}`)
  },

  async getAdminRegistrationById(id: string) {
    return request<any>(`/admin/registrations/${id}`)
  },

  getExportCsvUrl(): string {
    return `${API_BASE_URL}/admin/registrations/export`
  },

  async createCatalogItem(data: {
    type: 'SERVICE' | 'PRODUCT'
    name: string
    description?: string
    price: number
    category?: string
    imageUrl?: string
  }) {
    return request<any>('/admin/catalog', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateCatalogItem(
    id: string,
    data: {
      name?: string
      description?: string
      price?: number
      category?: string
      active?: boolean
    },
  ) {
    return request<any>(`/admin/catalog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async toggleCatalogItem(id: string) {
    return request<any>(`/admin/catalog/${id}/toggle`, {
      method: 'PATCH',
    })
  },
}
