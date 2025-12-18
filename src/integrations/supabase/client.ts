import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env or .env.local file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'science-canvas-creator@1.0.0'
    }
  }
});

// Connection monitoring for debugging (development only)
if (import.meta.env.DEV) {
  // Monitor active realtime channels
  setInterval(() => {
    const channels = supabase.getChannels();
    if (channels.length > 0) {
      console.log(`[Supabase] Active channels: ${channels.length}`, channels.map(c => c.topic));
    }
  }, 30000); // Log every 30 seconds if there are active channels
}