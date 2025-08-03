
import { db } from '../db';
import { landingPagesTable } from '../db/schema';
import { type LandingPage } from '../schema';
import { eq } from 'drizzle-orm';

export const getLandingPagesByAgency = async (agencyId: number): Promise<LandingPage[]> => {
  try {
    const results = await db.select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.agency_id, agencyId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get landing pages by agency:', error);
    throw error;
  }
};
