
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, agenciesTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

describe('createUser', () => {
  let testAgencyId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test agency first (required for foreign key)
    const agencyResult = await db.insert(agenciesTable)
      .values({
        name: 'Test Agency',
        subdomain: 'test-agency'
      })
      .returning()
      .execute();
    
    testAgencyId = agencyResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateUserInput = {
    clerk_id: 'clerk_test_123',
    agency_id: 0, // Will be set to testAgencyId in tests
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'staff',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  it('should create a user', async () => {
    const input = { ...testInput, agency_id: testAgencyId };
    const result = await createUser(input);

    // Basic field validation
    expect(result.clerk_id).toEqual('clerk_test_123');
    expect(result.agency_id).toEqual(testAgencyId);
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.role).toEqual('staff');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const input = { ...testInput, agency_id: testAgencyId };
    const result = await createUser(input);

    // Query database to verify user was created
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].clerk_id).toEqual('clerk_test_123');
    expect(users[0].agency_id).toEqual(testAgencyId);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].role).toEqual('staff');
    expect(users[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create user without avatar_url', async () => {
    const input = { 
      ...testInput, 
      agency_id: testAgencyId,
      avatar_url: undefined 
    };
    const result = await createUser(input);

    expect(result.avatar_url).toBeNull();
    expect(result.clerk_id).toEqual('clerk_test_123');
    expect(result.is_active).toBe(true);
  });

  it('should create user with different roles', async () => {
    const roles = ['super-admin', 'agency-owner', 'staff', 'client'] as const;
    
    for (const role of roles) {
      const input = { 
        ...testInput, 
        agency_id: testAgencyId,
        clerk_id: `clerk_${role}_123`,
        role 
      };
      const result = await createUser(input);

      expect(result.role).toEqual(role);
      expect(result.clerk_id).toEqual(`clerk_${role}_123`);
    }
  });

  it('should enforce unique clerk_id constraint', async () => {
    const input = { ...testInput, agency_id: testAgencyId };
    
    // Create first user
    await createUser(input);
    
    // Try to create second user with same clerk_id
    await expect(createUser(input)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should enforce foreign key constraint for agency_id', async () => {
    const input = { 
      ...testInput, 
      agency_id: 99999 // Non-existent agency ID
    };
    
    await expect(createUser(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
