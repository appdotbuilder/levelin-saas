
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable, dealsTable } from '../db/schema';
import { getDealsByAgency } from '../handlers/get_deals_by_agency';
import { eq } from 'drizzle-orm';

describe('getDealsByAgency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return deals for a specific agency', async () => {
    // Create test agency
    const agency = await db.insert(agenciesTable)
      .values({
        name: 'Test Agency',
        subdomain: 'test-agency'
      })
      .returning()
      .execute();

    // Create test user
    const user = await db.insert(usersTable)
      .values({
        clerk_id: 'user_123',
        agency_id: agency[0].id,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create test contact
    const contact = await db.insert(contactsTable)
      .values({
        agency_id: agency[0].id,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create test deals - use string format for date column
    const closeDateString = '2024-06-15';
    await db.insert(dealsTable)
      .values([
        {
          agency_id: agency[0].id,
          contact_id: contact[0].id,
          title: 'Deal 1',
          description: 'First test deal',
          value: '1500.50',
          stage: 'lead',
          probability: 25,
          expected_close_date: closeDateString,
          created_by: user[0].id
        },
        {
          agency_id: agency[0].id,
          contact_id: contact[0].id,
          title: 'Deal 2',
          description: 'Second test deal',
          value: '2000.00',
          stage: 'qualified',
          probability: 50,
          expected_close_date: null,
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getDealsByAgency(agency[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Deal 1');
    expect(result[0].description).toEqual('First test deal');
    expect(result[0].value).toEqual(1500.50);
    expect(typeof result[0].value).toBe('number');
    expect(result[0].stage).toEqual('lead');
    expect(result[0].probability).toEqual(25);
    expect(result[0].agency_id).toEqual(agency[0].id);
    expect(result[0].contact_id).toEqual(contact[0].id);
    expect(result[0].created_by).toEqual(user[0].id);
    expect(result[0].expected_close_date).toBeInstanceOf(Date);
    expect(result[0].expected_close_date?.toISOString().slice(0, 10)).toEqual('2024-06-15');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Deal 2');
    expect(result[1].value).toEqual(2000.00);
    expect(typeof result[1].value).toBe('number');
    expect(result[1].stage).toEqual('qualified');
    expect(result[1].probability).toEqual(50);
    expect(result[1].expected_close_date).toBeNull();
  });

  it('should return empty array when no deals exist for agency', async () => {
    // Create test agency
    const agency = await db.insert(agenciesTable)
      .values({
        name: 'Empty Agency',
        subdomain: 'empty-agency'
      })
      .returning()
      .execute();

    const result = await getDealsByAgency(agency[0].id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle deals with null values correctly', async () => {
    // Create test agency
    const agency = await db.insert(agenciesTable)
      .values({
        name: 'Test Agency',
        subdomain: 'test-agency'
      })
      .returning()
      .execute();

    // Create test user
    const user = await db.insert(usersTable)
      .values({
        clerk_id: 'user_123',
        agency_id: agency[0].id,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create test contact
    const contact = await db.insert(contactsTable)
      .values({
        agency_id: agency[0].id,
        first_name: 'Jane',
        last_name: 'Smith',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create deal with null value and null expected_close_date
    await db.insert(dealsTable)
      .values({
        agency_id: agency[0].id,
        contact_id: contact[0].id,
        title: 'Deal with null value',
        value: null,
        stage: 'lead',
        probability: 0,
        expected_close_date: null,
        created_by: user[0].id
      })
      .execute();

    const result = await getDealsByAgency(agency[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Deal with null value');
    expect(result[0].value).toBeNull();
    expect(result[0].expected_close_date).toBeNull();
    expect(result[0].stage).toEqual('lead');
    expect(result[0].probability).toEqual(0);
  });

  it('should only return deals for the specified agency', async () => {
    // Create two test agencies
    const agency1 = await db.insert(agenciesTable)
      .values({
        name: 'Agency 1',
        subdomain: 'agency-1'
      })
      .returning()
      .execute();

    const agency2 = await db.insert(agenciesTable)
      .values({
        name: 'Agency 2',
        subdomain: 'agency-2'
      })
      .returning()
      .execute();

    // Create users for both agencies
    const user1 = await db.insert(usersTable)
      .values({
        clerk_id: 'user_1',
        agency_id: agency1[0].id,
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
        role: 'staff'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        clerk_id: 'user_2',
        agency_id: agency2[0].id,
        email: 'user2@example.com',
        first_name: 'User',
        last_name: 'Two',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create contacts for both agencies
    const contact1 = await db.insert(contactsTable)
      .values({
        agency_id: agency1[0].id,
        first_name: 'Contact',
        last_name: 'One',
        created_by: user1[0].id
      })
      .returning()
      .execute();

    const contact2 = await db.insert(contactsTable)
      .values({
        agency_id: agency2[0].id,
        first_name: 'Contact',
        last_name: 'Two',
        created_by: user2[0].id
      })
      .returning()
      .execute();

    // Create deals for both agencies
    await db.insert(dealsTable)
      .values([
        {
          agency_id: agency1[0].id,
          contact_id: contact1[0].id,
          title: 'Agency 1 Deal',
          value: '1000.00',
          stage: 'lead',
          probability: 25,
          created_by: user1[0].id
        },
        {
          agency_id: agency2[0].id,
          contact_id: contact2[0].id,
          title: 'Agency 2 Deal',
          value: '2000.00',
          stage: 'qualified',
          probability: 50,
          created_by: user2[0].id
        }
      ])
      .execute();

    const result = await getDealsByAgency(agency1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Agency 1 Deal');
    expect(result[0].agency_id).toEqual(agency1[0].id);
    expect(result[0].value).toEqual(1000.00);

    // Verify the deal from agency2 is not included
    const dealFromAgency2 = result.find(deal => deal.agency_id === agency2[0].id);
    expect(dealFromAgency2).toBeUndefined();
  });

  it('should handle date conversion correctly', async () => {
    // Create test agency
    const agency = await db.insert(agenciesTable)
      .values({
        name: 'Test Agency',
        subdomain: 'test-agency'
      })
      .returning()
      .execute();

    // Create test user
    const user = await db.insert(usersTable)
      .values({
        clerk_id: 'user_123',
        agency_id: agency[0].id,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create test contact
    const contact = await db.insert(contactsTable)
      .values({
        agency_id: agency[0].id,
        first_name: 'Jane',
        last_name: 'Smith',
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Create deal with specific expected close date - use string format
    const expectedDateString = '2024-12-25';
    await db.insert(dealsTable)
      .values({
        agency_id: agency[0].id,
        contact_id: contact[0].id,
        title: 'Christmas Deal',
        value: '5000.00',
        stage: 'proposal',
        probability: 75,
        expected_close_date: expectedDateString,
        created_by: user[0].id
      })
      .execute();

    const result = await getDealsByAgency(agency[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].expected_close_date).toBeInstanceOf(Date);
    expect(result[0].expected_close_date?.getFullYear()).toEqual(2024);
    expect(result[0].expected_close_date?.getMonth()).toEqual(11); // December is month 11
    expect(result[0].expected_close_date?.getDate()).toEqual(25);
  });
});
