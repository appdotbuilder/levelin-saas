
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable } from '../db/schema';
import { type UpdateContactInput, type CreateAgencyInput, type CreateUserInput, type CreateContactInput } from '../schema';
import { updateContact } from '../handlers/update_contact';
import { eq } from 'drizzle-orm';

// Test data
const testAgency: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency'
};

const testUser: CreateUserInput = {
  clerk_id: 'test_clerk_123',
  agency_id: 1, // Will be set after agency creation
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'staff'
};

const testContact: CreateContactInput = {
  agency_id: 1, // Will be set after agency creation
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  position: 'Manager',
  tags: ['vip', 'lead'],
  custom_fields: { source: 'website', budget: '10000' },
  created_by: 1 // Will be set after user creation
};

describe('updateContact', () => {
  let contactId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create agency
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    // Create user
    const user = await db.insert(usersTable)
      .values({
        ...testUser,
        agency_id: agency[0].id
      })
      .returning()
      .execute();

    // Create contact
    const contact = await db.insert(contactsTable)
      .values({
        ...testContact,
        agency_id: agency[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    contactId = contact[0].id;
  });

  afterEach(resetDB);

  it('should update contact basic information', async () => {
    const updateInput: UpdateContactInput = {
      id: contactId,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com'
    };

    const result = await updateContact(updateInput);

    expect(result.id).toEqual(contactId);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('+1234567890'); // Should remain unchanged
    expect(result.company).toEqual('Acme Corp'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update contact tags and custom fields', async () => {
    const updateInput: UpdateContactInput = {
      id: contactId,
      tags: ['premium', 'priority'],
      custom_fields: { source: 'referral', budget: '25000', notes: 'Important client' }
    };

    const result = await updateContact(updateInput);

    expect(result.id).toEqual(contactId);
    expect(result.tags).toEqual(['premium', 'priority']);
    expect(result.custom_fields).toEqual({
      source: 'referral',
      budget: '25000',
      notes: 'Important client'
    });
    expect(result.first_name).toEqual('John'); // Should remain unchanged
    expect(result.last_name).toEqual('Doe'); // Should remain unchanged
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateContactInput = {
      id: contactId,
      email: null,
      phone: null,
      company: null,
      position: null
    };

    const result = await updateContact(updateInput);

    expect(result.id).toEqual(contactId);
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.company).toBeNull();
    expect(result.position).toBeNull();
    expect(result.first_name).toEqual('John'); // Should remain unchanged
    expect(result.last_name).toEqual('Doe'); // Should remain unchanged
  });

  it('should save updated contact to database', async () => {
    const updateInput: UpdateContactInput = {
      id: contactId,
      first_name: 'Updated',
      company: 'New Company',
      tags: ['updated'],
      custom_fields: { status: 'active' }
    };

    await updateContact(updateInput);

    // Verify in database
    const contacts = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, contactId))
      .execute();

    expect(contacts).toHaveLength(1);
    const savedContact = contacts[0];
    expect(savedContact.first_name).toEqual('Updated');
    expect(savedContact.company).toEqual('New Company');
    expect(savedContact.tags).toEqual(['updated']);
    expect(savedContact.custom_fields).toEqual({ status: 'active' });
    expect(savedContact.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent contact', async () => {
    const updateInput: UpdateContactInput = {
      id: 99999,
      first_name: 'Test'
    };

    expect(updateContact(updateInput)).rejects.toThrow(/Contact with id 99999 not found/i);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateContactInput = {
      id: contactId,
      first_name: 'Partial'
    };

    const result = await updateContact(updateInput);

    expect(result.first_name).toEqual('Partial');
    expect(result.last_name).toEqual('Doe'); // Should remain unchanged
    expect(result.email).toEqual('john.doe@example.com'); // Should remain unchanged
    expect(result.tags).toEqual(['vip', 'lead']); // Should remain unchanged
    expect(result.custom_fields).toEqual({ source: 'website', budget: '10000' }); // Should remain unchanged
  });
});
