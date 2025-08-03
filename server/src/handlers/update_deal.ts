
import { db } from '../db';
import { dealsTable } from '../db/schema';
import { type UpdateDealInput, type Deal } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDeal = async (input: UpdateDealInput): Promise<Deal> => {
  try {
    // Check if deal exists
    const existingDeal = await db.select()
      .from(dealsTable)
      .where(eq(dealsTable.id, input.id))
      .execute();

    if (existingDeal.length === 0) {
      throw new Error(`Deal with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.value !== undefined) {
      updateData.value = input.value?.toString() || null;
    }
    if (input.stage !== undefined) {
      updateData.stage = input.stage;
    }
    if (input.probability !== undefined) {
      updateData.probability = input.probability;
    }
    if (input.expected_close_date !== undefined) {
      // Convert Date to string for date column
      updateData.expected_close_date = input.expected_close_date?.toISOString().split('T')[0] || null;
    }
    if (input.assigned_to !== undefined) {
      updateData.assigned_to = input.assigned_to;
    }

    // Update the deal
    const result = await db.update(dealsTable)
      .set(updateData)
      .where(eq(dealsTable.id, input.id))
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const deal = result[0];
    return {
      ...deal,
      value: deal.value ? parseFloat(deal.value) : null,
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : null
    };
  } catch (error) {
    console.error('Deal update failed:', error);
    throw error;
  }
};
