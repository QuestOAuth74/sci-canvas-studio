import { test as base, Page } from '@playwright/test';
import { createTestUser, deleteTestUser, createServiceRoleClient } from '../../utils/supabase-test-client';
import { AuthTestIds } from '@/lib/test-ids';

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
    // Create user as unverified from the start
    const user = await createTestUser('test', false);

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

    // Sign in using test IDs
    await page.getByTestId(AuthTestIds.SIGNIN_EMAIL_INPUT).fill(testUser.email);
    await page.getByTestId(AuthTestIds.SIGNIN_PASSWORD_INPUT).fill(testUser.password);
    await page.getByTestId(AuthTestIds.SIGNIN_SUBMIT_BUTTON).click();

    // Wait for navigation to complete
    await page.waitForURL((url) => !url.pathname.includes('/auth'));

    await use(page);
  },
});

export { expect } from '@playwright/test';
