
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, contactsTable, contactInteractionsTable } from '../db/schema';
import { type CreateContactInteractionInput } from '../schema';
import { createContactInteraction } from '../handlers/create_contact_interaction';
import { eq } from 'drizzle-orm';

describe('createContactInteraction', () => {
  let agencyId: number;
  let userId: number;
  let contactId: number;

  beforeEach(async () => {
    await createDB();

    // Create test agency
    const agencyResult = await db.insert(agenciesTable)
      .values({
        name: 'Test Agency',
        subdomain: 'test-agency'
      })
      .returning()
      .execute();
    agencyId = agencyResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        clerk_id: 'test-clerk-id',
        agency_id: agencyId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'staff'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test contact
    const contactResult = await db.insert(contactsTable)
      .values({
        agency_id: agencyId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        created_by: userId
      })
      .returning()
      .execute();
    contactId = contactResult[0].id;
  });

  afterEach(resetDB);

  it('should create a contact interaction with required fields', async () => {
    const testInput: CreateContactInteractionInput = {
      contact_id: contactId,
      agency_id: agencyId,
      type: 'email',
      title: 'Initial Contact Email',
      created_by: userId
    };

    const result = await createContactInteraction(testInput);

    expect(result.contact_id).toEqual(contactId);
    expect(result.agency_id).toEqual(agencyId);
    expect(result.type).toEqual('email');
    expect(result.title).toEqual('Initial Contact Email');
    expect(result.description).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a contact interaction with all fields', async () => {
    const metadata = { email_subject: 'Welcome!', attachments: ['file1.pdf'] };
    const testInput: CreateContactInteractionInput = {
      contact_id: contactId,
      agency_id: agencyId,
      type: 'meeting',
      title: 'Discovery Call',
      description: 'Initial discovery call to understand requirements',
      metadata: metadata,
      created_by: userId
    };

    const result = await createContactInteraction(testInput);

    expect(result.contact_id).toEqual(contactId);
    expect(result.agency_id).toEqual(agencyId);
    expect(result.type).toEqual('meeting');
    expect(result.title).toEqual('Discovery Call');
    expect(result.description).toEqual('Initial discovery call to understand requirements');
    expect(result.metadata).toEqual(metadata);
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save contact interaction to database', async () => {
    const testInput: CreateContactInteractionInput = {
      contact_id: contactId,
      agency_id: agencyId,
      type: 'call',
      title: 'Follow-up Call',
      description: 'Called to follow up on proposal',
      created_by: userId
    };

    const result = await createContactInteraction(testInput);

    const interactions = await db.select()
      .from(contactInteractionsTable)
      .where(eq(contactInteractionsTable.id, result.id))
      .execute();

    expect(interactions).toHaveLength(1);
    expect(interactions[0].contact_id).toEqual(contactId);
    expect(interactions[0].agency_id).toEqual(agencyId);
    expect(interactions[0].type).toEqual('call');
    expect(interactions[0].title).toEqual('Follow-up Call');
    expect(interactions[0].description).toEqual('Called to follow up on proposal');
    expect(interactions[0].created_by).toEqual(userId);
    expect(interactions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different interaction types', async () => {
    const interactionTypes = ['email', 'call', 'meeting', 'note', 'task'] as const;

    for (const type of interactionTypes) {
      const testInput: CreateContactInteractionInput = {
        contact_id: contactId,
        agency_id: agencyId,
        type: type,
        title: `Test ${type}`,
        created_by: userId
      };

      const result = await createContactInteraction(testInput);
      expect(result.type).toEqual(type);
      expect(result.title).toEqual(`Test ${type}`);
    }
  });

  it('should handle complex metadata objects', async () => {
    const complexMetadata = {
      email_data: {
        subject: 'Project Update',
        cc: ['manager@example.com'],
        attachments: [
          { name: 'report.pdf', size: 1024 },
          { name: 'proposal.docx', size: 2048 }
        ]
      },
      tracking: {
        opened: true,
        clicked_links: ['https://example.com/pricing']
      }
    };

    const testInput: CreateContactInteractionInput = {
      contact_id: contactId,
      agency_id: agencyId,
      type: 'email',
      title: 'Project Update Email',
      metadata: complexMetadata,
      created_by: userId
    };

    const result = await createContactInteraction(testInput);

    expect(result.metadata).toEqual(complexMetadata);
    expect(result.metadata?.['email_data']).toBeDefined();
    expect(result.metadata?.['tracking']).toBeDefined();
  });
});
