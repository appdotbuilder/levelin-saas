
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { agenciesTable, usersTable, landingPagesTable } from '../db/schema';
import { type CreateAgencyInput, type CreateUserInput, type CreateLandingPageInput } from '../schema';
import { publishLandingPage } from '../handlers/publish_landing_page';
import { eq } from 'drizzle-orm';

// Test data setup
const testAgency: CreateAgencyInput = {
  name: 'Test Agency',
  subdomain: 'test-agency'
};

const testUser: CreateUserInput = {
  clerk_id: 'clerk_test_user',
  agency_id: 1, // Will be set after agency creation
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'agency-owner'
};

const testLandingPage: CreateLandingPageInput = {
  agency_id: 1, // Will be set after agency creation
  title: 'Test Landing Page',
  slug: 'test-landing-page',
  template_id: 'template-1',
  content: { hero: 'Welcome to our page' },
  meta_title: 'Test Page Title',
  meta_description: 'Test page description',
  created_by: 1 // Will be set after user creation
};

describe('publishLandingPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should publish a draft landing page', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        ...testUser,
        agency_id: agency[0].id
      })
      .returning()
      .execute();

    const landingPage = await db.insert(landingPagesTable)
      .values({
        ...testLandingPage,
        agency_id: agency[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Verify initial state is draft
    expect(landingPage[0].status).toBe('draft');
    expect(landingPage[0].published_at).toBeNull();

    // Publish the landing page
    const result = await publishLandingPage(landingPage[0].id);

    // Verify the result
    expect(result.id).toBe(landingPage[0].id);
    expect(result.status).toBe('published');
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.title).toBe('Test Landing Page');
    expect(result.slug).toBe('test-landing-page');
  });

  it('should update the database record correctly', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        ...testUser,
        agency_id: agency[0].id
      })
      .returning()
      .execute();

    const landingPage = await db.insert(landingPagesTable)
      .values({
        ...testLandingPage,
        agency_id: agency[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Publish the landing page
    await publishLandingPage(landingPage[0].id);

    // Verify database was updated
    const updatedPage = await db.select()
      .from(landingPagesTable)
      .where(eq(landingPagesTable.id, landingPage[0].id))
      .execute();

    expect(updatedPage).toHaveLength(1);
    expect(updatedPage[0].status).toBe('published');
    expect(updatedPage[0].published_at).toBeInstanceOf(Date);
    expect(updatedPage[0].updated_at).toBeInstanceOf(Date);
    
    // Verify published_at is recent (within last minute)
    const now = new Date();
    const publishedAt = updatedPage[0].published_at!;
    const timeDiff = now.getTime() - publishedAt.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });

  it('should publish an already published page', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)
      .values({
        ...testUser,
        agency_id: agency[0].id
      })
      .returning()
      .execute();

    // Create already published landing page
    const publishedDate = new Date('2024-01-01');
    const landingPage = await db.insert(landingPagesTable)
      .values({
        ...testLandingPage,
        agency_id: agency[0].id,
        created_by: user[0].id,
        status: 'published',
        published_at: publishedDate
      })
      .returning()
      .execute();

    // Publish again
    const result = await publishLandingPage(landingPage[0].id);

    // Should still be published with updated timestamp
    expect(result.status).toBe('published');
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at!.getTime()).toBeGreaterThan(publishedDate.getTime());
  });

  it('should throw error for non-existent landing page', async () => {
    const nonExistentId = 999;

    await expect(publishLandingPage(nonExistentId))
      .rejects
      .toThrow(/Landing page with id 999 not found/i);
  });

  it('should preserve all other landing page data', async () => {
    // Create prerequisite data
    const agency = await db.insert(agenciesTable)
      .values(testAgency)
      .returning()
      .execute();

    const user = await db.insert(usersTable)  
      .values({
        ...testUser,
        agency_id: agency[0].id
      })
      .returning()
      .execute();

    const landingPage = await db.insert(landingPagesTable)
      .values({
        ...testLandingPage,
        agency_id: agency[0].id,
        created_by: user[0].id
      })
      .returning()
      .execute();

    // Publish the landing page
    const result = await publishLandingPage(landingPage[0].id);

    // Verify all original data is preserved
    expect(result.agency_id).toBe(agency[0].id);
    expect(result.title).toBe('Test Landing Page');
    expect(result.slug).toBe('test-landing-page');
    expect(result.template_id).toBe('template-1');
    expect(result.content).toEqual({ hero: 'Welcome to our page' });
    expect(result.meta_title).toBe('Test Page Title');
    expect(result.meta_description).toBe('Test page description');
    expect(result.created_by).toBe(user[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
