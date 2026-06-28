import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ROLE_DASHBOARD_ROUTE, type UserRole } from "@/lib/types/roles";

/**
 * Validates the current session server-side and returns user + profile.
 * Redirects to /login if not authenticated.
 * Call this at the top of every protected Server Component.
 */
export async function requireAuth() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return { user, profile, supabase };
}

/**
 * Requires a specific role — redirects to the role's own dashboard if wrong.
 */
export async function requireRole(role: UserRole) {
  const { user, profile, supabase } = await requireAuth();

  if (profile.role !== role) {
    const dashboardRoute = ROLE_DASHBOARD_ROUTE[profile.role as UserRole] ?? "/athlete";
    redirect(dashboardRoute);
  }

  return { user, profile, supabase };
}
