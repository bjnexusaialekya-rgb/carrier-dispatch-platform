"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveRejectButtons({
  shipmentId,
  orderGuid,
}: {
  shipmentId: string;
  orderGuid: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);

  async function handleAction(action: "approved" | "rejected") {
    setLoading(action);
    try {
      const res = await fetch("/api/approve-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId, orderGuid, action }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Action failed");
      }
    } catch {
      alert("Network error — try again");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.375rem" }}>
      <button
        onClick={() => handleAction("approved")}
        disabled={loading !== null}
        style={{
          padding: "0.25rem 0.625rem",
          fontSize: "0.7rem",
          fontWeight: 600,
          background: "var(--color-brand-600)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading === "approved" ? "..." : "Approve"}
      </button>
      <button
        onClick={() => handleAction("rejected")}
        disabled={loading !== null}
        style={{
          padding: "0.25rem 0.625rem",
          fontSize: "0.7rem",
          fontWeight: 600,
          background: "var(--color-surface)",
          color: "var(--color-status-cancelled)",
          border: "1px solid var(--color-status-cancelled)",
          borderRadius: "var(--radius-sm)",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading === "rejected" ? "..." : "Reject"}
      </button>
    </div>
  );
}