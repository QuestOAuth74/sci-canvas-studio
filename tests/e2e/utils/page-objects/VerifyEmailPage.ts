import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Verify Email page (/auth/verify-email)
 * Handles email verification flow and resend functionality
 */
export class VerifyEmailPage {
  readonly page: Page;

  // Locators
  readonly heading: Locator;
  readonly emailDisplay: Locator;
  readonly returnToSignInLink: Locator;
  readonly resendButton: Locator;
  readonly resentConfirmation: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page elements
    this.heading = page.getByRole('heading', { name: /check your email/i });
    this.emailDisplay = page.locator('text=/sent.*to/i');
    this.returnToSignInLink = page.getByRole('link', { name: /return to sign in/i });
    this.resendButton = page.getByRole('button', { name: /resend/i });
    this.resentConfirmation = page.getByText(/verification email.*sent/i);
  }

  /**
   * Navigate to the verify email page
   */
  async goto() {
    await this.page.goto('/auth/verify-email');
  }

  /**
   * Check if heading is visible
   */
  async hasHeading(): Promise<boolean> {
    return await this.heading.isVisible();
  }

  /**
   * Get the displayed email address
   */
  async getDisplayedEmail(): Promise<string | null> {
    const text = await this.emailDisplay.textContent();
    if (!text) return null;

    // Extract email from text like "We've sent a verification email to user@example.com"
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return emailMatch ? emailMatch[0] : null;
  }

  /**
   * Click return to sign in link
   */
  async clickReturnToSignIn() {
    await this.returnToSignInLink.click();
  }

  /**
   * Click resend verification email button
   */
  async clickResend() {
    await this.resendButton.click();
  }

  /**
   * Check if resent confirmation is visible
   */
  async hasResentConfirmation(): Promise<boolean> {
    return await this.resentConfirmation.isVisible();
  }

  /**
   * Check if page displays resent query parameter message
   */
  async hasResentQueryMessage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('resent=true');
  }
}
