
import { db } from '../db';
import { contactInteractionsTable } from '../db/schema';
import { type CreateContactInteractionInput, type ContactInteraction } from '../schema';

export const createContactInteraction = async (input: CreateContactInteractionInput): Promise<ContactInteraction> => {
  try {
    // Insert contact interaction record
    const result = await db.insert(contactInteractionsTable)
      .values({
        contact_id: input.contact_id,
        agency_id: input.agency_id,
        type: input.type,
        title: input.title,
        description: input.description || null,
        metadata: input.metadata || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    const interaction = result[0];
    return {
      ...interaction,
      // Ensure proper type conversion for JSON fields
      metadata: interaction.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Contact interaction creation failed:', error);
    throw error;
  }
};
