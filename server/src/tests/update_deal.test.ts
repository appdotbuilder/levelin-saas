
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable, dealsTable } from '../db/schema';
import { type UpdateDealInput, type CreateAgencyInput, type CreateUserInput, type CreateContactInput, type CreateDealInput } from '../schema';
import { updateDeal } from '../handlers/update_deal';
import { eq } from 'drizzle-orm';

// Test data
const testAgency: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency'
};

const testUser: CreateUserInput = {
  clerk_id: 'clerk_test_user',
  agency_id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'staff'
};

const testContact: CreateContactInput = {
  agency_id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  tags: [],
  custom_fields: {},
  created_by: 1
};

const testDeal: CreateDealInput = {
  agency_id: 1,
  contact_id: 1,
  title: 'Original Deal',
  description: 'Original description',
  value: 1000.00,
  stage: 'lead',
  probability: 25,
  expected_close_date: new Date('2024-12-31'),
  assigned_to: 1,
  created_by: 1
};

describe('updateDeal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create prerequisite data
    await db.insert(agenciesTable).values(testAgency).execute();
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(contactsTable).values(testContact).execute();
    await db.insert(dealsTable).values({
      ...testDeal,
      value: testDeal.value?.toString() || null,
      expected_close_date: testDeal.expected_close_date?.toISOString().split('T')[0] || null
    }).execute();
  });

  it('should update deal with all fields', async () => {
    const updateInput: UpdateDealInput = {
      id: 1,
      title: 'Updated Deal Title',
      description: 'Updated description',
      value: 2500.50,
      stage: 'proposal',
      probability: 75,
      expected_close_date: new Date('2025-01-15'),
      assigned_to: null
    };

    const result = await updateDeal(updateInput);

    expect(result.id).toEqual(1);
    expect(result.title).toEqual('Updated Deal Title');
    expect(result.description).toEqual('Updated description');
    expect(result.value).toEqual(2500.50);
    expect(typeof result.value).toEqual('number');
    expect(result.stage).toEqual('proposal');
    expect(result.probability).toEqual(75);
    expect(result.expected_close_date).toEqual(new Date('2025-01-15'));
    expect(result.assigned_to).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateDealInput = {
      id: 1,
      title: 'Partially Updated Title',
      stage: 'qualified'
    };

    const result = await updateDeal(updateInput);

    expect(result.title).toEqual('Partially Updated Title');
    expect(result.stage).toEqual('qualified');
    // Original values should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.value).toEqual(1000.00);
    expect(result.probability).toEqual(25);
    expect(result.assigned_to).toEqual(1);
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateDealInput = {
      id: 1,
      title: 'Database Update Test',
      value: 3000.75,
      stage: 'won',
      probability: 100
    };

    await updateDeal(updateInput);

    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, 1))
      .execute();

    expect(deals).toHaveLength(1);
    expect(deals[0].title).toEqual('Database Update Test');
    expect(parseFloat(deals[0].value!)).toEqual(3000.75);
    expect(deals[0].stage).toEqual('won');
    expect(deals[0].probability).toEqual(100);
    expect(deals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values correctly', async () => {
    const updateInput: UpdateDealInput = {
      id: 1,
      description: null,
      value: null,
      expected_close_date: null,
      assigned_to: null
    };

    const result = await updateDeal(updateInput);

    expect(result.description).toBeNull();
    expect(result.value).toBeNull();
    expect(result.expected_close_date).toBeNull();
    expect(result.assigned_to).toBeNull();
  });

  it('should throw error for non-existent deal', async () => {
    const updateInput: UpdateDealInput = {
      id: 999,
      title: 'Non-existent Deal'
    };

    expect(updateDeal(updateInput)).rejects.toThrow(/deal with id 999 not found/i);
  });

  it('should handle stage transitions correctly', async () => {
    // Test moving through pipeline stages
    const stages = ['qualified', 'proposal', 'won'] as const;
    
    for (const stage of stages) {
      const updateInput: UpdateDealInput = {
        id: 1,
        stage: stage,
        probability: stage === 'won' ? 100 : 50
      };

      const result = await updateDeal(updateInput);
      expect(result.stage).toEqual(stage);
      expect(result.probability).toEqual(stage === 'won' ? 100 : 50);
    }
  });

  it('should handle date conversions correctly', async () => {
    const testDate = new Date('2025-03-15');
    const updateInput: UpdateDealInput = {
      id: 1,
      expected_close_date: testDate
    };

    const result = await updateDeal(updateInput);

    expect(result.expected_close_date).toEqual(testDate);
    expect(result.expected_close_date).toBeInstanceOf(Date);

    // Verify date is stored correctly in database
    const deals = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, 1))
      .execute();

    expect(deals[0].expected_close_date).toEqual('2025-03-15');
  });
});
