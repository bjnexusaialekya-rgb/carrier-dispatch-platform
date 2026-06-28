import { requireAuth } from "@/lib/auth/session";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/types/booking";

export default async function AgentDashboard() {
  const { profile, supabase } = await requireAuth();

  // Agent sees all shipments (filtered by RLS policy for agent role)
  const { data: shipments } = await supabase
    .from("shipments")
    .select("*, vehicles(make, model, year), users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50);

  const statusCounts = (shipments ?? []).reduce(
    (acc, s) => {
      const status = s.status as ShipmentStatus;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div style={{ maxWidth: "1000px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1.5rem" }}>
        Agency Dashboard
      </h1>

      {/* Status summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        {(["in_transit", "assigned", "pending", "delivered"] as ShipmentStatus[]).map((s) => (
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
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-brand-600)" }}>
              {statusCounts[s] ?? 0}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
              {SHIPMENT_STATUS_LABELS[s]}
            </p>
          </div>
        ))}
      </div>

      {/* Shipment list */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-muted)" }}>
              {["Client", "Vehicle", "Route", "Status", "Date"].map((h) => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(shipments ?? []).map((s, i) => {
              const vehicle = s.vehicles as { make: string; model: string; year: number } | null;
              const user = s.users as { full_name: string; email: string } | null;
              return (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: i < (shipments?.length ?? 0) - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-text)" }}>
                    {user?.full_name ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-text)" }}>
                    {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>
                    {s.origin_city} → {s.destination_city}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {SHIPMENT_STATUS_LABELS[s.status as ShipmentStatus]}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
