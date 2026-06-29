export const runtime = "nodejs";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { ROLE_DASHBOARD_ROUTE } from "@/lib/types/roles";

const PUBLIC_ROUTES = ["/login", "/api/auth/callback"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role ?? "professional_athlete";
  const targetDashboard = ROLE_DASHBOARD_ROUTE[userRole as keyof typeof ROLE_DASHBOARD_ROUTE] ?? "/athlete";

  if (pathname === "/") {
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  if (pathname.startsWith("/athlete") && !["professional_athlete", "college_athlete"].includes(userRole)) {
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

