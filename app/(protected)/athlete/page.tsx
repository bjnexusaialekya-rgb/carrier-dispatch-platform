import { requireAuth } from "@/lib/auth/session";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/types/booking";

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: "var(--color-status-pending)",
  quoted: "var(--color-brand-500)",
  accepted: "var(--color-brand-500)",
  assigned: "var(--color-status-assigned)",
  picked_up: "var(--color-status-picked-up)",
  in_transit: "var(--color-status-picked-up)",
  delivered: "var(--color-status-delivered)",
  cancelled: "var(--color-status-cancelled)",
  disputed: "var(--color-status-disputed)",
};

export default async function AthleteDashboard() {
  const { profile, supabase } = await requireAuth();

  const { data: shipments } = await supabase
    .from("shipments")
    .select("*, vehicles(make, model, year)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
          My Shipments
        </h1>
        <a
          href="/book-shipment"
          style={{
            padding: "0.5rem 1.25rem",
            background: "var(--color-brand-600)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Book Shipment
        </a>
      </div>

      {!shipments || shipments.length === 0 ? (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "3rem",
            textAlign: "center",
            color: "var(--color-text-muted)",
          }}
        >
          <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No shipments yet</p>
          <p style={{ fontSize: "0.875rem" }}>
            Book your first vehicle transport to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {shipments.map((shipment) => {
            const status = shipment.status as ShipmentStatus;
            return (
              <a
                key={shipment.id}
                href={`/quotes/${shipment.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.25rem" }}>
                      {(shipment.vehicles as { make: string; model: string; year: number } | null)?.year}{" "}
                      {(shipment.vehicles as { make: string; model: string; year: number } | null)?.make}{" "}
                      {(shipment.vehicles as { make: string; model: string; year: number } | null)?.model}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {shipment.origin_city}, {shipment.origin_state} →{" "}
                      {shipment.destination_city}, {shipment.destination_state}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: `${STATUS_COLORS[status]}22`,
                      color: STATUS_COLORS[status],
                      whiteSpace: "nowrap",
                    }}
                  >
                    {SHIPMENT_STATUS_LABELS[status]}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
