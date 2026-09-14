import { z } from 'zod'
import {
  CatalogItemType,
  ContactPreference,
  EventStatus,
  RegistrationStatus,
  UserRole,
} from './enums'

export const ContactPreferenceSchema = z.nativeEnum(ContactPreference)
export const CatalogItemTypeSchema = z.nativeEnum(CatalogItemType)
export const RegistrationStatusSchema = z.nativeEnum(RegistrationStatus)
export const EventStatusSchema = z.nativeEnum(EventStatus)
export const UserRoleSchema = z.nativeEnum(UserRole)

export const CustomerInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(120, 'El nombre no puede superar los 120 caracteres'),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .email('Ingrese un correo electrónico válido')
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(8, 'El número de teléfono debe tener al menos 8 dígitos')
    .max(20, 'Número de teléfono inválido'),
  company: z.string().trim().max(100).optional().or(z.literal('')),
  jobTitle: z.string().trim().max(100).optional().or(z.literal('')),
  attendanceDate: z
    .string()
    .min(1, 'Seleccione la fecha y hora en que asistirá')
    .optional(),
  preferredContactMethod: ContactPreferenceSchema.default(
    ContactPreference.EMAIL,
  ),
  acceptedTerms: z
    .boolean()
    .refine((val) => val === true, 'Debe aceptar los términos y condiciones'),
})

export const SelectedItemInputSchema = z.object({
  catalogItemId: z.string().uuid('ID de catálogo inválido'),
  quantity: z.number().int().min(1, 'La cantidad mínima es 1').default(1),
})

export const RegistrationPreviewInputSchema = z.object({
  items: z.array(SelectedItemInputSchema),
})

export const CreateRegistrationInputSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  customer: CustomerInfoSchema,
  items: z
    .array(SelectedItemInputSchema)
    .min(1, 'Debe seleccionar al menos un servicio o producto'),
  idempotencyKey: z.string().optional(),
})

export const UpdateRegistrationInputSchema = z.object({
  items: z
    .array(SelectedItemInputSchema)
    .min(1, 'Debe mantener al menos un servicio o producto seleccionado'),
})

export const LoginInputSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido').toLowerCase(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const CatalogItemCreateSchema = z.object({
  type: CatalogItemTypeSchema,
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).optional(),
  price: z.number().positive('El precio debe ser mayor a cero'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().trim().min(2).max(60).optional(),
  active: z.boolean().default(true),
})

export const CatalogItemUpdateSchema = CatalogItemCreateSchema.partial()
