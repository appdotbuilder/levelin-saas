
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable, contactInteractionsTable } from '../db/schema';
import { type CreateAgencyInput, type CreateUserInput, type CreateContactInput, type CreateContactInteractionInput } from '../schema';
import { getContactInteractions } from '../handlers/get_contact_interactions';

// Test data
const testAgency: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency'
};

const testUser: CreateUserInput = {
  clerk_id: 'clerk_test_123',
  agency_id: 1, // Will be set after agency creation
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'staff'
};

const testContact: CreateContactInput = {
  agency_id: 1, // Will be set after agency creation
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  phone: '+1234567890',
  company: 'Test Company',
  position: 'Manager',
  tags: ['lead', 'important'],
  custom_fields: { source: 'website' },
  created_by: 1 // Will be set after user creation
};

const testInteraction1: CreateContactInteractionInput = {
  contact_id: 1, // Will be set after contact creation
  agency_id: 1,
  type: 'email',
  title: 'Initial Contact',
  description: 'First email sent to prospect',
  metadata: { email_id: 'email_123' },
  created_by: 1
};

const testInteraction2: CreateContactInteractionInput = {
  contact_id: 1,
  agency_id: 1,
  type: 'call',
  title: 'Follow-up Call',
  description: 'Called to discuss requirements',
  metadata: { duration: 900 },
  created_by: 1
};

const testInteraction3: CreateContactInteractionInput = {
  contact_id: 1,
  agency_id: 1,
  type: 'meeting',
  title: 'Discovery Meeting',
  description: 'In-person meeting to understand needs',
  created_by: 1
};

describe('getContactInteractions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for contact with no interactions', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({ ...testUser, agency_id: agency[0].id })
      .returning()
      .execute();

    const contact = await db.insert(contactsTable)
      .values({ ...testContact, agency_id: agency[0].id, created_by: user[0].id })
      .returning()
      .execute();

    const result = await getContactInteractions(contact[0].id);

    expect(result).toEqual([]);
  });

  it('should return all interactions for a contact', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({ ...testUser, agency_id: agency[0].id })
      .returning()
      .execute();

    const contact = await db.insert(contactsTable)
      .values({ ...testContact, agency_id: agency[0].id, created_by: user[0].id })
      .returning()
      .execute();

    // Create interactions with slight delays to ensure different timestamps
    const interaction1 = await db.insert(contactInteractionsTable)
      .values({ ...testInteraction1, contact_id: contact[0].id, agency_id: agency[0].id, created_by: user[0].id })
      .returning()
      .execute();

    // Add small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    const interaction2 = await db.insert(contactInteractionsTable)
      .values({ ...testInteraction2, contact_id: contact[0].id, agency_id: agency[0].id, created_by: user[0].id })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const interaction3 = await db.insert(contactInteractionsTable)
      .values({ ...testInteraction3, contact_id: contact[0].id, agency_id: agency[0].id, created_by: user[0].id })
      .returning()
      .execute();

    const result = await getContactInteractions(contact[0].id);

    expect(result).toHaveLength(3);
    
    // Verify all interactions are returned
    const titles = result.map(i => i.title);
    expect(titles).toContain('Initial Contact');
    expect(titles).toContain('Follow-up Call');
    expect(titles).toContain('Discovery Meeting');

    // Verify fields are correct
    const emailInteraction = result.find(i => i.type === 'email');
    expect(emailInteraction?.title).toEqual('Initial Contact');
    expect(emailInteraction?.description).toEqual('First email sent to prospect');
    expect(emailInteraction?.metadata).toEqual({ email_id: 'email_123' });
    expect(emailInteraction?.contact_id).toEqual(contact[0].id);
    expect(emailInteraction?.agency_id).toEqual(agency[0].id);
    expect(emailInteraction?.created_by).toEqual(user[0].id);
    expect(emailInteraction?.created_at).toBeInstanceOf(Date);

    const callInteraction = result.find(i => i.type === 'call');
    expect(callInteraction?.metadata).toEqual({ duration: 900 });

    const meetingInteraction = result.find(i => i.type === 'meeting');
    expect(meetingInteraction?.description).toEqual('In-person meeting to understand needs');
    expect(meetingInteraction?.metadata).toBeNull();
  });

  it('should return interactions in chronological order (newest first)', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({ ...testUser, agency_id: agency[0].id })
      .returning()
      .execute();

    const contact = await db.insert(contactsTable)
      .values({ ...testContact, agency_id: agency[0].id, created_by: user[0].id })
      .returning()
      .execute();

    // Create interactions with delays to ensure different timestamps
    await db.insert(contactInteractionsTable)
      .values({ ...testInteraction1, contact_id: contact[0].id, agency_id: agency[0].id, created_by: user[0].id })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 50));

    await db.insert(contactInteractionsTable)
      .values({ ...testInteraction2, contact_id: contact[0].id, agency_id: agency[0].id, created_by: user[0].id })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 50));

    await db.insert(contactInteractionsTable)
      .values({ ...testInteraction3, contact_id: contact[0].id, agency_id: agency[0].id, created_by: user[0].id })
      .execute();

    const result = await getContactInteractions(contact[0].id);

    expect(result).toHaveLength(3);
    
    // Verify chronological order (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
    
    // The most recent should be the meeting (created last)
    expect(result[0].title).toEqual('Discovery Meeting');
    expect(result[2].title).toEqual('Initial Contact');
  });

  it('should not return interactions for other contacts', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({ ...testUser, agency_id: agency[0].id })
      .returning()
      .execute();

    const contact1 = await db.insert(contactsTable)
      .values({ ...testContact, agency_id: agency[0].id, created_by: user[0].id })
      .returning()
      .execute();

    const contact2 = await db.insert(contactsTable)
      .values({ 
        ...testContact, 
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        agency_id: agency[0].id, 
        created_by: user[0].id 
      })
      .returning()
      .execute();

    // Create interaction for contact1
    await db.insert(contactInteractionsTable)
      .values({ ...testInteraction1, contact_id: contact1[0].id, agency_id: agency[0].id, created_by: user[0].id })
      .execute();

    // Create interaction for contact2
    await db.insert(contactInteractionsTable)
      .values({ 
        ...testInteraction2, 
        contact_id: contact2[0].id, 
        agency_id: agency[0].id, 
        created_by: user[0].id 
      })
      .execute();

    const result = await getContactInteractions(contact1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Initial Contact');
    expect(result[0].contact_id).toEqual(contact1[0].id);
  });
});
