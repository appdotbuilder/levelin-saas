
import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['super-admin', 'agency-owner', 'staff', 'client']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Deal stages enum
export const dealStageSchema = z.enum(['lead', 'qualified', 'proposal', 'won', 'lost']);
export type DealStage = z.infer<typeof dealStageSchema>;

// Landing page status enum
export const landingPageStatusSchema = z.enum(['draft', 'published', 'archived']);
export type LandingPageStatus = z.infer<typeof landingPageStatusSchema>;

// Agency schema
export const agencySchema = z.object({
  id: z.number(),
  name: z.string(),
  subdomain: z.string(),
  logo_url: z.string().nullable(),
  favicon_url: z.string().nullable(),
  primary_color: z.string().nullable(),
  secondary_color: z.string().nullable(),
  smtp_host: z.string().nullable(),
  smtp_port: z.number().nullable(),
  smtp_username: z.string().nullable(),
  smtp_password: z.string().nullable(),
  custom_domain: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Agency = z.infer<typeof agencySchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  clerk_id: z.string(),
  agency_id: z.number(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleSchema,
  avatar_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Contact schema
export const contactSchema = z.object({
  id: z.number(),
  agency_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  position: z.string().nullable(),
  tags: z.array(z.string()),
  custom_fields: z.record(z.string(), z.any()),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Contact = z.infer<typeof contactSchema>;

// Deal schema
export const dealSchema = z.object({
  id: z.number(),
  agency_id: z.number(),
  contact_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  value: z.number().nullable(),
  stage: dealStageSchema,
  probability: z.number().int().min(0).max(100),
  expected_close_date: z.coerce.date().nullable(),
  assigned_to: z.number().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Deal = z.infer<typeof dealSchema>;

// Landing page schema
export const landingPageSchema = z.object({
  id: z.number(),
  agency_id: z.number(),
  title: z.string(),
  slug: z.string(),
  template_id: z.string(),
  content: z.record(z.string(), z.any()),
  status: landingPageStatusSchema,
  custom_domain: z.string().nullable(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  published_at: z.coerce.date().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type LandingPage = z.infer<typeof landingPageSchema>;

// Contact interaction schema
export const contactInteractionSchema = z.object({
  id: z.number(),
  contact_id: z.number(),
  agency_id: z.number(),
  type: z.enum(['email', 'call', 'meeting', 'note', 'task']),
  title: z.string(),
  description: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).nullable(),
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type ContactInteraction = z.infer<typeof contactInteractionSchema>;

// Input schemas for creating entities
export const createAgencyInputSchema = z.object({
  name: z.string().min(1),
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/),
  logo_url: z.string().url().nullable().optional(),
  favicon_url: z.string().url().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  smtp_host: z.string().nullable().optional(),
  smtp_port: z.number().int().min(1).max(65535).nullable().optional(),
  smtp_username: z.string().nullable().optional(),
  smtp_password: z.string().nullable().optional(),
  custom_domain: z.string().nullable().optional()
});

export type CreateAgencyInput = z.infer<typeof createAgencyInputSchema>;

export const createUserInputSchema = z.object({
  clerk_id: z.string().min(1),
  agency_id: z.number().int().positive(),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: userRoleSchema,
  avatar_url: z.string().url().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createContactInputSchema = z.object({
  agency_id: z.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.string(), z.any()).default({}),
  created_by: z.number().int().positive()
});

export type CreateContactInput = z.infer<typeof createContactInputSchema>;

export const createDealInputSchema = z.object({
  agency_id: z.number().int().positive(),
  contact_id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  value: z.number().positive().nullable().optional(),
  stage: dealStageSchema.default('lead'),
  probability: z.number().int().min(0).max(100).default(0),
  expected_close_date: z.coerce.date().nullable().optional(),
  assigned_to: z.number().int().positive().nullable().optional(),
  created_by: z.number().int().positive()
});

export type CreateDealInput = z.infer<typeof createDealInputSchema>;

export const createLandingPageInputSchema = z.object({
  agency_id: z.number().int().positive(),
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  template_id: z.string().min(1),
  content: z.record(z.string(), z.any()).default({}),
  custom_domain: z.string().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  created_by: z.number().int().positive()
});

export type CreateLandingPageInput = z.infer<typeof createLandingPageInputSchema>;

export const createContactInteractionInputSchema = z.object({
  contact_id: z.number().int().positive(),
  agency_id: z.number().int().positive(),
  type: z.enum(['email', 'call', 'meeting', 'note', 'task']),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  created_by: z.number().int().positive()
});

export type CreateContactInteractionInput = z.infer<typeof createContactInteractionInputSchema>;

// Update schemas
export const updateAgencyInputSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  logo_url: z.string().url().nullable().optional(),
  favicon_url: z.string().url().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  smtp_host: z.string().nullable().optional(),
  smtp_port: z.number().int().min(1).max(65535).nullable().optional(),
  smtp_username: z.string().nullable().optional(),
  smtp_password: z.string().nullable().optional(),
  custom_domain: z.string().nullable().optional()
});

export type UpdateAgencyInput = z.infer<typeof updateAgencyInputSchema>;

export const updateContactInputSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.string(), z.any()).optional()
});

export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

export const updateDealInputSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  value: z.number().positive().nullable().optional(),
  stage: dealStageSchema.optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expected_close_date: z.coerce.date().nullable().optional(),
  assigned_to: z.number().int().positive().nullable().optional()
});

export type UpdateDealInput = z.infer<typeof updateDealInputSchema>;
