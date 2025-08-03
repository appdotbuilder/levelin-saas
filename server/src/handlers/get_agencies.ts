
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { type Agency } from '../schema';

export const getAgencies = async (): Promise<Agency[]> => {
  try {
    const results = await db.select()
      .from(agenciesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch agencies:', error);
    throw error;
  }
};
