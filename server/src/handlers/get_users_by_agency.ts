
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User } from '../schema';

export const getUsersByAgency = async (agencyId: number): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.agency_id, agencyId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get users by agency:', error);
    throw error;
  }
};
