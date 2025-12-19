/**
 * Test IDs for E2E testing
 *
 * Organized by feature/page for easy navigation.
 * Use these enums in both components (data-testid) and tests (getByTestId).
 *
 * Naming convention: {domain}-{component}-{element}-{type}
 * - Enum keys: SCREAMING_SNAKE_CASE
 * - Enum values: kebab-case
 */

/**
 * Auth page test IDs
 * Used in: src/pages/Auth.tsx
 */
export enum AuthTestIds {
  // Sign-in form
  SIGNIN_EMAIL_INPUT = 'auth-signin-email-input',
  SIGNIN_PASSWORD_INPUT = 'auth-signin-password-input',
  SIGNIN_SUBMIT_BUTTON = 'auth-signin-submit-button',
  SIGNIN_ERROR_EMAIL = 'auth-signin-error-email',
  SIGNIN_ERROR_PASSWORD = 'auth-signin-error-password',

  // Sign-up form
  SIGNUP_NAME_INPUT = 'auth-signup-name-input',
  SIGNUP_EMAIL_INPUT = 'auth-signup-email-input',
  SIGNUP_PASSWORD_INPUT = 'auth-signup-password-input',
  SIGNUP_COUNTRY_SELECT = 'auth-signup-country-select',
  SIGNUP_FIELD_SELECT = 'auth-signup-field-select',
  SIGNUP_SUBMIT_BUTTON = 'auth-signup-submit-button',
  SIGNUP_ERROR_NAME = 'auth-signup-error-name',
  SIGNUP_ERROR_EMAIL = 'auth-signup-error-email',
  SIGNUP_ERROR_PASSWORD = 'auth-signup-error-password',
  SIGNUP_ERROR_COUNTRY = 'auth-signup-error-country',
  SIGNUP_ERROR_FIELD = 'auth-signup-error-field',

  // Password reset flow
  RESET_EMAIL_INPUT = 'auth-reset-email-input',
  RESET_SEND_BUTTON = 'auth-reset-send-button',
  RESET_BACK_BUTTON = 'auth-reset-back-button',
  RESET_ERROR_EMAIL = 'auth-reset-error-email',

  // Password update flow
  UPDATE_PASSWORD_INPUT = 'auth-update-password-input',
  UPDATE_CONFIRM_INPUT = 'auth-update-confirm-input',
  UPDATE_SUBMIT_BUTTON = 'auth-update-submit-button',
  UPDATE_ERROR_PASSWORD = 'auth-update-error-password',
  UPDATE_ERROR_CONFIRM = 'auth-update-error-confirm',

  // Tab navigation
  TAB_SIGNIN = 'auth-tab-signin',
  TAB_SIGNUP = 'auth-tab-signup',

  // Links
  FORGOT_PASSWORD_LINK = 'auth-forgot-password-link',

  // General errors
  ERROR_MESSAGE = 'auth-error-message',
}

/**
 * Verify Email page test IDs
 * Used in: src/pages/VerifyEmail.tsx
 */
export enum VerifyEmailTestIds {
  HEADING = 'verify-email-heading',
  EMAIL_DISPLAY = 'verify-email-email-display',
  VERIFICATION_MESSAGE = 'verify-email-verification-message',
  RESEND_BUTTON = 'verify-email-resend-button',
  BACK_TO_SIGNIN_BUTTON = 'verify-email-back-to-signin-button',
}

/**
 * Navigation test IDs
 * Used in: src/components/auth/UserMenu.tsx
 */
export enum NavigationTestIds {
  USER_MENU_TRIGGER = 'navigation-user-menu-trigger',
  SIGNOUT_BUTTON = 'navigation-signout-button',
}

/**
 * Toast notification test IDs
 * Used in: src/lib/toast-helpers.ts, src/components/ui/custom-toast.tsx
 */
export enum ToastTestIds {
  // Auth toasts
  AUTH_SIGNIN_SUCCESS = 'toast-auth-signin-success',
  AUTH_SIGNIN_ERROR = 'toast-auth-signin-error',
  AUTH_SIGNUP_SUCCESS = 'toast-auth-signup-success',
  AUTH_SIGNUP_ERROR = 'toast-auth-signup-error',
  AUTH_SIGNOUT_SUCCESS = 'toast-auth-signout-success',
  AUTH_SIGNOUT_ERROR = 'toast-auth-signout-error',
  AUTH_EMAIL_UNVERIFIED = 'toast-auth-email-unverified',

  // Password reset toasts
  PASSWORD_RESET_SENT_SUCCESS = 'toast-password-reset-sent-success',
  PASSWORD_RESET_SENT_ERROR = 'toast-password-reset-sent-error',
  PASSWORD_UPDATE_SUCCESS = 'toast-password-update-success',
  PASSWORD_UPDATE_ERROR = 'toast-password-update-error',

  // Verify email toasts
  VERIFY_EMAIL_RESEND_SUCCESS = 'toast-verify-email-resend-success',
  VERIFY_EMAIL_RESEND_ERROR = 'toast-verify-email-resend-error',
}
