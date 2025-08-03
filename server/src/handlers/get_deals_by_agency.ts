
import { db } from '../db';
import { dealsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Deal } from '../schema';

export const getDealsByAgency = async (agencyId: number): Promise<Deal[]> => {
  try {
    const results = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.agency_id, agencyId))
      .execute();

    // Convert numeric and date fields back to proper types
    return results.map(deal => ({
      ...deal,
      value: deal.value ? parseFloat(deal.value) : null,
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null
    }));
  } catch (error) {
    console.error('Failed to fetch deals by agency:', error);
    throw error;
  }
};
