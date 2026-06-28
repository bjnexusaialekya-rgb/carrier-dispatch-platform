import { requireRole } from "@/lib/auth/session";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/types/booking";

export default async function AdminDashboard() {
  const { supabase } = await requireRole("admin");

  const [shipmentsResult, auditResult] = await Promise.all([
    supabase
      .from("shipments")
      .select("*, vehicles(make, model, year), users(full_name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const shipments = shipmentsResult.data ?? [];
  const auditLogs = auditResult.data ?? [];

  const statusCounts = shipments.reduce(
    (acc, s) => {
      const status = s.status as ShipmentStatus;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div style={{ maxWidth: "1100px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1.5rem" }}>
        Admin Dashboard
      </h1>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
        {(["pending", "assigned", "in_transit", "delivered", "disputed"] as ShipmentStatus[]).map((s) => (
          <div
            key={s}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-brand-600)" }}>
              {statusCounts[s] ?? 0}
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
              {SHIPMENT_STATUS_LABELS[s]}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* All orders */}
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text)" }}>
            All Orders
          </h2>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-muted)" }}>
                  {["Client", "Vehicle", "Route", "Status", "Carrier"].map((h) => (
                    <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "left", fontWeight: 600, color: "var(--color-text-muted)", fontSize: "0.7rem" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 30).map((s, i) => {
                  const vehicle = s.vehicles as { make: string; model: string; year: number } | null;
                  const user = s.users as { full_name: string } | null;
                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: i < 29 ? "1px solid var(--color-border)" : "none" }}
                    >
                      <td style={{ padding: "0.625rem 0.75rem", color: "var(--color-text)" }}>
                        {user?.full_name ?? "—"}
                      </td>
                      <td style={{ padding: "0.625rem 0.75rem" }}>
                        {vehicle ? `${vehicle.year} ${vehicle.make}` : "—"}
                      </td>
                      <td style={{ padding: "0.625rem 0.75rem", color: "var(--color-text-muted)" }}>
                        {s.origin_city} → {s.destination_city}
                      </td>
                      <td style={{ padding: "0.625rem 0.75rem" }}>
                        {SHIPMENT_STATUS_LABELS[s.status as ShipmentStatus]}
                      </td>
                      <td style={{ padding: "0.625rem 0.75rem", color: "var(--color-text-muted)" }}>
                        {s.carrier_name ?? "Unassigned"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit trail */}
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text)" }}>
            Audit Trail
          </h2>
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.75rem",
                }}
              >
                <p style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: "0.125rem" }}>
                  {log.action.replace(/_/g, " ")}
                </p>
                <p style={{ color: "var(--color-text-muted)" }}>
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p style={{ padding: "1rem", color: "var(--color-text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
                No audit events yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
