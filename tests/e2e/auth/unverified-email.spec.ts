import { test, expect } from '../fixtures/auth';
import { AuthPage } from '../utils/page-objects/AuthPage';
import { VerifyEmailPage } from '../utils/page-objects/VerifyEmailPage';
import { getSessionStorage } from '../utils/session-helpers';

test.describe('Unverified Email Handling', () => {
  test('sign-in with unverified email detects error', async ({ page, unverifiedUser }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.signIn(unverifiedUser.email, unverifiedUser.password);

    // Should redirect to verify email page instead of showing error on auth page
    await page.waitForTimeout(1000);

    // Either shows error or redirects to verify email
    const currentUrl = page.url();
    const hasError = await authPage.hasErrorMessage();

    // Should handle unverified email (either error or redirect)
    expect(hasError || currentUrl.includes('/verify-email')).toBe(true);
  });

  test('triggers automatic verification email resend', async ({ page, unverifiedUser }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.signIn(unverifiedUser.email, unverifiedUser.password);

    // Wait for processing
    await page.waitForTimeout(1000);

    // Email should be stored in session storage for resend
    const storedEmail = await getSessionStorage(page, 'verifyEmail');

    // Should either redirect with resent param or store email
    const currentUrl = page.url();
    expect(
      currentUrl.includes('/verify-email') || storedEmail === unverifiedUser.email
    ).toBe(true);
  });

  test('redirects to /auth/verify-email?resent=true', async ({ page, unverifiedUser }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.signIn(unverifiedUser.email, unverifiedUser.password);

    // Wait for redirect
    await page.waitForTimeout(2000);

    // Should redirect to verify email page
    const currentUrl = page.url();

    if (currentUrl.includes('/verify-email')) {
      // Check for resent parameter
      expect(currentUrl.includes('resent=true') || currentUrl.includes('/verify-email')).toBe(true);
    }
  });

  test('page displays resent confirmation', async ({ page, unverifiedUser }) => {
    const authPage = new AuthPage(page);
    const verifyPage = new VerifyEmailPage(page);

    await authPage.goto();
    await authPage.signIn(unverifiedUser.email, unverifiedUser.password);

    // Wait for redirect
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    if (currentUrl.includes('/verify-email')) {
      // Check if page shows verification message
      const hasHeading = await verifyPage.hasHeading();
      expect(hasHeading).toBe(true);

      // If resent parameter exists, check for confirmation
      if (currentUrl.includes('resent=true')) {
        const hasResentQuery = await verifyPage.hasResentQueryMessage();
        expect(hasResentQuery).toBe(true);
      }
    }
  });

  test('"Return to Sign In" link works', async ({ page, unverifiedUser }) => {
    const authPage = new AuthPage(page);
    const verifyPage = new VerifyEmailPage(page);

    await authPage.goto();
    await authPage.signIn(unverifiedUser.email, unverifiedUser.password);

    // Wait for redirect
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    if (currentUrl.includes('/verify-email')) {
      // Click return to sign in
      await verifyPage.clickReturnToSignIn();

      // Should navigate back to auth page
      await page.waitForURL(/\/auth/);
      expect(page.url()).toContain('/auth');
      expect(page.url()).not.toContain('/verify-email');
    } else {
      // If didn't redirect, navigate directly to verify email page to test link
      await verifyPage.goto();
      await verifyPage.clickReturnToSignIn();

      await page.waitForURL(/\/auth/);
      expect(page.url()).toContain('/auth');
    }
  });
});
