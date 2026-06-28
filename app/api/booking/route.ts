import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/booking
 * Called after shipment is inserted into Supabase.
 * Fires the n8n webhook with order_guid so automation engine can begin.
 *
 * order_guid is the critical link between:
 *   - Supabase (portal)
 *   - n8n automation engine
 *   - HubSpot CRM deal
 * Agreed on day one — never remove this field from the payload.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { shipmentId } = body;

  if (!shipmentId) {
    return NextResponse.json({ error: "shipmentId required" }, { status: 400 });
  }

  // Fetch the shipment — RLS ensures this user owns it
  const { data: shipment, error: fetchError } = await supabase
    .from("shipments")
    .select("*, vehicles(*)")
    .eq("id", shipmentId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    // Webhook not configured — shipment still saved, automation skipped
    console.warn("N8N_WEBHOOK_URL not set — skipping automation trigger");
    return NextResponse.json({ ok: true, automation: "skipped" });
  }

  const vehicle = shipment.vehicles as {
    make: string; model: string; year: number;
    vehicle_type: string; is_inoperable: boolean;
  } | null;

  // Payload matches n8n node-001 SD Webhook Listener expectations
  const webhookPayload = {
    order_guid: shipment.order_guid,          // Critical link — never remove
    shipment_id: shipment.id,
    user_id: user.id,
    booking_model: shipment.booking_model,
    service_tier: shipment.service_tier,
    origin_zip: shipment.origin_zip,
    origin_city: shipment.origin_city,
    origin_state: shipment.origin_state,
    destination_zip: shipment.destination_zip,
    destination_city: shipment.destination_city,
    destination_state: shipment.destination_state,
    pickup_date: shipment.pickup_date,
    vehicle: vehicle ? {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      // vehicle_type is validated against SD 19 enum at DB level
      // "car" would have been rejected by CHECK constraint before reaching here
      vehicle_type: vehicle.vehicle_type,
      is_inoperable: vehicle.is_inoperable,
    } : null,
    notes: shipment.notes,
  };

  try {
    // n8n webhook must respond within 10 seconds (SD spec)
    // node-002 returns 200 OK instantly — we mirror that pattern here
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(12_000),
    });

    if (!n8nResponse.ok) {
      console.error("n8n webhook failed:", n8nResponse.status);
      // Don't fail the user — shipment is saved, automation will retry
      return NextResponse.json({ ok: true, automation: "webhook_failed" });
    }

    return NextResponse.json({ ok: true, automation: "triggered", order_guid: shipment.order_guid });
  } catch (err) {
    console.error("n8n webhook error:", err);
    return NextResponse.json({ ok: true, automation: "error" });
  }
}
