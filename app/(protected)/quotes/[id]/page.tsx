import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/types/booking";
import { VEHICLE_TYPE_LABELS, type VehicleType } from "@/lib/types/vehicle";
import QuoteStatusLive from "./quote-status-live";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAuth();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("*, vehicles(*)")
    .eq("id", id)
    .single();

  if (!shipment) notFound();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("shipment_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const vehicle = shipment.vehicles as {
    make: string; model: string; year: number;
    vehicle_type: string; is_inoperable: boolean;
  } | null;

  return (
    <div style={{ maxWidth: "640px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <a href="/athlete" style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Back to shipments
        </a>
      </div>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1.5rem" }}>
        Shipment Details
      </h1>

      {/* Live status — client component with Postgres Changes + 30s fallback */}
      <QuoteStatusLive
        shipmentId={shipment.id}
        initialStatus={shipment.status as ShipmentStatus}
      />

      {/* Vehicle */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.25rem",
        marginBottom: "1rem",
      }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vehicle</p>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text)" }}>
          {vehicle?.year} {vehicle?.make} {vehicle?.model}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {VEHICLE_TYPE_LABELS[vehicle?.vehicle_type as VehicleType] ?? vehicle?.vehicle_type}
          {vehicle?.is_inoperable ? " · Inoperable" : ""}
        </p>
      </div>

      {/* Route */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.25rem",
        marginBottom: "1rem",
      }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Route</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Origin</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
              {shipment.origin_city}, {shipment.origin_state}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{shipment.origin_zip}</p>
          </div>
          <span style={{ color: "var(--color-text-muted)", fontSize: "1.25rem" }}>→</span>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Destination</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
              {shipment.destination_city}, {shipment.destination_state}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{shipment.destination_zip}</p>
          </div>
        </div>
        {shipment.estimated_miles && (
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.75rem" }}>
            ~{shipment.estimated_miles} miles
          </p>
        )}
      </div>

      {/* Quote */}
      {quote && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "1.25rem",
          marginBottom: "1rem",
        }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quote</p>
          {quote.quote_path === "MANUAL_REVIEW_REQUIRED" ? (
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-status-pending)", marginBottom: "0.25rem" }}>
                Manual Review Required
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                This lane has no historical pricing data. Our team will contact you with a custom quote shortly.
              </p>
            </div>
          ) : quote.quote_path === "PRICING_API_FAILED" ? (
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-status-cancelled)", marginBottom: "0.25rem" }}>
                Pricing Unavailable
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Our team has been alerted and will follow up within 1 business hour.
              </p>
            </div>
          ) : quote.shipper_quote ? (
            <div>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text)" }}>
                ${Number(quote.shipper_quote).toLocaleString()}
              </p>
              {quote.market_rate_low && quote.market_rate_high && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  Estimated range: ${Number(quote.market_rate_low).toLocaleString()} – ${Number(quote.market_rate_high).toLocaleString()}
                </p>
              )}
              <div style={{
                marginTop: "0.875rem",
                padding: "0.625rem 0.75rem",
                background: "var(--color-status-pending)11",
                border: "1px solid var(--color-status-pending)33",
                borderRadius: "var(--radius-md)",
              }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--color-text)" }}>Estimate only.</strong> This price is
                  based on route distance and current rate guidelines. Your final price is confirmed
                  once a carrier is assigned and may vary based on live carrier availability, fuel
                  costs, and seasonal demand.
                </p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Quote being calculated…</p>
          )}
        </div>
      )}

      {/* Carrier */}
      {shipment.carrier_name && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "1.25rem",
          marginBottom: "1rem",
        }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Carrier</p>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>{shipment.carrier_name}</p>
        </div>
      )}

      {/* Booking details */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.25rem",
      }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            ["Booking Model", shipment.booking_model === "full_service" ? "Full Service" : "Carrier Marketplace"],
            ["Service Tier", shipment.service_tier.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())],
            ["Order ID", shipment.order_guid],
            ["Booked", new Date(shipment.created_at).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
              <span style={{ color: "var(--color-text)", fontFamily: label === "Order ID" ? "var(--font-mono)" : undefined, fontSize: label === "Order ID" ? "0.75rem" : undefined }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
