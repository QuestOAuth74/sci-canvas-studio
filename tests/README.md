# Testing Guide - Science Canvas Creator

## Overview

This directory contains automated tests to verify that Milestone 1 (Database & Authentication) requirements are fully implemented and working correctly.

## Test Structure

```
tests/
├── utils/
│   └── supabase-test-client.ts    # Test utilities for Supabase connections
├── database/
│   ├── seed-verification.test.ts   # Database seeding verification tests
│   └── rls-policies.test.ts        # RLS policy verification tests
└── README.md                        # This file
```

## Prerequisites

### Environment Variables

Tests require the following environment variables in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Database State

Tests assume:
1. ✅ All migrations have been applied (`supabase db push`)
2. ✅ Database has been seeded (`npm run seed`)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests once (CI mode)
```bash
npm run test:run
```

### Run with UI
```bash
npm run test:ui
```

### Run only Milestone 1 tests
```bash
npm run test:milestone1
```

### Run with coverage
```bash
npm run test:coverage
```

## Test Suites

### Database Seeding Verification (`seed-verification.test.ts`)

Verifies that the seed script successfully populated the database:

- ✅ 12 icon categories exist
- ✅ Each category has at least one sample icon
- ✅ Blog categories (5+) and tags (10+) exist
- ✅ Site settings exist with correct structure
- ✅ Testimonials are seeded
- ✅ Admin role assignment (if user exists)
- ✅ At least 20 sample icons distributed across categories

### RLS Policy Verification (`rls-policies.test.ts`)

Verifies Row Level Security policies work correctly:

#### Icons & Categories
- ✅ Unauthenticated users can read icons
- ✅ Unauthenticated users can read icon_categories
- ✅ Authenticated users can read icons
- ✅ Authenticated users can read icon_categories
- ✅ Non-admin users cannot insert/update/delete icons

#### Profiles
- ✅ User can SELECT their own profile
- ✅ User can UPDATE their own profile
- ✅ User cannot SELECT another user's profile
- ✅ User cannot UPDATE another user's profile
- ✅ Unauthenticated users cannot INSERT profiles
- ✅ Profile created automatically via trigger on signup

#### Canvas Projects
- ✅ User can view their own projects
- ✅ User can view public approved projects
- ✅ User cannot access another user's private project
- ✅ Admin can access all projects (if admin exists)

#### Login Attempts
- ✅ Service role can insert login attempts
- ✅ Regular users cannot access login_attempts table

## Manual Testing Checklist

Some aspects require manual verification:

### Seed Script Idempotency
- [ ] Run `npm run seed` multiple times
- [ ] Verify no errors occur
- [ ] Verify data is not duplicated (uses upsert/count checks)

### Seed Script Error Handling
- [ ] Test with invalid Supabase URL
- [ ] Test with invalid service role key
- [ ] Verify clear error messages are shown

## Test Utilities

### `supabase-test-client.ts`

Provides helper functions for tests:

- **`createServiceRoleClient()`** - Creates client with service role (bypasses RLS)
- **`createAnonClient()`** - Creates anonymous client (subject to RLS)
- **`createAuthenticatedClient(email, password)`** - Signs in and returns authenticated client
- **`createTestUser(prefix)`** - Creates a test user account
- **`deleteTestUser(userId)`** - Deletes a test user account
- **`cleanupTestData(table, condition)`** - Helper to clean up test data

## Troubleshooting

### Tests Fail with "Missing environment variables"
- Ensure `.env.local` exists with required variables
- Run from project root directory

### Tests Fail with "Permission denied"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (not anon key)
- Check migrations have been applied

### Tests Fail with "Table not found"
- Run migrations: `supabase db push`
- Run seed script: `npm run seed`

### RLS Tests Fail Intermittently
- Tests run sequentially to avoid race conditions
- If issues persist, check for concurrent database connections

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm run test:run
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SERVICE_ROLE_KEY }}
    VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.PUBLISHABLE_KEY }}
```

## Test Coverage

Current test coverage focuses on:
- ✅ Database seeding verification
- ✅ RLS policy correctness
- ✅ Authentication and authorization flows

Future test areas (not in Milestone 1):
- [ ] Canvas editor functionality
- [ ] Blog post CRUD operations
- [ ] Community features
- [ ] Icon library operations
- [ ] Export functionality

## Contributing

When adding new tests:
1. Place tests in appropriate subdirectory (`database/`, `api/`, `ui/`, etc.)
2. Follow naming convention: `feature-name.test.ts`
3. Use descriptive test names
4. Clean up test data in `afterAll()` hooks
5. Update this README with new test suites

## Related Documentation

- [Milestone 1 Requirements](../docs/milestones_12-Dec-25.md#1-database)
- [Vitest Documentation](https://vitest.dev/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
