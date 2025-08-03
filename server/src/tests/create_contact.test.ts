
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable } from '../db/schema';
import { type CreateContactInput } from '../schema';
import { createContact } from '../handlers/create_contact';
import { eq } from 'drizzle-orm';

// Test data setup
const createTestAgency = async () => {
  const result = await db.insert(agenciesTable)
    .values({
      name: 'Test Agency',
      subdomain: 'test-agency'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestUser = async (agency_id: number) => {
  const result = await db.insert(usersTable)
    .values({
      clerk_id: 'test-clerk-id',
      agency_id,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'staff'
    })
    .returning()
    .execute();
  return result[0];
};

describe('createContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact with all fields', async () => {
    // Setup prerequisites
    const agency = await createTestAgency();
    const user = await createTestUser(agency.id);

    const testInput: CreateContactInput = {
      agency_id: agency.id,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      position: 'CEO',
      tags: ['vip', 'lead'],
      custom_fields: { source: 'website', budget: 50000 },
      created_by: user.id
    };

    const result = await createContact(testInput);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.agency_id).toEqual(agency.id);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.company).toEqual('Acme Corp');
    expect(result.position).toEqual('CEO');
    expect(result.tags).toEqual(['vip', 'lead']);
    expect(result.custom_fields).toEqual({ source: 'website', budget: 50000 });
    expect(result.created_by).toEqual(user.id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a contact with minimal required fields', async () => {
    // Setup prerequisites
    const agency = await createTestAgency();
    const user = await createTestUser(agency.id);

    const testInput: CreateContactInput = {
      agency_id: agency.id,
      first_name: 'Jane',
      last_name: 'Smith',
      created_by: user.id,
      tags: [],
      custom_fields: {}
    };

    const result = await createContact(testInput);

    expect(result.id).toBeDefined();
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.company).toBeNull();
    expect(result.position).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.custom_fields).toEqual({});
  });

  it('should save contact to database correctly', async () => {
    // Setup prerequisites
    const agency = await createTestAgency();
    const user = await createTestUser(agency.id);

    const testInput: CreateContactInput = {
      agency_id: agency.id,
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob@example.com',
      tags: ['important'],
      custom_fields: { notes: 'Test contact' },
      created_by: user.id
    };

    const result = await createContact(testInput);

    // Verify in database
    const contacts = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, result.id))
      .execute();

    expect(contacts).toHaveLength(1);
    const dbContact = contacts[0];
    expect(dbContact.first_name).toEqual('Bob');
    expect(dbContact.last_name).toEqual('Johnson');
    expect(dbContact.email).toEqual('bob@example.com');
    expect(dbContact.tags).toEqual(['important']);
    expect(dbContact.custom_fields).toEqual({ notes: 'Test contact' });
    expect(dbContact.agency_id).toEqual(agency.id);
    expect(dbContact.created_by).toEqual(user.id);
  });

  it('should handle complex custom fields and tags', async () => {
    // Setup prerequisites
    const agency = await createTestAgency();
    const user = await createTestUser(agency.id);

    const complexCustomFields = {
      preferences: { newsletter: true, sms: false },
      history: [{ date: '2024-01-01', action: 'signup' }],
      score: 85.5,
      metadata: { utm_source: 'google', utm_campaign: 'winter2024' }
    };

    const testInput: CreateContactInput = {
      agency_id: agency.id,
      first_name: 'Alice',
      last_name: 'Wonder',
      tags: ['premium', 'tech-savvy', 'early-adopter'],
      custom_fields: complexCustomFields,
      created_by: user.id
    };

    const result = await createContact(testInput);

    expect(result.tags).toEqual(['premium', 'tech-savvy', 'early-adopter']);
    expect(result.custom_fields).toEqual(complexCustomFields);

    // Verify JSON fields are stored correctly in database
    const dbContact = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, result.id))
      .execute();

    expect(dbContact[0].custom_fields).toEqual(complexCustomFields);
  });

  it('should throw error for invalid foreign key references', async () => {
    const testInput: CreateContactInput = {
      agency_id: 99999, // Non-existent agency
      first_name: 'Test',
      last_name: 'Contact',
      tags: [],
      custom_fields: {},
      created_by: 99999 // Non-existent user
    };

    await expect(createContact(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
