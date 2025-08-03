
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { type CreateAgencyInput, type Agency } from '../schema';

export const createAgency = async (input: CreateAgencyInput): Promise<Agency> => {
  try {
    // Insert agency record
    const result = await db.insert(agenciesTable)
      .values({
        name: input.name,
        subdomain: input.subdomain,
        logo_url: input.logo_url || null,
        favicon_url: input.favicon_url || null,
        primary_color: input.primary_color || null,
        secondary_color: input.secondary_color || null,
        smtp_host: input.smtp_host || null,
        smtp_port: input.smtp_port || null,
        smtp_username: input.smtp_username || null,
        smtp_password: input.smtp_password || null,
        custom_domain: input.custom_domain || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Agency creation failed:', error);
    throw error;
  }
};
