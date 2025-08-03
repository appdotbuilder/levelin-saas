
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable } from '../db/schema';
import { type CreateAgencyInput, type CreateUserInput, type CreateContactInput } from '../schema';
import { searchContacts } from '../handlers/search_contacts';

// Test data
const testAgency: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency'
};

const testUser: CreateUserInput = {
  clerk_id: 'clerk_123',
  agency_id: 1, // Will be updated after agency creation
  email: 'user@test.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'staff'
};

const testContacts: CreateContactInput[] = [
  {
    agency_id: 1, // Will be updated after agency creation
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    position: 'Manager',
    tags: ['vip', 'enterprise'],
    custom_fields: { source: 'website' },
    created_by: 1 // Will be updated after user creation
  },
  {
    agency_id: 1,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@techcorp.com',
    phone: '+0987654321',
    company: 'TechCorp',
    position: 'Developer',
    tags: ['technical'],
    custom_fields: { source: 'referral' },
    created_by: 1
  },
  {
    agency_id: 1,
    first_name: 'Bob',
    last_name: 'Wilson',
    email: 'bob@startup.io',
    phone: null,
    company: 'Startup Inc',
    position: 'CEO',
    tags: [],
    custom_fields: {},
    created_by: 1
  }
];

describe('searchContacts', () => {
  let agencyId: number;
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test agency
    const agencyResult = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();
    agencyId = agencyResult[0].id;
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        agency_id: agencyId
      })
      .returning()
      .execute();
    userId = userResult[0].id;
    
    // Create test contacts
    await db.insert(contactsTable)
      .values(testContacts.map(contact => ({
        ...contact,
        agency_id: agencyId,
        created_by: userId
      })))
      .execute();
  });

  afterEach(resetDB);

  it('should search contacts by first name', async () => {
    const results = await searchContacts(agencyId, 'jane');
    
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
    expect(results[0].last_name).toEqual('Smith');
    expect(results[0].agency_id).toEqual(agencyId);
  });

  it('should search contacts by last name', async () => {
    const results = await searchContacts(agencyId, 'smith');
    
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
    expect(results[0].last_name).toEqual('Smith');
  });

  it('should search contacts by email', async () => {
    const results = await searchContacts(agencyId, 'john.doe@example');
    
    expect(results).toHaveLength(1);
    expect(results[0].email).toEqual('john.doe@example.com');
  });

  it('should search contacts by phone', async () => {
    const results = await searchContacts(agencyId, '1234567890');
    
    expect(results).toHaveLength(1);
    expect(results[0].phone).toEqual('+1234567890');
  });

  it('should search contacts by company', async () => {
    const results = await searchContacts(agencyId, 'acme');
    
    expect(results).toHaveLength(1);
    expect(results[0].company).toEqual('Acme Corp');
  });

  it('should search contacts by position', async () => {
    const results = await searchContacts(agencyId, 'developer');
    
    expect(results).toHaveLength(1);
    expect(results[0].position).toEqual('Developer');
  });

  it('should return multiple matches for partial search', async () => {
    const results = await searchContacts(agencyId, 'corp');
    
    expect(results).toHaveLength(2);
    const companies = results.map(r => r.company).sort();
    expect(companies).toEqual(['Acme Corp', 'TechCorp']);
  });

  it('should be case insensitive', async () => {
    const results = await searchContacts(agencyId, 'JANE');
    
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
  });

  it('should return empty array for no matches', async () => {
    const results = await searchContacts(agencyId, 'nonexistent');
    
    expect(results).toHaveLength(0);
  });

  it('should only return contacts from specified agency', async () => {
    // Create another agency with contacts
    const otherAgencyResult = await db.insert(agenciesTable)
      .values({
        name: 'Other Agency',
        subdomain: 'other-agency'
      })
      .returning()
      .execute();
    const otherAgencyId = otherAgencyResult[0].id;
    
    const otherUserResult = await db.insert(usersTable)
      .values({
        clerk_id: 'clerk_456',
        agency_id: otherAgencyId,
        email: 'other@test.com',
        first_name: 'Other',
        last_name: 'User',
        role: 'staff'
      })
      .returning()
      .execute();
    
    await db.insert(contactsTable)
      .values({
        agency_id: otherAgencyId,
        first_name: 'Jane',
        last_name: 'Other',
        email: 'jane.other@example.com',
        tags: [],
        custom_fields: {},
        created_by: otherUserResult[0].id
      })
      .execute();
    
    // Search should only return contacts from the specified agency
    const results = await searchContacts(agencyId, 'jane');
    
    expect(results).toHaveLength(1);
    expect(results[0].agency_id).toEqual(agencyId);
    expect(results[0].last_name).toEqual('Smith');
  });

  it('should handle empty search query', async () => {
    const results = await searchContacts(agencyId, '');
    
    // Empty query should match all contacts due to '%' wildcard
    expect(results).toHaveLength(3);
  });

  it('should search across multiple fields simultaneously', async () => {
    const results = await searchContacts(agencyId, 'doe');
    
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('John');
    expect(results[0].last_name).toEqual('Doe');
  });
});
