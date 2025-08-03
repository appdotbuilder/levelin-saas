
import { db } from '../db';
import { contactsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Contact } from '../schema';

export const getContactsByAgency = async (agencyId: number): Promise<Contact[]> => {
  try {
    const results = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.agency_id, agencyId))
      .execute();

    return results.map(contact => ({
      ...contact,
      tags: contact.tags || [],
      custom_fields: contact.custom_fields || {}
    }));
  } catch (error) {
    console.error('Failed to fetch contacts by agency:', error);
    throw error;
  }
};
