import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/webhooks/stripe
 *
 * CRITICAL: request.text() — NOT request.json().
 * Parsing as JSON breaks Stripe signature validation (failure mode #9).
 * body parsing must be disabled — Next.js App Router does this by default for Route Handlers.
 *
 * CRITICAL: STRIPE_WEBHOOK_SECRET must be set.
 * Empty secret = webhook bypass possible (failure mode #10).
 *
 * CRITICAL: processed_webhooks table = idempotency guard.
 * No dedup = double invoice on retry (failure mode #11).
 *
 * CRITICAL: Never disable timestamp tolerance.
 * Default 5-min tolerance prevents replay attacks (failure mode #22).
 */
export async function POST(request: NextRequest) {
  // Guard: reject all calls if secret is unset
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — rejecting webhook");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // CRITICAL: request.text() — signature validation requires raw body string
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
  });

  let event: Stripe.Event;
  try {
    // SDK default 5-minute timestamp tolerance — never pass a custom tolerance
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Admin client bypasses RLS — required for processed_webhooks (service_role only table)
  const adminSupabase = createAdminClient();

  // IDEMPOTENCY: check if this event was already processed
  // processed_webhooks has UNIQUE constraint on stripe_event_id
  const { data: existing } = await adminSupabase
    .from("processed_webhooks")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    // Already processed — return 200 so Stripe stops retrying
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Process the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const shipmentId = paymentIntent.metadata?.shipment_id;

        if (shipmentId) {
          await adminSupabase
            .from("payments")
            .update({
              status: "captured",
              stripe_payment_intent_id: paymentIntent.id,
              stripe_event_id: event.id,
            })
            .eq("shipment_id", shipmentId);

          await adminSupabase
            .from("shipments")
            .update({ status: "delivered" })
            .eq("id", shipmentId);

          // Audit log
          await adminSupabase.from("audit_log").insert({
            shipment_id: shipmentId,
            action: "payment_captured",
            payload: { stripe_payment_intent_id: paymentIntent.id, amount: paymentIntent.amount },
            hubspot_synced: false,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const shipmentId = paymentIntent.metadata?.shipment_id;

        if (shipmentId) {
          await adminSupabase
            .from("payments")
            .update({ status: "failed" })
            .eq("shipment_id", shipmentId);
        }
        break;
      }

      default:
        // Unhandled event type — log and acknowledge
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    // Mark as processed — insert after handling to avoid marking before success
    await adminSupabase.from("processed_webhooks").insert({
      stripe_event_id: event.id,
      event_type: event.type,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    // Return 500 so Stripe retries — idempotency guard handles duplicates
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
