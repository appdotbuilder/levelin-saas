
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { type CreateAgencyInput } from '../schema';
import { getAgencies } from '../handlers/get_agencies';

const testAgency1: CreateAgencyInput = {
  name: 'Test Agency 1',
  subdomain: 'test-agency-1',
  logo_url: 'https://example.com/logo1.png',
  favicon_url: 'https://example.com/favicon1.ico',
  primary_color: '#FF0000',
  secondary_color: '#00FF00',
  smtp_host: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'test@example.com',
  smtp_password: 'password123',
  custom_domain: 'agency1.com'
};

const testAgency2: CreateAgencyInput = {
  name: 'Test Agency 2',
  subdomain: 'test-agency-2',
  logo_url: null,
  favicon_url: null,
  primary_color: null,
  secondary_color: null,
  smtp_host: null,
  smtp_port: null,
  smtp_username: null,
  smtp_password: null,
  custom_domain: null
};

describe('getAgencies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no agencies exist', async () => {
    const result = await getAgencies();

    expect(result).toEqual([]);
  });

  it('should return all agencies', async () => {
    // Create test agencies
    await db.insert(agenciesTable)
      .values([testAgency1, testAgency2])
      .execute();

    const result = await getAgencies();

    expect(result).toHaveLength(2);
    
    // Check first agency
    const agency1 = result.find(a => a.subdomain === 'test-agency-1');
    expect(agency1).toBeDefined();
    expect(agency1!.name).toEqual('Test Agency 1');
    expect(agency1!.logo_url).toEqual('https://example.com/logo1.png');
    expect(agency1!.primary_color).toEqual('#FF0000');
    expect(agency1!.smtp_host).toEqual('smtp.example.com');
    expect(agency1!.smtp_port).toEqual(587);
    expect(agency1!.custom_domain).toEqual('agency1.com');
    expect(agency1!.created_at).toBeInstanceOf(Date);
    expect(agency1!.updated_at).toBeInstanceOf(Date);
    
    // Check second agency with null values
    const agency2 = result.find(a => a.subdomain === 'test-agency-2');
    expect(agency2).toBeDefined();
    expect(agency2!.name).toEqual('Test Agency 2');
    expect(agency2!.logo_url).toBeNull();
    expect(agency2!.primary_color).toBeNull();
    expect(agency2!.smtp_host).toBeNull();
    expect(agency2!.smtp_port).toBeNull();
    expect(agency2!.custom_domain).toBeNull();
  });

  it('should return agencies with all required fields', async () => {
    await db.insert(agenciesTable)
      .values(testAgency1)
      .execute();

    const result = await getAgencies();

    expect(result).toHaveLength(1);
    const agency = result[0];
    
    // Check all required fields are present
    expect(agency.id).toBeDefined();
    expect(typeof agency.id).toBe('number');
    expect(agency.name).toBeDefined();
    expect(agency.subdomain).toBeDefined();
    expect(agency.created_at).toBeInstanceOf(Date);
    expect(agency.updated_at).toBeInstanceOf(Date);
  });

  it('should return agencies ordered by creation time', async () => {
    // Insert agencies in specific order
    await db.insert(agenciesTable)
      .values(testAgency1)
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(agenciesTable)
      .values(testAgency2)
      .execute();

    const result = await getAgencies();

    expect(result).toHaveLength(2);
    
    // Should be ordered by creation time (first created first)
    expect(result[0].subdomain).toEqual('test-agency-1');
    expect(result[1].subdomain).toEqual('test-agency-2');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
