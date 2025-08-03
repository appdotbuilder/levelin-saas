
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable } from '../db/schema';
import { getUsersByAgency } from '../handlers/get_users_by_agency';
import { type CreateAgencyInput, type CreateUserInput } from '../schema';

describe('getUsersByAgency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return users for the specified agency', async () => {
    // Create test agency
    const agencyInput: CreateAgencyInput = {
      name: 'Test Agency',
      subdomain: 'test-agency'
    };

    const [agency] = await db.insert(agenciesTable)
      .values(agencyInput)
      .returning()
      .execute();

    // Create test users for the agency
    const userInput1: CreateUserInput = {
      clerk_id: 'clerk_123',
      agency_id: agency.id,
      email: 'user1@test.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'staff'
    };

    const userInput2: CreateUserInput = {
      clerk_id: 'clerk_456',
      agency_id: agency.id,
      email: 'user2@test.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'client'
    };

    await db.insert(usersTable)
      .values([userInput1, userInput2])
      .execute();

    const result = await getUsersByAgency(agency.id);

    expect(result).toHaveLength(2);
    expect(result[0].agency_id).toBe(agency.id);
    expect(result[1].agency_id).toBe(agency.id);
    expect(result[0].first_name).toBe('John');
    expect(result[1].first_name).toBe('Jane');
  });

  it('should return empty array when agency has no users', async () => {
    // Create test agency
    const agencyInput: CreateAgencyInput = {
      name: 'Empty Agency',
      subdomain: 'empty-agency'
    };

    const [agency] = await db.insert(agenciesTable)
      .values(agencyInput)
      .returning()
      .execute();

    const result = await getUsersByAgency(agency.id);

    expect(result).toHaveLength(0);
  });

  it('should return only users from the specified agency', async () => {
    // Create two test agencies
    const agency1Input: CreateAgencyInput = {
      name: 'Agency One',
      subdomain: 'agency-one'
    };

    const agency2Input: CreateAgencyInput = {
      name: 'Agency Two',
      subdomain: 'agency-two'
    };

    const [agency1, agency2] = await db.insert(agenciesTable)
      .values([agency1Input, agency2Input])
      .returning()
      .execute();

    // Create users for both agencies
    const user1Input: CreateUserInput = {
      clerk_id: 'clerk_111',
      agency_id: agency1.id,
      email: 'user1@agency1.com',
      first_name: 'Alice',
      last_name: 'Johnson',
      role: 'staff'
    };

    const user2Input: CreateUserInput = {
      clerk_id: 'clerk_222',
      agency_id: agency2.id,
      email: 'user2@agency2.com',
      first_name: 'Bob',
      last_name: 'Wilson',
      role: 'client'
    };

    await db.insert(usersTable)
      .values([user1Input, user2Input])
      .execute();

    // Get users for agency1 only
    const result = await getUsersByAgency(agency1.id);

    expect(result).toHaveLength(1);
    expect(result[0].agency_id).toBe(agency1.id);
    expect(result[0].first_name).toBe('Alice');
  });

  it('should return users with all expected fields', async () => {
    // Create test agency
    const agencyInput: CreateAgencyInput = {
      name: 'Full Test Agency',
      subdomain: 'full-test-agency'
    };

    const [agency] = await db.insert(agenciesTable)
      .values(agencyInput)
      .returning()
      .execute();

    // Create test user with all fields
    const userInput: CreateUserInput = {
      clerk_id: 'clerk_full',
      agency_id: agency.id,
      email: 'full@test.com',
      first_name: 'Full',
      last_name: 'User',
      role: 'agency-owner',
      avatar_url: 'https://example.com/avatar.jpg'
    };

    await db.insert(usersTable)
      .values(userInput)
      .execute();

    const result = await getUsersByAgency(agency.id);

    expect(result).toHaveLength(1);
    const user = result[0];
    expect(user.id).toBeDefined();
    expect(user.clerk_id).toBe('clerk_full');
    expect(user.agency_id).toBe(agency.id);
    expect(user.email).toBe('full@test.com');
    expect(user.first_name).toBe('Full');
    expect(user.last_name).toBe('User');
    expect(user.role).toBe('agency-owner');
    expect(user.avatar_url).toBe('https://example.com/avatar.jpg');
    expect(user.is_active).toBe(true);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});
