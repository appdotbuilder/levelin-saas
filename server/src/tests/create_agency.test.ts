
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { type CreateAgencyInput } from '../schema';
import { createAgency } from '../handlers/create_agency';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency',
  logo_url: 'https://example.com/logo.png',
  favicon_url: 'https://example.com/favicon.ico',
  primary_color: '#0066FF',
  secondary_color: '#FF6600',
  smtp_host: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'test@example.com',
  smtp_password: 'password123',
  custom_domain: 'testagency.com'
};

// Minimal test input
const minimalInput: CreateAgencyInput = {
  name: 'Minimal Agency',
  subdomain: 'minimal-agency'
};

describe('createAgency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an agency with all fields', async () => {
    const result = await createAgency(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Agency');
    expect(result.subdomain).toEqual('test-agency');
    expect(result.logo_url).toEqual('https://example.com/logo.png');
    expect(result.favicon_url).toEqual('https://example.com/favicon.ico');
    expect(result.primary_color).toEqual('#0066FF');
    expect(result.secondary_color).toEqual('#FF6600');
    expect(result.smtp_host).toEqual('smtp.example.com');
    expect(result.smtp_port).toEqual(587);
    expect(result.smtp_username).toEqual('test@example.com');
    expect(result.smtp_password).toEqual('password123');
    expect(result.custom_domain).toEqual('testagency.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an agency with minimal fields', async () => {
    const result = await createAgency(minimalInput);

    expect(result.name).toEqual('Minimal Agency');
    expect(result.subdomain).toEqual('minimal-agency');
    expect(result.logo_url).toBeNull();
    expect(result.favicon_url).toBeNull();
    expect(result.primary_color).toBeNull();
    expect(result.secondary_color).toBeNull();
    expect(result.smtp_host).toBeNull();
    expect(result.smtp_port).toBeNull();
    expect(result.smtp_username).toBeNull();
    expect(result.smtp_password).toBeNull();
    expect(result.custom_domain).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save agency to database', async () => {
    const result = await createAgency(testInput);

    const agencies = await db.select()
      .from(agenciesTable)
      .where(eq(agenciesTable.id, result.id))
      .execute();

    expect(agencies).toHaveLength(1);
    const agency = agencies[0];
    expect(agency.name).toEqual('Test Agency');
    expect(agency.subdomain).toEqual('test-agency');
    expect(agency.logo_url).toEqual('https://example.com/logo.png');
    expect(agency.smtp_port).toEqual(587);
    expect(agency.created_at).toBeInstanceOf(Date);
    expect(agency.updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique subdomain constraint', async () => {
    // Create first agency
    await createAgency(testInput);

    // Try to create second agency with same subdomain
    await expect(createAgency({
      name: 'Another Agency',
      subdomain: 'test-agency' // Same subdomain
    })).rejects.toThrow(/unique/i);
  });
});
