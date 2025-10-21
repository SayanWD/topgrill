import { z } from 'zod'

/**
 * Common Zod schemas for validation
 */

export const emailSchema = z.string().email('Invalid email address')

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
  .optional()

export const urlSchema = z.string().url('Invalid URL')

export const contactSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: phoneSchema,
  companyId: z.string().uuid().optional(),
  source: z.string().optional(),
  lifecycleStage: z
    .enum(['lead', 'mql', 'sql', 'opportunity', 'customer'])
    .optional(),
})

export const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  stage: z.string().min(1, 'Stage is required'),
  probability: z.number().min(0).max(100),
  closeDate: z.string().optional(),
})

export const eventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  eventType: z.string().min(1, 'Event type is required'),
  source: z.string().min(1, 'Source is required'),
  contactId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
})

export const dateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
})

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
})

export const filterSchema = z.object({
  search: z.string().optional(),
  source: z.array(z.string()).optional(),
  stage: z.array(z.string()).optional(),
  dateRange: dateRangeSchema.optional(),
})

