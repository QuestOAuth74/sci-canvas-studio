import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  // Reporter to use - list reporter with detailed output
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Output directory for test results
  outputDir: 'test-results',

  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: 'http://localhost:8080',

    // Test ID attribute for getByTestId()
    testIdAttribute: 'data-testid',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
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
