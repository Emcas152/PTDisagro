import { z } from 'zod'
import {
  CatalogItemCreateSchema,
  CatalogItemUpdateSchema,
  CreateRegistrationInputSchema,
  CustomerInfoSchema,
  LoginInputSchema,
  RegistrationPreviewInputSchema,
  SelectedItemInputSchema,
  UpdateRegistrationInputSchema,
} from './schemas'
import {
  CatalogItemType,
  ContactPreference,
  EventStatus,
  RegistrationStatus,
  UserRole,
} from './enums'

export type CustomerInfo = z.infer<typeof CustomerInfoSchema>
export type SelectedItemInput = z.infer<typeof SelectedItemInputSchema>
export type RegistrationPreviewInput = z.infer<
  typeof RegistrationPreviewInputSchema
>
export type CreateRegistrationInput = z.infer<
  typeof CreateRegistrationInputSchema
>
export type UpdateRegistrationInput = z.infer<
  typeof UpdateRegistrationInputSchema
>
export type LoginInput = z.infer<typeof LoginInputSchema>
export type CatalogItemCreate = z.infer<typeof CatalogItemCreateSchema>
export type CatalogItemUpdate = z.infer<typeof CatalogItemUpdateSchema>

// Response DTOs
export interface CatalogItemDto {
  id: string
  type: CatalogItemType
  name: string
  description?: string | null
  price: number // in Quetzales
  priceCents: number
  imageUrl?: string | null
  category?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface EventDto {
  id: string
  name: string
  description: string
  location: string
  startDate: string
  endDate: string
  registrationDeadline: string
  status: EventStatus
}

export interface RegistrationItemDto {
  id: string
  catalogItemId: string
  itemType: CatalogItemType
  quantity: number
  nameSnapshot: string
  unitPriceSnapshot: number
  lineTotal: number
}

export interface RegistrationDto {
  id: string
  eventId: string
  confirmationCode: string
  status: RegistrationStatus
  customer: CustomerInfo
  serviceSubtotal: number
  productSubtotal: number
  serviceDiscountPercentage: number
  productDiscountPercentage: number
  serviceDiscountAmount: number
  productDiscountAmount: number
  totalDiscountAmount: number
  estimatedTotal: number
  items: RegistrationItemDto[]
  confirmedAt: string
  createdAt: string
  updatedAt: string
  editToken?: string
}

export interface UserDto {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface DashboardStatsDto {
  totalRegistrations: number
  totalServicesChosen: number
  totalProductsChosen: number
  projectedRevenue: number
  totalDiscountsAwarded: number
  recentRegistrations: RegistrationDto[]
  topItems: Array<{
    id: string
    name: string
    type: CatalogItemType
    count: number
  }>
}

export interface StandardErrorResponse {
  statusCode: number
  code: string
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
  requestId: string
  timestamp: string
}
