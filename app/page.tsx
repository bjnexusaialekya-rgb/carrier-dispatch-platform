import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ROLE_DASHBOARD_ROUTE, type UserRole } from "@/lib/types/roles";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const route =
    ROLE_DASHBOARD_ROUTE[(profile?.role as UserRole) ?? "professional_athlete"] ??
    "/athlete";

  redirect(route);
}
