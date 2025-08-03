
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable } from '../db/schema';
import { type UpdateAgencyInput, type CreateAgencyInput } from '../schema';
import { updateAgency } from '../handlers/update_agency';
import { eq } from 'drizzle-orm';

const createTestAgency = async (): Promise<number> => {
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
    custom_domain: 'test.example.com'
  };

  const result = await db.insert(agenciesTable)
    .values(testAgency)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateAgency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update agency with all fields', async () => {
    const agencyId = await createTestAgency();

    const updateInput: UpdateAgencyInput = {
      id: agencyId,
      name: 'Updated Agency Name',
      logo_url: 'https://example.com/new-logo.png',
      favicon_url: 'https://example.com/new-favicon.ico',
      primary_color: '#0000FF',
      secondary_color: '#FFFF00',
      smtp_host: 'new-smtp.example.com',
      smtp_port: 465,
      smtp_username: 'new@example.com',
      smtp_password: 'newpassword123',
      custom_domain: 'new.example.com'
    };

    const result = await updateAgency(updateInput);

    expect(result.id).toEqual(agencyId);
    expect(result.name).toEqual('Updated Agency Name');
    expect(result.logo_url).toEqual('https://example.com/new-logo.png');
    expect(result.favicon_url).toEqual('https://example.com/new-favicon.ico');
    expect(result.primary_color).toEqual('#0000FF');
    expect(result.secondary_color).toEqual('#FFFF00');
    expect(result.smtp_host).toEqual('new-smtp.example.com');
    expect(result.smtp_port).toEqual(465);
    expect(result.smtp_username).toEqual('new@example.com');
    expect(result.smtp_password).toEqual('newpassword123');
    expect(result.custom_domain).toEqual('new.example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const agencyId = await createTestAgency();

    const updateInput: UpdateAgencyInput = {
      id: agencyId,
      name: 'Partially Updated Agency',
      primary_color: '#FF00FF'
    };

    const result = await updateAgency(updateInput);

    expect(result.id).toEqual(agencyId);
    expect(result.name).toEqual('Partially Updated Agency');
    expect(result.primary_color).toEqual('#FF00FF');
    // Original values should remain unchanged
    expect(result.subdomain).toEqual('test-agency');
    expect(result.logo_url).toEqual('https://example.com/logo.png');
    expect(result.secondary_color).toEqual('#00FF00');
    expect(result.smtp_host).toEqual('smtp.example.com');
  });

  it('should set nullable fields to null', async () => {
    const agencyId = await createTestAgency();

    const updateInput: UpdateAgencyInput = {
      id: agencyId,
      logo_url: null,
      favicon_url: null,
      primary_color: null,
      smtp_host: null,
      smtp_port: null,
      custom_domain: null
    };

    const result = await updateAgency(updateInput);

    expect(result.logo_url).toBeNull();
    expect(result.favicon_url).toBeNull();
    expect(result.primary_color).toBeNull();
    expect(result.smtp_host).toBeNull();
    expect(result.smtp_port).toBeNull();
    expect(result.custom_domain).toBeNull();
    // Non-updated fields should remain unchanged
    expect(result.name).toEqual('Test Agency');
    expect(result.subdomain).toEqual('test-agency');
  });

  it('should save changes to database', async () => {
    const agencyId = await createTestAgency();

    const updateInput: UpdateAgencyInput = {
      id: agencyId,
      name: 'Database Updated Agency',
      primary_color: '#123456'
    };

    await updateAgency(updateInput);

    const agencies = await db.select()
      .from(agenciesTable)
      .where(eq(agenciesTable.id, agencyId))
      .execute();

    expect(agencies).toHaveLength(1);
    expect(agencies[0].name).toEqual('Database Updated Agency');
    expect(agencies[0].primary_color).toEqual('#123456');
    expect(agencies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent agency', async () => {
    const updateInput: UpdateAgencyInput = {
      id: 99999,
      name: 'Non-existent Agency'
    };

    await expect(updateAgency(updateInput)).rejects.toThrow(/Agency with id 99999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const agencyId = await createTestAgency();

    // Get original timestamp
    const originalAgency = await db.select()
      .from(agenciesTable)
      .where(eq(agenciesTable.id, agencyId))
      .execute();

    const originalUpdatedAt = originalAgency[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateAgencyInput = {
      id: agencyId,
      name: 'Updated Agency'
    };

    const result = await updateAgency(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
