import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Auth page (/auth)
 * Handles signup, login, and password reset interactions
 */
export class AuthPage {
  readonly page: Page;

  // Locators
  readonly emailInput: Locator;
  readonly signupPasswordInput: Locator;
  readonly signupConfirmPasswordInput: Locator;
  readonly signinPasswordInput: Locator;
  readonly signupButton: Locator;
  readonly signinButton: Locator;
  readonly switchToSignInButton: Locator;
  readonly switchToSignUpButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly resetPasswordEmailInput: Locator;
  readonly sendResetLinkButton: Locator;
  readonly backToSignInButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Input fields
    this.emailInput = page.getByPlaceholder('Email');
    this.signupPasswordInput = page.getByPlaceholder('Password').first();
    this.signupConfirmPasswordInput = page.getByPlaceholder('Confirm Password');
    this.signinPasswordInput = page.getByPlaceholder('Password').first();

    // Buttons
    this.signupButton = page.getByRole('button', { name: 'Sign Up' });
    this.signinButton = page.getByRole('button', { name: 'Sign In' });
    this.switchToSignInButton = page.getByRole('button', { name: /already have an account/i });
    this.switchToSignUpButton = page.getByRole('button', { name: /don't have an account/i });

    // Password reset
    this.forgotPasswordLink = page.getByText(/forgot password/i);
    this.resetPasswordEmailInput = page.getByPlaceholder('Email');
    this.sendResetLinkButton = page.getByRole('button', { name: /send reset link/i });
    this.backToSignInButton = page.getByRole('button', { name: /back to sign in/i });
  }

  /**
   * Navigate to the auth page
   */
  async goto() {
    await this.page.goto('/auth');
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.signupPasswordInput.fill(password);
    await this.signupConfirmPasswordInput.fill(password);
    await this.signupButton.click();
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.signinPasswordInput.fill(password);
    await this.signinButton.click();
  }

  /**
   * Switch to sign in mode
   */
  async switchToSignIn() {
    await this.switchToSignInButton.click();
  }

  /**
   * Switch to sign up mode
   */
  async switchToSignUp() {
    await this.switchToSignUpButton.click();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Submit password reset request
   */
  async submitPasswordReset(email: string) {
    await this.resetPasswordEmailInput.fill(email);
    await this.sendResetLinkButton.click();
  }

  /**
   * Click back to sign in
   */
  async clickBackToSignIn() {
    await this.backToSignInButton.click();
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    const errorElement = this.page.getByText(/error|invalid|failed/i).first();
    return await errorElement.isVisible().catch(() => false);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.getByText(/error|invalid|failed/i).first();
    return await errorElement.textContent().catch(() => null);
  }
}
