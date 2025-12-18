import { test as base, Page } from '@playwright/test';
import { createTestUser, deleteTestUser, createServiceRoleClient } from '../../utils/supabase-test-client';

/**
 * Test user data structure
 */
export interface TestUser {
  email: string;
  password: string;
  userId: string;
}

/**
 * Extended Playwright test with authentication fixtures
 */
export const test = base.extend<{
  testUser: TestUser;
  unverifiedUser: TestUser;
  authenticatedPage: Page;
}>({
  /**
   * Fixture: Verified test user
   * Creates a user with email_confirmed_at set (verified)
   */
  testUser: async ({}, use) => {
    const user = await createTestUser();

    // Ensure user is verified
    const supabase = createServiceRoleClient();
    await supabase.auth.admin.updateUserById(user.userId, {
      email_confirm: true,
    });

    await use(user);

    // Cleanup
    await deleteTestUser(user.userId);
  },

  /**
   * Fixture: Unverified test user
   * Creates a user with email_confirmed_at = null (not verified)
   */
  unverifiedUser: async ({}, use) => {
    const user = await createTestUser();

    // Ensure user is NOT verified
    const supabase = createServiceRoleClient();
    await supabase.auth.admin.updateUserById(user.userId, {
      email_confirm: false,
    });

    await use(user);

    // Cleanup
    await deleteTestUser(user.userId);
  },

  /**
   * Fixture: Pre-authenticated browser page
   * Provides a page with an active user session
   */
  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to auth page
    await page.goto('/auth');

    // Sign in
    await page.getByPlaceholder('Email').fill(testUser.email);
    await page.getByPlaceholder('Password').first().fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for navigation to complete
    await page.waitForURL((url) => !url.pathname.includes('/auth'));

    await use(page);
  },
});

export { expect } from '@playwright/test';
