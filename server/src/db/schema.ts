
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  boolean, 
  json, 
  pgEnum,
  numeric,
  date
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['super-admin', 'agency-owner', 'staff', 'client']);
export const dealStageEnum = pgEnum('deal_stage', ['lead', 'qualified', 'proposal', 'won', 'lost']);
export const landingPageStatusEnum = pgEnum('landing_page_status', ['draft', 'published', 'archived']);
export const interactionTypeEnum = pgEnum('interaction_type', ['email', 'call', 'meeting', 'note', 'task']);

// Agencies table
export const agenciesTable = pgTable('agencies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  logo_url: text('logo_url'),
  favicon_url: text('favicon_url'),
  primary_color: text('primary_color'),
  secondary_color: text('secondary_color'),
  smtp_host: text('smtp_host'),
  smtp_port: integer('smtp_port'),
  smtp_username: text('smtp_username'),
  smtp_password: text('smtp_password'),
  custom_domain: text('custom_domain'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  clerk_id: text('clerk_id').notNull().unique(),
  agency_id: integer('agency_id').notNull().references(() => agenciesTable.id),
  email: text('email').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: userRoleEnum('role').notNull(),
  avatar_url: text('avatar_url'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Contacts table
export const contactsTable = pgTable('contacts', {
  id: serial('id').primaryKey(),
  agency_id: integer('agency_id').notNull().references(() => agenciesTable.id),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  position: text('position'),
  tags: json('tags').$type<string[]>().default([]).notNull(),
  custom_fields: json('custom_fields').$type<Record<string, any>>().default({}).notNull(),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Deals table
export const dealsTable = pgTable('deals', {
  id: serial('id').primaryKey(),
  agency_id: integer('agency_id').notNull().references(() => agenciesTable.id),
  contact_id: integer('contact_id').notNull().references(() => contactsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  value: numeric('value', { precision: 12, scale: 2 }),
  stage: dealStageEnum('stage').notNull().default('lead'),
  probability: integer('probability').notNull().default(0),
  expected_close_date: date('expected_close_date'),
  assigned_to: integer('assigned_to').references(() => usersTable.id),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Landing pages table
export const landingPagesTable = pgTable('landing_pages', {
  id: serial('id').primaryKey(),
  agency_id: integer('agency_id').notNull().references(() => agenciesTable.id),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  template_id: text('template_id').notNull(),
  content: json('content').$type<Record<string, any>>().default({}).notNull(),
  status: landingPageStatusEnum('status').notNull().default('draft'),
  custom_domain: text('custom_domain'),
  meta_title: text('meta_title'),
  meta_description: text('meta_description'),
  published_at: timestamp('published_at'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Contact interactions table
export const contactInteractionsTable = pgTable('contact_interactions', {
  id: serial('id').primaryKey(),
  contact_id: integer('contact_id').notNull().references(() => contactsTable.id),
  agency_id: integer('agency_id').notNull().references(() => agenciesTable.id),
  type: interactionTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  metadata: json('metadata').$type<Record<string, any>>(),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const agenciesRelations = relations(agenciesTable, ({ many }) => ({
  users: many(usersTable),
  contacts: many(contactsTable),
  deals: many(dealsTable),
  landingPages: many(landingPagesTable),
  interactions: many(contactInteractionsTable)
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  agency: one(agenciesTable, {
    fields: [usersTable.agency_id],
    references: [agenciesTable.id]
  }),
  createdContacts: many(contactsTable),
  createdDeals: many(dealsTable),
  assignedDeals: many(dealsTable),
  createdLandingPages: many(landingPagesTable),
  createdInteractions: many(contactInteractionsTable)
}));

export const contactsRelations = relations(contactsTable, ({ one, many }) => ({
  agency: one(agenciesTable, {
    fields: [contactsTable.agency_id],
    references: [agenciesTable.id]
  }),
  createdBy: one(usersTable, {
    fields: [contactsTable.created_by],
    references: [usersTable.id]
  }),
  deals: many(dealsTable),
  interactions: many(contactInteractionsTable)
}));

export const dealsRelations = relations(dealsTable, ({ one }) => ({
  agency: one(agenciesTable, {
    fields: [dealsTable.agency_id],
    references: [agenciesTable.id]
  }),
  contact: one(contactsTable, {
    fields: [dealsTable.contact_id],
    references: [contactsTable.id]
  }),
  assignedTo: one(usersTable, {
    fields: [dealsTable.assigned_to],
    references: [usersTable.id]
  }),
  createdBy: one(usersTable, {
    fields: [dealsTable.created_by],
    references: [usersTable.id]
  })
}));

export const landingPagesRelations = relations(landingPagesTable, ({ one }) => ({
  agency: one(agenciesTable, {
    fields: [landingPagesTable.agency_id],
    references: [agenciesTable.id]
  }),
  createdBy: one(usersTable, {
    fields: [landingPagesTable.created_by],
    references: [usersTable.id]
  })
}));

export const contactInteractionsRelations = relations(contactInteractionsTable, ({ one }) => ({
  contact: one(contactsTable, {
    fields: [contactInteractionsTable.contact_id],
    references: [contactsTable.id]
  }),
  agency: one(agenciesTable, {
    fields: [contactInteractionsTable.agency_id],
    references: [agenciesTable.id]
  }),
  createdBy: one(usersTable, {
    fields: [contactInteractionsTable.created_by],
    references: [usersTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  agencies: agenciesTable,
  users: usersTable,
  contacts: contactsTable,
  deals: dealsTable,
  landingPages: landingPagesTable,
  contactInteractions: contactInteractionsTable
};
