import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses the anon key — RLS is enforced.
 *
 * Cookie-bound: user's JWT is picked up from the request cookie automatically.
 * Use createAdminClient (admin.ts) only when you explicitly need to bypass RLS.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore: setAll called from a Server Component (read-only context).
          }
        },
      },
    }
  );
}
