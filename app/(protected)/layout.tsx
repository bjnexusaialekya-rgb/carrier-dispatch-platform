import { requireAuth } from "@/lib/auth/session";
import { ROLE_LABELS, type UserRole } from "@/lib/types/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();

  const navLinks: { href: string; label: string }[] = [
    { href: "/book-shipment", label: "Book Shipment" },
    { href: "/vehicles", label: "My Vehicles" },
    { href: "/notifications", label: "Notifications" },
  ];

  if (profile.role === "admin") {
    navLinks.unshift({ href: "/admin", label: "Admin Dashboard" });
  } else if (["agent", "team_staff", "nil_collective"].includes(profile.role)) {
    navLinks.unshift({ href: "/agent", label: "Dashboard" });
  } else {
    navLinks.unshift({ href: "/athlete", label: "Dashboard" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surface-muted)" }}>
      <nav
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-brand-700)" }}>
          Bigfella Auto Express
        </span>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", textDecoration: "none" }}
            >
              {link.label}
            </a>
          ))}
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {ROLE_LABELS[profile.role as UserRole]} · {profile.full_name}
          </span>
        </div>
      </nav>
      <main style={{ padding: "2rem 1.5rem" }}>{children}</main>
    </div>
  );
}
