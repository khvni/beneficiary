import { z } from 'zod';

// Malaysian phone number validation
export const malaysianPhoneSchema = z
  .string()
  .regex(/^\+60\d{9,10}$/, 'Invalid Malaysian phone number. Format: +60123456789')
  .optional()
  .or(z.literal(''));

// Beneficiary validation schema
export const beneficiarySchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  idNumber: z.string().max(50).optional().nullable(),

  phone: malaysianPhoneSchema,
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postcode: z.string().max(10).optional().nullable(),

  emergencyName: z.string().max(100).optional().nullable(),
  emergencyPhone: malaysianPhoneSchema,
  emergencyRelation: z.string().max(50).optional().nullable(),

  category: z.enum(['HOMELESS', 'ELDERLY', 'DISABLED', 'LOW_INCOME', 'REFUGEE', 'ORPHAN', 'SICK', 'OTHER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'DECEASED']).default('ACTIVE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).default([]),

  source: z.string().max(100).optional().nullable(),
});

// Case validation schema
export const caseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  type: z.enum(['FOOD', 'SHELTER', 'HEALTHCARE', 'EDUCATION', 'IDENTITY_DOCUMENTS', 'EMPLOYMENT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('OPEN'),
  beneficiaryId: z.string().cuid(),
});

// Service validation schema
export const serviceSchema = z.object({
  type: z.enum(['FOOD_DISTRIBUTION', 'SHELTER_ADMISSION', 'SHELTER_EXIT', 'MEDICAL_CHECKUP', 'COUNSELING', 'EDUCATION', 'FINANCIAL_AID', 'RESCUE', 'OTHER']),
  date: z.coerce.date(),
  description: z.string().max(5000).optional().nullable(),
  quantity: z.coerce.number().int().positive().optional().nullable(),
  cost: z.coerce.number().positive().optional().nullable(),
  beneficiaryId: z.string().cuid(),
  caseId: z.string().cuid().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

// User validation schema
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FIELD_WORKER', 'VOLUNTEER']),
  organization: z.string().max(100).optional().nullable(),
  phone: malaysianPhoneSchema,
});

export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;
export type CaseInput = z.infer<typeof caseSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type UserInput = z.infer<typeof userSchema>;
