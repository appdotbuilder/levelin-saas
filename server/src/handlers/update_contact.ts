
import { db } from '../db';
import { contactsTable } from '../db/schema';
import { type UpdateContactInput, type Contact } from '../schema';
import { eq } from 'drizzle-orm';

export const updateContact = async (input: UpdateContactInput): Promise<Contact> => {
  try {
    // First, verify the contact exists
    const existingContact = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, input.id))
      .execute();

    if (existingContact.length === 0) {
      throw new Error(`Contact with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.first_name !== undefined) {
      updateData.first_name = input.first_name;
    }
    if (input.last_name !== undefined) {
      updateData.last_name = input.last_name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.company !== undefined) {
      updateData.company = input.company;
    }
    if (input.position !== undefined) {
      updateData.position = input.position;
    }
    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }
    if (input.custom_fields !== undefined) {
      updateData.custom_fields = input.custom_fields;
    }

    // Update the contact
    const result = await db.update(contactsTable)
      .set(updateData)
      .where(eq(contactsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact update failed:', error);
    throw error;
  }
};
