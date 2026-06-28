import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/webhooks/n8n
 *
 * Receives status updates FROM the n8n automation engine.
 * n8n writes carrier assignments, quote results, status changes back to Supabase
 * via this endpoint using order_guid as the correlation key.
 *
 * order_guid is the critical link — agreed day one between Job 2 and Job 3.
 * Never remove it from the payload contract.
 *
 * Security: shared secret in N8N_WEBHOOK_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Shared secret validation — n8n sends this in every outbound webhook call
  const incomingSecret = request.headers.get("x-n8n-secret");
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!expectedSecret || incomingSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    order_guid,
    event,
    status,
    carrier_name,
    carrier_id,
    super_dispatch_order_id,
    hubspot_deal_id,
    quote,
  } = body as {
    order_guid: string;
    event: string;
    status?: string;
    carrier_name?: string;
    carrier_id?: string;
    super_dispatch_order_id?: string;
    hubspot_deal_id?: string;
    quote?: {
      carrier_pay: number;
      shipper_quote: number;
      market_rate_low: number;
      market_rate_high: number;
      estimated_miles: number;
      quote_path: string;
    };
  };

  if (!order_guid || !event) {
    return NextResponse.json({ error: "order_guid and event required" }, { status: 400 });
  }

  // Admin client — n8n updates span multiple users, RLS would block cross-user writes
  const adminSupabase = createAdminClient();

  // Fetch shipment by order_guid
  const { data: shipment } = await adminSupabase
    .from("shipments")
    .select("id, user_id, status")
    .eq("order_guid", order_guid)
    .single();

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found for order_guid" }, { status: 404 });
  }

  const shipmentId = shipment.id;

  try {
    switch (event) {
      case "quote_generated": {
        if (quote) {
          // Upsert quote record
          await adminSupabase.from("quotes").upsert({
            shipment_id: shipmentId,
            order_guid,
            carrier_pay: quote.carrier_pay,
            shipper_quote: quote.shipper_quote,
            market_rate_low: quote.market_rate_low,
            market_rate_high: quote.market_rate_high,
            estimated_miles: quote.estimated_miles,
            quote_path: quote.quote_path,
          }, { onConflict: "shipment_id" });

          await adminSupabase
            .from("shipments")
            .update({
              status: "quoted",
              estimated_miles: quote.estimated_miles,
              ...(hubspot_deal_id ? { hubspot_deal_id } : {}),
            })
            .eq("id", shipmentId);

          // Notification for the athlete
          await adminSupabase.from("notifications").insert({
            user_id: shipment.user_id,
            shipment_id: shipmentId,
            channel: "push",
            subject: "Your quote is ready",
            body: quote.quote_path === "MANUAL_REVIEW_REQUIRED"
              ? "This lane requires manual pricing. Our team will contact you shortly."
              : `Your transport quote is $${Number(quote.shipper_quote).toLocaleString()}.`,
          });
        }
        break;
      }

      case "carrier_assigned": {
        await adminSupabase
          .from("shipments")
          .update({
            status: "assigned",
            carrier_name: carrier_name ?? null,
            carrier_id: carrier_id ?? null,
            super_dispatch_order_id: super_dispatch_order_id ?? null,
            ...(hubspot_deal_id ? { hubspot_deal_id } : {}),
          })
          .eq("id", shipmentId);

        await adminSupabase.from("audit_log").insert({
          shipment_id: shipmentId,
          action: "carrier_assigned",
          payload: { carrier_name, carrier_id, order_guid },
          hubspot_synced: true,
        });

        await adminSupabase.from("notifications").insert({
          user_id: shipment.user_id,
          shipment_id: shipmentId,
          channel: "push",
          subject: "Carrier assigned",
          body: `Your vehicle has been assigned to ${carrier_name ?? "a carrier"}.`,
        });
        break;
      }

      case "status_update": {
        if (status) {
          await adminSupabase
            .from("shipments")
            .update({ status: status as never })
            .eq("id", shipmentId);

          await adminSupabase.from("audit_log").insert({
            shipment_id: shipmentId,
            action: "status_updated",
            payload: { from: shipment.status, to: status, event, order_guid },
            hubspot_synced: true,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled n8n event: ${event} for order_guid: ${order_guid}`);
    }

    return NextResponse.json({ ok: true, shipment_id: shipmentId });
  } catch (err) {
    console.error("n8n webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
