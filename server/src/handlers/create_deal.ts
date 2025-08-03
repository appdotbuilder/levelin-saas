
import { db } from '../db';
import { dealsTable, agenciesTable, contactsTable, usersTable } from '../db/schema';
import { type CreateDealInput, type Deal } from '../schema';
import { eq } from 'drizzle-orm';

export const createDeal = async (input: CreateDealInput): Promise<Deal> => {
  try {
    // Validate agency exists
    const agency = await db.select()
      .from(agenciesTable)
      .where(eq(agenciesTable.id, input.agency_id))
      .execute();

    if (agency.length === 0) {
      throw new Error(`Agency with id ${input.agency_id} not found`);
    }

    // Validate contact exists and belongs to the agency
    const contact = await db.select()
      .from(contactsTable)
      .where(eq(contactsTable.id, input.contact_id))
      .execute();

    if (contact.length === 0) {
      throw new Error(`Contact with id ${input.contact_id} not found`);
    }

    if (contact[0].agency_id !== input.agency_id) {
      throw new Error(`Contact ${input.contact_id} does not belong to agency ${input.agency_id}`);
    }

    // Validate created_by user exists and belongs to the agency
    const createdByUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (createdByUser.length === 0) {
      throw new Error(`User with id ${input.created_by} not found`);
    }

    if (createdByUser[0].agency_id !== input.agency_id) {
      throw new Error(`User ${input.created_by} does not belong to agency ${input.agency_id}`);
    }

    // Validate assigned_to user if provided
    if (input.assigned_to) {
      const assignedToUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.assigned_to))
        .execute();

      if (assignedToUser.length === 0) {
        throw new Error(`Assigned user with id ${input.assigned_to} not found`);
      }

      if (assignedToUser[0].agency_id !== input.agency_id) {
        throw new Error(`Assigned user ${input.assigned_to} does not belong to agency ${input.agency_id}`);
      }
    }

    // Convert expected_close_date to string format for date column
    const expectedCloseDateString = input.expected_close_date 
      ? input.expected_close_date.toISOString().split('T')[0]
      : null;

    // Insert deal record
    const result = await db.insert(dealsTable)
      .values({
        agency_id: input.agency_id,
        contact_id: input.contact_id,
        title: input.title,
        description: input.description || null,
        value: input.value ? input.value.toString() : null, // Convert number to string for numeric column
        stage: input.stage,
        probability: input.probability,
        expected_close_date: expectedCloseDateString,
        assigned_to: input.assigned_to || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const deal = result[0];
    return {
      ...deal,
      value: deal.value ? parseFloat(deal.value) : null, // Convert string back to number
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null // Convert string back to Date
    };
  } catch (error) {
    console.error('Deal creation failed:', error);
    throw error;
  }
};
