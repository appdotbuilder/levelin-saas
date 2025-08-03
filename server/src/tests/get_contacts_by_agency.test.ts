
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable } from '../db/schema';
import { type CreateAgencyInput, type CreateUserInput, type CreateContactInput } from '../schema';
import { getContactsByAgency } from '../handlers/get_contacts_by_agency';

// Test agency data
const testAgency: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency'
};

// Test user data
const testUser: CreateUserInput = {
  clerk_id: 'clerk_test_user',
  agency_id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'staff'
};

// Test contacts data
const testContact1: CreateContactInput = {
  agency_id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  position: 'CEO',
  tags: ['vip', 'lead'],
  custom_fields: { source: 'referral' },
  created_by: 1
};

const testContact2: CreateContactInput = {
  agency_id: 1,
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: '+0987654321',
  company: 'Tech Solutions',
  position: 'CTO',
  tags: ['prospect'],
  custom_fields: { budget: '10000' },
  created_by: 1
};

const testContact3: CreateContactInput = {
  agency_id: 2,
  first_name: 'Bob',
  last_name: 'Johnson',
  email: 'bob.johnson@example.com',
  tags: [],
  custom_fields: {},
  created_by: 1
};

describe('getContactsByAgency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all contacts for a specific agency', async () => {
    // Create test agency
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create contacts for agency 1
    await db.insert(contactsTable)
      .values([testContact1, testContact2])
      .execute();

    const results = await getContactsByAgency(1);

    expect(results).toHaveLength(2);
    expect(results[0].first_name).toBe('John');
    expect(results[0].last_name).toBe('Doe');
    expect(results[0].email).toBe('john.doe@example.com');
    expect(results[0].agency_id).toBe(1);
    expect(results[0].tags).toEqual(['vip', 'lead']);
    expect(results[0].custom_fields).toEqual({ source: 'referral' });

    expect(results[1].first_name).toBe('Jane');
    expect(results[1].last_name).toBe('Smith');
    expect(results[1].email).toBe('jane.smith@example.com');
    expect(results[1].agency_id).toBe(1);
    expect(results[1].tags).toEqual(['prospect']);
    expect(results[1].custom_fields).toEqual({ budget: '10000' });
  });

  it('should return empty array when agency has no contacts', async () => {
    // Create test agency
    await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const results = await getContactsByAgency(1);

    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should only return contacts for the specified agency', async () => {
    // Create test agencies
    await db.insert(agenciesTable)
      .values([
        testAgency,
        { name: 'Other Agency', subdomain: 'other-agency' }
      ])
      .execute();

    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create contacts for different agencies
    await db.insert(contactsTable)
      .values([
        { ...testContact1, agency_id: 1 },
        { ...testContact2, agency_id: 1 },
        { ...testContact3, agency_id: 2 }
      ])
      .execute();

    const resultsAgency1 = await getContactsByAgency(1);
    const resultsAgency2 = await getContactsByAgency(2);

    expect(resultsAgency1).toHaveLength(2);
    expect(resultsAgency1.every(contact => contact.agency_id === 1)).toBe(true);

    expect(resultsAgency2).toHaveLength(1);
    expect(resultsAgency2[0].agency_id).toBe(2);
    expect(resultsAgency2[0].first_name).toBe('Bob');
  });

  it('should handle contacts with null optional fields', async () => {
    // Create test agency
    await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create minimal contact with required fields
    const minimalContact: CreateContactInput = {
      agency_id: 1,
      first_name: 'Minimal',
      last_name: 'Contact',
      tags: [],
      custom_fields: {},
      created_by: 1
    };

    await db.insert(contactsTable)
      .values(minimalContact)
      .execute();

    const results = await getContactsByAgency(1);

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('Minimal');
    expect(results[0].last_name).toBe('Contact');
    expect(results[0].email).toBeNull();
    expect(results[0].phone).toBeNull();
    expect(results[0].company).toBeNull();
    expect(results[0].position).toBeNull();
    expect(results[0].tags).toEqual([]);
    expect(results[0].custom_fields).toEqual({});
  });
});
