import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Admin Supabase client — uses SUPABASE_SECRET_KEY (service_role).
 *
 * ⚠ THIS BYPASSES ROW LEVEL SECURITY. Use only for:
 *   - Stripe webhook processing (processed_webhooks upsert)
 *   - Zelle confirmation by admin
 *   - Background jobs that need cross-user data
 *
 * NEVER import this file in any client bundle or Client Component.
 * SUPABASE_SECRET_KEY must use sb_secret_xxx format (new rotatable format).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. " +
        "Ensure SUPABASE_SECRET_KEY uses the sb_secret_xxx format."
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
