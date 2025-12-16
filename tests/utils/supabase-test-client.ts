import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase URL and keys from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required for tests');
}

/**
 * Create a Supabase client with service role key (bypasses RLS)
 * Use this for tests that need to verify data exists regardless of RLS
 */
export function createServiceRoleClient(): SupabaseClient {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service role tests');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client with anon key (subject to RLS)
 * Use this for tests that verify unauthenticated user access
 */
export function createAnonClient(): SupabaseClient {
  if (!anonKey) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is required for anon tests');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client and sign in as a test user
 * Use this for tests that verify authenticated user access
 */
export async function createAuthenticatedClient(
  email: string,
  password: string
): Promise<SupabaseClient> {
  if (!anonKey) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is required for authenticated tests');
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`);
  }

  return client;
}

/**
 * Create a test user account
 * Returns the user email and password for subsequent authentication
 */
export async function createTestUser(
  emailPrefix: string = 'test'
): Promise<{ email: string; password: string; userId: string }> {
  const serviceClient = createServiceRoleClient();
  const timestamp = Date.now();
  const email = `${emailPrefix}-${timestamp}@test.com`;
  const password = `TestPassword123!${timestamp}`;

  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  return {
    email,
    password,
    userId: data.user.id,
  };
}

/**
 * Delete a test user account
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient.auth.admin.deleteUser(userId);

  if (error) {
    console.warn(`Failed to delete test user ${userId}:`, error.message);
  }
}

/**
 * Helper to clean up test data
 * Use with caution - only for test data!
 */
export async function cleanupTestData(tableName: string, condition: Record<string, any>) {
  const serviceClient = createServiceRoleClient();

  const { error } = await serviceClient
    .from(tableName)
    .delete()
    .match(condition);

  if (error) {
    console.warn(`Failed to cleanup test data from ${tableName}:`, error.message);
  }
}
