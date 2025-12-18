/**
 * Supabase Auth Client
 * 
 * Minimal Supabase client for JWT verification only.
 * The main database operations use direct PostgreSQL.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import config from "../config/index.js";

let supabaseAuth: SupabaseClient | null = null;

/**
 * Get Supabase client for authentication.
 * Uses anon key since we're only verifying JWTs.
 */
export function getSupabaseAuth(): SupabaseClient {
  if (!supabaseAuth) {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required for authentication");
    }

    supabaseAuth = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAuth;
}

