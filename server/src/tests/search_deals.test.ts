
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable, dealsTable } from '../db/schema';
import { searchDeals } from '../handlers/search_deals';

describe('searchDeals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let agencyId: number;
  let userId: number;
  let contactId: number;

  beforeEach(async () => {
    // Create test agency
    const agencies = await db.insert(agenciesTable)
      .values({
        name: 'Test Agency',
        subdomain: 'test-agency'
      })
      .returning()
      .execute();
    agencyId = agencies[0].id;

    // Create test user
    const users = await db.insert(usersTable)
      .values({
        clerk_id: 'clerk_test_user',
        agency_id: agencyId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'staff'
      })
      .returning()
      .execute();
    userId = users[0].id;

    // Create test contact
    const contacts = await db.insert(contactsTable)
      .values({
        agency_id: agencyId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        company: 'Acme Corporation',
        created_by: userId
      })
      .returning()
      .execute();
    contactId = contacts[0].id;
  });

  it('should search deals by title', async () => {
    // Create test deals
    await db.insert(dealsTable)
      .values([
        {
          agency_id: agencyId,
          contact_id: contactId,
          title: 'Website Development Project',
          description: 'Build a new website',
          value: '5000.00',
          stage: 'proposal',
          probability: 75,
          created_by: userId
        },
        {
          agency_id: agencyId,
          contact_id: contactId,
          title: 'Mobile App Development',
          description: 'Create mobile application',
          value: '8000.00',
          stage: 'qualified',
          probability: 50,
          created_by: userId
        }
      ])
      .execute();

    const results = await searchDeals(agencyId, 'Website');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Website Development Project');
    expect(results[0].value).toEqual(5000);
    expect(typeof results[0].value).toEqual('number');
  });

  it('should search deals by description', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'Custom Software',
        description: 'E-commerce platform development',
        value: '12000.00',
        stage: 'lead',
        probability: 25,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, 'e-commerce');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Custom Software');
    expect(results[0].description).toEqual('E-commerce platform development');
  });

  it('should search deals by contact first name', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'Consulting Services',
        description: 'Business consulting',
        value: '3000.00',
        stage: 'won',
        probability: 100,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, 'John');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Consulting Services');
  });

  it('should search deals by contact last name', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'Marketing Campaign',
        description: 'Digital marketing services',
        value: '4500.00',
        stage: 'proposal',
        probability: 60,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, 'Doe');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Marketing Campaign');
  });

  it('should search deals by contact company', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'Brand Design',
        description: 'Logo and brand identity',
        value: '2500.00',
        stage: 'qualified',
        probability: 40,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, 'Acme');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Brand Design');
  });

  it('should perform case-insensitive search', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'SEO Optimization',
        description: 'Search engine optimization',
        value: '1500.00',
        stage: 'lead',
        probability: 30,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, 'seo');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('SEO Optimization');
  });

  it('should return empty array for empty query', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'Test Deal',
        description: 'Test description',
        value: '1000.00',
        stage: 'lead',
        probability: 20,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, '');

    expect(results).toHaveLength(0);
  });

  it('should return empty array for whitespace-only query', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'Test Deal',
        description: 'Test description',
        value: '1000.00',
        stage: 'lead',
        probability: 20,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, '   ');

    expect(results).toHaveLength(0);
  });

  it('should only return deals from specified agency', async () => {
    // Create another agency
    const otherAgencies = await db.insert(agenciesTable)
      .values({
        name: 'Other Agency',
        subdomain: 'other-agency'
      })
      .returning()
      .execute();
    const otherAgencyId = otherAgencies[0].id;

    // Create user and contact for other agency
    const otherUsers = await db.insert(usersTable)
      .values({
        clerk_id: 'clerk_other_user',
        agency_id: otherAgencyId,
        email: 'other@example.com',
        first_name: 'Other',
        last_name: 'User',
        role: 'staff'
      })
      .returning()
      .execute();
    const otherUserId = otherUsers[0].id;

    const otherContacts = await db.insert(contactsTable)
      .values({
        agency_id: otherAgencyId,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        company: 'Other Corp',
        created_by: otherUserId
      })
      .returning()
      .execute();
    const otherContactId = otherContacts[0].id;

    // Create deals in both agencies with same search term
    await db.insert(dealsTable)
      .values([
        {
          agency_id: agencyId,
          contact_id: contactId,
          title: 'Website Project',
          description: 'Test description',
          value: '5000.00',
          stage: 'proposal',
          probability: 75,
          created_by: userId
        },
        {
          agency_id: otherAgencyId,
          contact_id: otherContactId,
          title: 'Website Project',
          description: 'Other description',
          value: '6000.00',
          stage: 'qualified',
          probability: 80,
          created_by: otherUserId
        }
      ])
      .execute();

    const results = await searchDeals(agencyId, 'Website');

    expect(results).toHaveLength(1);
    expect(results[0].agency_id).toEqual(agencyId);
    expect(results[0].value).toEqual(5000);
  });

  it('should handle deals with null values correctly', async () => {
    await db.insert(dealsTable)
      .values({
        agency_id: agencyId,
        contact_id: contactId,
        title: 'Simple Deal',
        description: null,
        value: null,
        stage: 'lead',
        probability: 0,
        created_by: userId
      })
      .execute();

    const results = await searchDeals(agencyId, 'Simple');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Simple Deal');
    expect(results[0].description).toBeNull();
    expect(results[0].value).toBeNull();
  });
});
