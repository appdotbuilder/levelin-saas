
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        clerk_id: input.clerk_id,
        agency_id: input.agency_id,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        role: input.role,
        avatar_url: input.avatar_url || null,
        is_active: true // Default value as specified in schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
