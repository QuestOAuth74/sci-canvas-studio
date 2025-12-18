/**
 * Test data generators for E2E tests
 */

let testCounter = 0;

/**
 * Generates a unique test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  testCounter++;
  return `e2e-test-${timestamp}-${testCounter}@example.com`;
}

/**
 * Generates a test password that meets requirements
 * Minimum 6 characters (Supabase default)
 */
export function generateTestPassword(): string {
  return 'TestPass123!';
}

/**
 * Generates test user credentials
 */
export function generateTestCredentials() {
  return {
    email: generateTestEmail(),
    password: generateTestPassword(),
  };
}

/**
 * Test data for invalid credentials
 */
export const INVALID_CREDENTIALS = {
  email: 'nonexistent@example.com',
  password: 'WrongPassword123!',
};

/**
 * Test data for invalid email formats
 */
export const INVALID_EMAILS = [
  'not-an-email',
  '@example.com',
  'user@',
  'user space@example.com',
];

/**
 * Test data for weak passwords
 */
export const WEAK_PASSWORDS = [
  '123',      // Too short
  '12345',    // Too short
  'abc',      // Too short
];
