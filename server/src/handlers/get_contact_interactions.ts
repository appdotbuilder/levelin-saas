
import { db } from '../db';
import { contactInteractionsTable } from '../db/schema';
import { type ContactInteraction } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getContactInteractions = async (contactId: number): Promise<ContactInteraction[]> => {
  try {
    // Fetch all interactions for the contact, ordered by created_at descending (newest first)
    const results = await db.select()
      .from(contactInteractionsTable)
      .where(eq(contactInteractionsTable.contact_id, contactId))
      .orderBy(desc(contactInteractionsTable.created_at))
      .execute();

    // Return the results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to fetch contact interactions:', error);
    throw error;
  }
};
