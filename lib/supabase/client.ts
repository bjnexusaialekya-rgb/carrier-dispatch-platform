import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser-side Supabase client.
 * Uses NEXT_PUBLIC_ env var — sb_publishable_xxx key format.
 * NEVER pass SUPABASE_SECRET_KEY here — that is server-side only.
 *
 * Use this in Client Components only.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local."
  );
}

export const createBrowserClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey);
