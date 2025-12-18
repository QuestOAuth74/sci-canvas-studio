import { test, expect } from '../fixtures/auth';
import { AuthPage } from '../utils/page-objects/AuthPage';
import { INVALID_CREDENTIALS } from '../fixtures/test-data';
import { isAuthenticated, waitForAuthentication, waitForSessionClear } from '../utils/session-helpers';

test.describe('Login & Session Management', () => {
  test('user can sign in with valid credentials', async ({ page, testUser }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.signIn(testUser.email, testUser.password);

    // Should redirect away from auth page
    await page.waitForURL((url) => !url.pathname.includes('/auth'));

    // Verify authentication
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });

  test('invalid credentials display error', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.signIn(INVALID_CREDENTIALS.email, INVALID_CREDENTIALS.password);

    // Wait for error to appear
    await page.waitForTimeout(1000);

    // Check for error message
    const hasError = await authPage.hasErrorMessage();
    expect(hasError).toBe(true);

    // Should remain on auth page
    expect(page.url()).toContain('/auth');
  });

  test('session persists across page refresh', async ({ page, testUser }) => {
    const authPage = new AuthPage(page);

    // Sign in
    await authPage.goto();
    await authPage.signIn(testUser.email, testUser.password);

    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes('/auth'));

    // Verify authenticated
    let authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check session still exists
    authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });

  test('user can sign out successfully', async ({ page, testUser }) => {
    const authPage = new AuthPage(page);

    // Sign in first
    await authPage.goto();
    await authPage.signIn(testUser.email, testUser.password);

    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes('/auth'));

    // Find and click sign out button
    const signOutButton = page.getByRole('button', { name: /sign out|log out/i });
    await signOutButton.click();

    // Wait for navigation back to home or auth
    await page.waitForTimeout(1000);

    // Session should be cleared
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(false);
  });

  test('after sign out, session is cleared', async ({ page, testUser }) => {
    const authPage = new AuthPage(page);

    // Sign in first
    await authPage.goto();
    await authPage.signIn(testUser.email, testUser.password);

    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes('/auth'));

    // Verify authenticated
    let authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);

    // Sign out
    const signOutButton = page.getByRole('button', { name: /sign out|log out/i });
    await signOutButton.click();

    // Wait for session to clear
    const sessionCleared = await waitForSessionClear(page);
    expect(sessionCleared).toBe(true);

    // Double-check authentication status
    authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(false);
  });
});
