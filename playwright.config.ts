import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables for tests
// Prioritize .env.local over .env
const envLocalPath = resolve(__dirname, '.env.local');
const envPath = resolve(__dirname, '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Playwright E2E Test Configuration
 *
 * Tests authentication flows including:
 * - Signup and email verification
 * - Login and session management
 * - Unverified email handling
 * - Password reset flow
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run tests sequentially to avoid rate limiting
  fullyParallel: false,
  workers: 1,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: process.env.CI ? 'github' : 'html',

  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: 'http://localhost:8080',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Note: Tests expect dev server already running at http://localhost:8080
  // Start server manually with: npm run dev
});
