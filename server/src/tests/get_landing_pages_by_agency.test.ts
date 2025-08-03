
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, landingPagesTable } from '../db/schema';
import { type CreateAgencyInput, type CreateUserInput, type CreateLandingPageInput } from '../schema';
import { getLandingPagesByAgency } from '../handlers/get_landing_pages_by_agency';

describe('getLandingPagesByAgency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return landing pages for a specific agency', async () => {
    // Create test agency
    const agencyData: CreateAgencyInput = {
      name: 'Test Agency',
      subdomain: 'test-agency'
    };

    const [agency] = await db.insert(agenciesTable)
      .values(agencyData)
      .returning()
      .execute();

    // Create test user
    const userData: CreateUserInput = {
      clerk_id: 'clerk_123',
      agency_id: agency.id,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'staff'
    };

    const [user] = await db.insert(usersTable)
      .values(userData)
      .returning()
      .execute();

    // Create test landing pages
    const landingPage1: CreateLandingPageInput = {
      agency_id: agency.id,
      title: 'Landing Page 1',
      slug: 'landing-page-1',
      template_id: 'template-1',
      content: {},
      created_by: user.id
    };

    const landingPage2: CreateLandingPageInput = {
      agency_id: agency.id,
      title: 'Landing Page 2',
      slug: 'landing-page-2',
      template_id: 'template-2',
      content: { hero: { title: 'Custom Title' } },
      meta_title: 'SEO Title',
      meta_description: 'SEO Description',
      created_by: user.id
    };

    await db.insert(landingPagesTable)
      .values([landingPage1, landingPage2])
      .execute();

    // Test the handler
    const result = await getLandingPagesByAgency(agency.id);

    expect(result).toHaveLength(2);
    
    // Check first landing page
    const page1 = result.find(p => p.title === 'Landing Page 1');
    expect(page1).toBeDefined();
    expect(page1!.slug).toEqual('landing-page-1');
    expect(page1!.template_id).toEqual('template-1');
    expect(page1!.status).toEqual('draft');
    expect(page1!.content).toEqual({});
    expect(page1!.agency_id).toEqual(agency.id);
    expect(page1!.created_by).toEqual(user.id);
    expect(page1!.created_at).toBeInstanceOf(Date);
    expect(page1!.updated_at).toBeInstanceOf(Date);

    // Check second landing page
    const page2 = result.find(p => p.title === 'Landing Page 2');
    expect(page2).toBeDefined();
    expect(page2!.slug).toEqual('landing-page-2');
    expect(page2!.template_id).toEqual('template-2');
    expect(page2!.content).toEqual({ hero: { title: 'Custom Title' } });
    expect(page2!.meta_title).toEqual('SEO Title');
    expect(page2!.meta_description).toEqual('SEO Description');
    expect(page2!.agency_id).toEqual(agency.id);
  });

  it('should return empty array when agency has no landing pages', async () => {
    // Create test agency
    const agencyData: CreateAgencyInput = {
      name: 'Empty Agency',
      subdomain: 'empty-agency'
    };

    const [agency] = await db.insert(agenciesTable)
      .values(agencyData)
      .returning()
      .execute();

    const result = await getLandingPagesByAgency(agency.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return landing pages for the specified agency', async () => {
    // Create two agencies
    const agency1Data: CreateAgencyInput = {
      name: 'Agency 1',
      subdomain: 'agency-1'
    };

    const agency2Data: CreateAgencyInput = {
      name: 'Agency 2',
      subdomain: 'agency-2'
    };

    const [agency1] = await db.insert(agenciesTable)
      .values(agency1Data)
      .returning()
      .execute();

    const [agency2] = await db.insert(agenciesTable)
      .values(agency2Data)
      .returning()
      .execute();

    // Create users for both agencies
    const user1Data: CreateUserInput = {
      clerk_id: 'clerk_agency1',
      agency_id: agency1.id,
      email: 'user1@example.com',
      first_name: 'User',
      last_name: 'One',
      role: 'staff'
    };

    const user2Data: CreateUserInput = {
      clerk_id: 'clerk_agency2',
      agency_id: agency2.id,
      email: 'user2@example.com',
      first_name: 'User',
      last_name: 'Two',
      role: 'staff'
    };

    const [user1] = await db.insert(usersTable)
      .values(user1Data)
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values(user2Data)
      .returning()
      .execute();

    // Create landing pages for both agencies
    const landingPagesData: CreateLandingPageInput[] = [
      {
        agency_id: agency1.id,
        title: 'Agency 1 Page 1',
        slug: 'agency-1-page-1',
        template_id: 'template-1',
        content: {},
        created_by: user1.id
      },
      {
        agency_id: agency1.id,
        title: 'Agency 1 Page 2',
        slug: 'agency-1-page-2',
        template_id: 'template-1',
        content: {},
        created_by: user1.id
      },
      {
        agency_id: agency2.id,
        title: 'Agency 2 Page 1',
        slug: 'agency-2-page-1',
        template_id: 'template-2',
        content: {},
        created_by: user2.id
      }
    ];

    await db.insert(landingPagesTable)
      .values(landingPagesData)
      .execute();

    // Test that only agency1's landing pages are returned
    const result = await getLandingPagesByAgency(agency1.id);

    expect(result).toHaveLength(2);
    result.forEach(page => {
      expect(page.agency_id).toEqual(agency1.id);
      expect(page.title).toMatch(/^Agency 1/);
    });

    // Verify titles
    const titles = result.map(p => p.title).sort();
    expect(titles).toEqual(['Agency 1 Page 1', 'Agency 1 Page 2']);
  });

  it('should return empty array for non-existent agency', async () => {
    const nonExistentAgencyId = 9999;

    const result = await getLandingPagesByAgency(nonExistentAgencyId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
