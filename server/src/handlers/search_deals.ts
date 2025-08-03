
import { db } from '../db';
import { dealsTable, contactsTable } from '../db/schema';
import { type Deal } from '../schema';
import { eq, and, or, ilike } from 'drizzle-orm';

export const searchDeals = async (agencyId: number, query: string): Promise<Deal[]> => {
  try {
    // If query is empty, return empty array
    if (!query.trim()) {
      return [];
    }

    const searchPattern = `%${query.trim()}%`;

    // Build the query with join to contacts table for comprehensive search
    const results = await db.select({
      id: dealsTable.id,
      agency_id: dealsTable.agency_id,
      contact_id: dealsTable.contact_id,
      title: dealsTable.title,
      description: dealsTable.description,
      value: dealsTable.value,
      stage: dealsTable.stage,
      probability: dealsTable.probability,
      expected_close_date: dealsTable.expected_close_date,
      assigned_to: dealsTable.assigned_to,
      created_by: dealsTable.created_by,
      created_at: dealsTable.created_at,
      updated_at: dealsTable.updated_at
    })
    .from(dealsTable)
    .innerJoin(contactsTable, eq(dealsTable.contact_id, contactsTable.id))
    .where(
      and(
        eq(dealsTable.agency_id, agencyId),
        or(
          ilike(dealsTable.title, searchPattern),
          ilike(dealsTable.description, searchPattern),
          ilike(contactsTable.first_name, searchPattern),
          ilike(contactsTable.last_name, searchPattern),
          ilike(contactsTable.company, searchPattern)
        )
      )
    )
    .execute();

    // Convert numeric and date fields and return
    return results.map(deal => ({
      ...deal,
      value: deal.value ? parseFloat(deal.value) : null,
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null
    }));
  } catch (error) {
    console.error('Deal search failed:', error);
    throw error;
  }
};
