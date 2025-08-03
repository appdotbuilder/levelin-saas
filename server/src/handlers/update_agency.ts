
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { type UpdateAgencyInput, type Agency } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAgency = async (input: UpdateAgencyInput): Promise<Agency> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof agenciesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.logo_url !== undefined) {
      updateData.logo_url = input.logo_url;
    }
    if (input.favicon_url !== undefined) {
      updateData.favicon_url = input.favicon_url;
    }
    if (input.primary_color !== undefined) {
      updateData.primary_color = input.primary_color;
    }
    if (input.secondary_color !== undefined) {
      updateData.secondary_color = input.secondary_color;
    }
    if (input.smtp_host !== undefined) {
      updateData.smtp_host = input.smtp_host;
    }
    if (input.smtp_port !== undefined) {
      updateData.smtp_port = input.smtp_port;
    }
    if (input.smtp_username !== undefined) {
      updateData.smtp_username = input.smtp_username;
    }
    if (input.smtp_password !== undefined) {
      updateData.smtp_password = input.smtp_password;
    }
    if (input.custom_domain !== undefined) {
      updateData.custom_domain = input.custom_domain;
    }

    // Update agency record
    const result = await db.update(agenciesTable)
      .set(updateData)
      .where(eq(agenciesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Agency with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Agency update failed:', error);
    throw error;
  }
};
