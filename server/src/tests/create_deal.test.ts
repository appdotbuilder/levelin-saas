
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable, dealsTable } from '../db/schema';
import { type CreateDealInput } from '../schema';
import { createDeal } from '../handlers/create_deal';
import { eq } from 'drizzle-orm';

// Test data setup
const testAgency = {
  name: 'Test Agency',
  subdomain: 'test-agency'
};

const testUser = {
  clerk_id: 'clerk_123',
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'staff' as const
};

const testContact = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  tags: [],
  custom_fields: {}
};

describe('createDeal', () => {
  let agencyId: number;
  let userId: number;
  let contactId: number;

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

    // Create test contact
    const contactResult = await db.insert(contactsTable)
      .values({
        ...testContact,
        agency_id: agencyId,
        created_by: userId
      })
      .returning()
      .execute();
    contactId = contactResult[0].id;
  });

  afterEach(resetDB);

  it('should create a deal with all fields', async () => {
    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: contactId,
      title: 'Test Deal',
      description: 'A test deal description',
      value: 5000.50,
      stage: 'qualified',
      probability: 75,
      expected_close_date: new Date('2024-12-31'),
      assigned_to: userId,
      created_by: userId
    };

    const result = await createDeal(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Deal');
    expect(result.description).toEqual('A test deal description');
    expect(result.value).toEqual(5000.50);
    expect(typeof result.value).toBe('number');
    expect(result.stage).toEqual('qualified');
    expect(result.probability).toEqual(75);
    expect(result.expected_close_date).toEqual(new Date('2024-12-31'));
    expect(result.assigned_to).toEqual(userId);
    expect(result.created_by).toEqual(userId);
    expect(result.agency_id).toEqual(agencyId);
    expect(result.contact_id).toEqual(contactId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a deal with minimal fields using defaults', async () => {
    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: contactId,
      title: 'Minimal Deal',
      stage: 'lead',
      probability: 0,
      created_by: userId
    };

    const result = await createDeal(testInput);

    expect(result.title).toEqual('Minimal Deal');
    expect(result.description).toBeNull();
    expect(result.value).toBeNull();
    expect(result.stage).toEqual('lead');
    expect(result.probability).toEqual(0);
    expect(result.expected_close_date).toBeNull();
    expect(result.assigned_to).toBeNull();
    expect(result.created_by).toEqual(userId);
  });

  it('should save deal to database', async () => {
    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: contactId,
      title: 'Database Test Deal',
      value: 1234.56,
      stage: 'lead',
      probability: 0,
      created_by: userId
    };

    const result = await createDeal(testInput);

    // Query using proper drizzle syntax
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, result.id))
      .execute();

    expect(deals).toHaveLength(1);
    expect(deals[0].title).toEqual('Database Test Deal');
    expect(parseFloat(deals[0].value!)).toEqual(1234.56);
    expect(deals[0].agency_id).toEqual(agencyId);
    expect(deals[0].contact_id).toEqual(contactId);
    expect(deals[0].created_at).toBeInstanceOf(Date);
    expect(deals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent agency', async () => {
    const testInput: CreateDealInput = {
      agency_id: 99999,
      contact_id: contactId,
      title: 'Invalid Agency Deal',
      stage: 'lead',
      probability: 0,
      created_by: userId
    };

    await expect(createDeal(testInput)).rejects.toThrow(/Agency with id 99999 not found/i);
  });

  it('should throw error for non-existent contact', async () => {
    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: 99999,
      title: 'Invalid Contact Deal',
      stage: 'lead',
      probability: 0,
      created_by: userId
    };

    await expect(createDeal(testInput)).rejects.toThrow(/Contact with id 99999 not found/i);
  });

  it('should throw error for non-existent created_by user', async () => {
    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: contactId,
      title: 'Invalid Creator Deal',
      stage: 'lead',
      probability: 0,
      created_by: 99999
    };

    await expect(createDeal(testInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should throw error for non-existent assigned_to user', async () => {
    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: contactId,
      title: 'Invalid Assignment Deal',
      stage: 'lead',
      probability: 0,
      assigned_to: 99999,
      created_by: userId
    };

    await expect(createDeal(testInput)).rejects.toThrow(/Assigned user with id 99999 not found/i);
  });

  it('should throw error when contact belongs to different agency', async () => {
    // Create another agency and contact
    const otherAgencyResult = await db.insert(agenciesTable)
      .values({
        name: 'Other Agency',
        subdomain: 'other-agency'
      })
      .returning()
      .execute();

    const otherContactResult = await db.insert(contactsTable)
      .values({
        ...testContact,
        agency_id: otherAgencyResult[0].id,
        created_by: userId
      })
      .returning()
      .execute();

    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: otherContactResult[0].id,
      title: 'Cross Agency Deal',
      stage: 'lead',
      probability: 0,
      created_by: userId
    };

    await expect(createDeal(testInput)).rejects.toThrow(/Contact .* does not belong to agency/i);
  });

  it('should throw error when created_by user belongs to different agency', async () => {
    // Create another agency and user
    const otherAgencyResult = await db.insert(agenciesTable)
      .values({
        name: 'Other Agency',
        subdomain: 'other-agency'
      })
      .returning()
      .execute();

    const otherUserResult = await db.insert(usersTable)
      .values({
        ...testUser,
        clerk_id: 'clerk_456',
        email: 'other@example.com',
        agency_id: otherAgencyResult[0].id
      })
      .returning()
      .execute();

    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: contactId,
      title: 'Cross Agency Creator Deal',
      stage: 'lead',
      probability: 0,
      created_by: otherUserResult[0].id
    };

    await expect(createDeal(testInput)).rejects.toThrow(/User .* does not belong to agency/i);
  });

  it('should throw error when assigned_to user belongs to different agency', async () => {
    // Create another agency and user
    const otherAgencyResult = await db.insert(agenciesTable)
      .values({
        name: 'Other Agency',
        subdomain: 'other-agency'
      })
      .returning()
      .execute();

    const otherUserResult = await db.insert(usersTable)
      .values({
        ...testUser,
        clerk_id: 'clerk_789',
        email: 'assigned@example.com',
        agency_id: otherAgencyResult[0].id
      })
      .returning()
      .execute();

    const testInput: CreateDealInput = {
      agency_id: agencyId,
      contact_id: contactId,
      title: 'Cross Agency Assignment Deal',
      stage: 'lead',
      probability: 0,
      assigned_to: otherUserResult[0].id,
      created_by: userId
    };

    await expect(createDeal(testInput)).rejects.toThrow(/Assigned user .* does not belong to agency/i);
  });
});
