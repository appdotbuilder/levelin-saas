
import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type CreateContactInput, type Contact } from '../schema';

export const createContact = async (input: CreateContactInput): Promise<Contact> => {
  try {
    // Insert contact record
    const result = await db.insert(contactsTable)
      .values({
        agency_id: input.agency_id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email || null,
        phone: input.phone || null,
        company: input.company || null,
        position: input.position || null,
        tags: input.tags,
        custom_fields: input.custom_fields,
        created_by: input.created_by
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact creation failed:', error);
    throw error;
  }
};
