
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Agency } from '../schema';

export const getAgencyBySubdomain = async (subdomain: string): Promise<Agency | null> => {
  try {
    const results = await db.select()
      .from(agenciesTable)
      .where(eq(agenciesTable.subdomain, subdomain))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const agency = results[0];
    return {
      ...agency,
      // No numeric conversions needed - all fields are text, integer, or timestamp
    };
  } catch (error) {
    console.error('Failed to get agency by subdomain:', error);
    throw error;
  }
};
