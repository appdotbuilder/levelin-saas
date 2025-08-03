
import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type Contact } from '../schema';
import { eq, and, or, ilike } from 'drizzle-orm';

export const searchContacts = async (agencyId: number, query: string): Promise<Contact[]> => {
  try {
    // Build search conditions for full-text search across relevant fields
    const searchTerm = `%${query}%`;
    
    const results = await db.select()
      .from(contactsTable)
      .where(
        and(
          eq(contactsTable.agency_id, agencyId),
          or(
            ilike(contactsTable.first_name, searchTerm),
            ilike(contactsTable.last_name, searchTerm),
            ilike(contactsTable.email, searchTerm),
            ilike(contactsTable.phone, searchTerm),
            ilike(contactsTable.company, searchTerm),
            ilike(contactsTable.position, searchTerm)
          )
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Contact search failed:', error);
    throw error;
  }
};
