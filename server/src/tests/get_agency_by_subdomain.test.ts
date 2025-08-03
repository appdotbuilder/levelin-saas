
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { type CreateAgencyInput } from '../schema';
import { getAgencyBySubdomain } from '../handlers/get_agency_by_subdomain';

// Test agency data
const testAgency: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency',
  logo_url: 'https://example.com/logo.png',
  favicon_url: 'https://example.com/favicon.ico',
  primary_color: '#FF0000',
  secondary_color: '#00FF00',
  smtp_host: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'test@example.com',
  smtp_password: 'password123',
  custom_domain: 'agency.example.com'
};

describe('getAgencyBySubdomain', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return agency when subdomain exists', async () => {
    // Create test agency
    const insertResult = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const createdAgency = insertResult[0];

    // Test the handler
    const result = await getAgencyBySubdomain('test-agency');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAgency.id);
    expect(result!.name).toEqual('Test Agency');
    expect(result!.subdomain).toEqual('test-agency');
    expect(result!.logo_url).toEqual('https://example.com/logo.png');
    expect(result!.favicon_url).toEqual('https://example.com/favicon.ico');
    expect(result!.primary_color).toEqual('#FF0000');
    expect(result!.secondary_color).toEqual('#00FF00');
    expect(result!.smtp_host).toEqual('smtp.example.com');
    expect(result!.smtp_port).toEqual(587);
    expect(result!.smtp_username).toEqual('test@example.com');
    expect(result!.smtp_password).toEqual('password123');
    expect(result!.custom_domain).toEqual('agency.example.com');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when subdomain does not exist', async () => {
    const result = await getAgencyBySubdomain('nonexistent-subdomain');

    expect(result).toBeNull();
  });

  it('should return correct agency when multiple agencies exist', async () => {
    // Create multiple agencies
    await db.insert(agenciesTable)
      .values([
        { ...testAgency, subdomain: 'agency-one' },
        { ...testAgency, subdomain: 'agency-two', name: 'Second Agency' },
        { ...testAgency, subdomain: 'agency-three' }
      ])
      .execute();

    // Test finding specific agency
    const result = await getAgencyBySubdomain('agency-two');

    expect(result).not.toBeNull();
    expect(result!.subdomain).toEqual('agency-two');
    expect(result!.name).toEqual('Second Agency');
  });

  it('should handle subdomain case sensitivity correctly', async () => {
    // Create agency with lowercase subdomain
    await db.insert(agenciesTable)
      .values({ ...testAgency, subdomain: 'test-agency' })
      .execute();

    // Test with exact case
    const result1 = await getAgencyBySubdomain('test-agency');
    expect(result1).not.toBeNull();

    // Test with different case - should not find (PostgreSQL is case sensitive by default)
    const result2 = await getAgencyBySubdomain('TEST-AGENCY');
    expect(result2).toBeNull();
  });
});
