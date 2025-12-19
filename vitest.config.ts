import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables for tests
const envLocalPath = resolve(__dirname, '.env.local');
const envPath = resolve(__dirname, '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export default defineConfig({
  test: {
    // Use node environment for Supabase client tests
    environment: 'node',

    // Test file patterns
    include: ['**/*.test.ts', '**/*.spec.ts'],

    // Exclude patterns
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],

    // Global timeout for database operations
    testTimeout: 10000,

    // Run tests sequentially to avoid race conditions with database
    sequence: {
      concurrent: false,
    },

    // Global setup
    globals: true,

    // Test reporters: console output + JSON for report generation
    reporters: ['default', 'json'],

    // JSON output location (can be overridden per suite via CLI)
    outputFile: {
      json: './test-results/vitest-results.json',
    },

    // Coverage configuration (optional)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
