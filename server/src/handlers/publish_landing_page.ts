
import { db } from '../db';
import { landingPagesTable } from '../db/schema';
import { type LandingPage } from '../schema';
import { eq } from 'drizzle-orm';

export const publishLandingPage = async (id: number): Promise<LandingPage> => {
  try {
    // First, check if the landing page exists
    const existingPage = await db.select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.id, id))
      .execute();

    if (existingPage.length === 0) {
      throw new Error(`Landing page with id ${id} not found`);
    }

    // Update the landing page to published status
    const result = await db.update(landingPagesTable)
      .set({
        status: 'published',
        published_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(landingPagesTable.id, id))
      .returning()
      .execute();

    const landingPage = result[0];

    // Convert numeric fields if any (none in this case, but following pattern)
    return {
      ...landingPage,
      // Ensure date fields are properly converted
      published_at: landingPage.published_at,
      created_at: landingPage.created_at,
      updated_at: landingPage.updated_at
    };
  } catch (error) {
    console.error('Landing page publishing failed:', error);
    throw error;
  }
};
