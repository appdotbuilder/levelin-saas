
import { db } from '../db';
import { landingPagesTable } from '../db/schema';
import { type CreateLandingPageInput, type LandingPage } from '../schema';

export const createLandingPage = async (input: CreateLandingPageInput): Promise<LandingPage> => {
  try {
    // Insert landing page record
    const result = await db.insert(landingPagesTable)
      .values({
        agency_id: input.agency_id,
        title: input.title,
        slug: input.slug,
        template_id: input.template_id,
        content: input.content,
        custom_domain: input.custom_domain || null,
        meta_title: input.meta_title || null,
        meta_description: input.meta_description || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    const landingPage = result[0];
    return landingPage;
  } catch (error) {
    console.error('Landing page creation failed:', error);
    throw error;
  }
};
