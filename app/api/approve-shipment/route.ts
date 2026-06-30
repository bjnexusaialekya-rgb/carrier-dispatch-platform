import { type NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const { supabase } = await requireRole("admin");

  const body = await request.json();
  const { shipmentId, orderGuid, action } = body as {
    shipmentId: string;
    orderGuid: string;
    action: "approved" | "rejected";
  };

  if (!shipmentId || !orderGuid || !action) {
    return NextResponse.json(
      { error: "shipmentId, orderGuid, and action are required" },
      { status: 400 }
    );
  }

  if (!["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const newStatus = action === "approved" ? "accepted" : "cancelled";
  const { error: updateError } = await supabase
    .from("shipments")
    .update({ status: newStatus })
    .eq("id", shipmentId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    shipment_id: shipmentId,
    action: "status_updated",
    payload: { order_guid: orderGuid, admin_decision: action },
    hubspot_synced: false,
  });

  const n8nResumeUrl = process.env.N8N_RESUME_WEBHOOK_URL;
  if (n8nResumeUrl) {
    try {
      await fetch(`${n8nResumeUrl}/${orderGuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      console.error("n8n resume webhook failed:", err);
      return NextResponse.json({ ok: true, n8n: "resume_failed" });
    }
  } else {
    console.warn("N8N_RESUME_WEBHOOK_URL not set — skipping n8n resume");
  }

  return NextResponse.json({ ok: true, status: newStatus });
}