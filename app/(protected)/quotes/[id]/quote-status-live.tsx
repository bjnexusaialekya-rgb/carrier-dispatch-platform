"use client";

import { useRealtimeStatus } from "@/hooks/use-realtime-status";
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

export default function QuoteStatusLive({
  shipmentId,
  initialStatus,
}: {
  shipmentId: string;
  initialStatus: ShipmentStatus;
}) {
  const { status, isConnected } = useRealtimeStatus({ shipmentId, initialStatus });
  const color = STATUS_COLORS[status];

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-xl)",
      padding: "1.25rem",
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Status
        </p>
        <span style={{
          display: "inline-block",
          padding: "0.375rem 1rem",
          borderRadius: "9999px",
          fontSize: "0.875rem",
          fontWeight: 600,
          background: `${color}22`,
          color,
        }}>
          {SHIPMENT_STATUS_LABELS[status]}
        </span>
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        fontSize: "0.75rem",
        color: "var(--color-text-muted)",
      }}>
        <span style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: isConnected ? "var(--color-status-delivered)" : "var(--color-status-pending)",
          display: "inline-block",
        }} />
        {isConnected ? "Live" : "Polling"}
      </div>
    </div>
  );
}
