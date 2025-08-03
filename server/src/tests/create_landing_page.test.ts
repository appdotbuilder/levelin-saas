
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, landingPagesTable } from '../db/schema';
import { type CreateLandingPageInput } from '../schema';
import { createLandingPage } from '../handlers/create_landing_page';
import { eq } from 'drizzle-orm';

describe('createLandingPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let agencyId: number;
  let userId: number;

  beforeEach(async () => {
    // Create test agency
    const agency = await db.insert(agenciesTable)
      .values({
        name: 'Test Agency',
        subdomain: 'test-agency'
      })
      .returning()
      .execute();
    agencyId = agency[0].id;

    // Create test user
    const user = await db.insert(usersTable)
      .values({
        clerk_id: 'clerk_test_123',
        agency_id: agencyId,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'staff'
      })
      .returning()
      .execute();
    userId = user[0].id;
  });

  const testInput: CreateLandingPageInput = {
    agency_id: 0, // Will be set in test
    title: 'Test Landing Page',
    slug: 'test-landing-page',
    template_id: 'template_123',
    content: { hero: 'Welcome to our page!' },
    custom_domain: 'example.com',
    meta_title: 'Test Page Meta Title',
    meta_description: 'Test page meta description',
    created_by: 0 // Will be set in test
  };

  it('should create a landing page', async () => {
    const input = { ...testInput, agency_id: agencyId, created_by: userId };
    const result = await createLandingPage(input);

    // Basic field validation
    expect(result.title).toEqual('Test Landing Page');
    expect(result.slug).toEqual('test-landing-page');
    expect(result.template_id).toEqual('template_123');
    expect(result.content).toEqual({ hero: 'Welcome to our page!' });
    expect(result.status).toEqual('draft');
    expect(result.custom_domain).toEqual('example.com');
    expect(result.meta_title).toEqual('Test Page Meta Title');
    expect(result.meta_description).toEqual('Test page meta description');
    expect(result.agency_id).toEqual(agencyId);
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.published_at).toBeNull();
  });

  it('should save landing page to database', async () => {
    const input = { ...testInput, agency_id: agencyId, created_by: userId };
    const result = await createLandingPage(input);

    // Query using proper drizzle syntax
    const landingPages = await db.select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.id, result.id))
      .execute();

    expect(landingPages).toHaveLength(1);
    expect(landingPages[0].title).toEqual('Test Landing Page');
    expect(landingPages[0].slug).toEqual('test-landing-page');
    expect(landingPages[0].template_id).toEqual('template_123');
    expect(landingPages[0].content).toEqual({ hero: 'Welcome to our page!' });
    expect(landingPages[0].status).toEqual('draft');
    expect(landingPages[0].custom_domain).toEqual('example.com');
    expect(landingPages[0].meta_title).toEqual('Test Page Meta Title');
    expect(landingPages[0].meta_description).toEqual('Test page meta description');
    expect(landingPages[0].agency_id).toEqual(agencyId);
    expect(landingPages[0].created_by).toEqual(userId);
    expect(landingPages[0].created_at).toBeInstanceOf(Date);
    expect(landingPages[0].updated_at).toBeInstanceOf(Date);
    expect(landingPages[0].published_at).toBeNull();
  });

  it('should create landing page with minimal required fields', async () => {
    const minimalInput: CreateLandingPageInput = {
      agency_id: agencyId,
      title: 'Minimal Landing Page',
      slug: 'minimal-page',
      template_id: 'basic_template',
      content: {},
      created_by: userId
    };

    const result = await createLandingPage(minimalInput);

    expect(result.title).toEqual('Minimal Landing Page');
    expect(result.slug).toEqual('minimal-page');
    expect(result.template_id).toEqual('basic_template');
    expect(result.content).toEqual({});
    expect(result.status).toEqual('draft');
    expect(result.custom_domain).toBeNull();
    expect(result.meta_title).toBeNull();
    expect(result.meta_description).toBeNull();
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle complex content structure', async () => {
    const complexContent = {
      hero: {
        title: 'Welcome',
        subtitle: 'To our amazing service',
        cta: 'Get Started'
      },
      features: [
        { title: 'Feature 1', description: 'Amazing feature' },
        { title: 'Feature 2', description: 'Another great feature' }
      ],
      testimonials: {
        enabled: true,
        items: ['Great service!', 'Highly recommend']
      }
    };

    const input: CreateLandingPageInput = {
      agency_id: agencyId,
      title: 'Complex Content Page',
      slug: 'complex-content',
      template_id: 'advanced_template',
      content: complexContent,
      created_by: userId
    };

    const result = await createLandingPage(input);

    expect(result.content).toEqual(complexContent);

    // Verify in database
    const saved = await db.select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.id, result.id))
      .execute();

    expect(saved[0].content).toEqual(complexContent);
  });
});
