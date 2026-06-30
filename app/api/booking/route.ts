import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateQuote } from "@/lib/quotes/calculate-quote";
import type { VehicleType } from "@/lib/types/vehicle";
import type { ServiceTier, BookingModel } from "@/lib/types/booking";

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

  const { data: shipment, error: fetchError } = await supabase
    .from("shipments")
    .select("*, vehicles(*)")
    .eq("id", shipmentId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const vehicle = shipment.vehicles as {
    make: string; model: string; year: number;
    vehicle_type: VehicleType; is_inoperable: boolean;
  } | null;

  const quoteResult = await calculateQuote({
    originZip: shipment.origin_zip,
    destinationZip: shipment.destination_zip,
    vehicleType: vehicle?.vehicle_type ?? "sedan",
    serviceTier: shipment.service_tier as ServiceTier,
    bookingModel: shipment.booking_model as BookingModel,
    isInoperable: vehicle?.is_inoperable ?? false,
  });

  const { error: quoteInsertError } = await supabase.from("quotes").insert({
    shipment_id: shipment.id,
    order_guid: shipment.order_guid,
    carrier_pay: null,
    shipper_quote: quoteResult.shipperQuote,
    market_rate_low: quoteResult.marketRateLow,
    market_rate_high: quoteResult.marketRateHigh,
    estimated_miles: quoteResult.miles,
    quote_path: quoteResult.path,
    status: "pending",
  });

  if (quoteInsertError) {
    console.error("Quote insert failed:", quoteInsertError.message);
  }

  if (quoteResult.path === "AUTO") {
    await supabase
      .from("shipments")
      .update({ status: "quoted", estimated_miles: quoteResult.miles })
      .eq("id", shipment.id);
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.warn("N8N_WEBHOOK_URL not set — skipping automation trigger");
    return NextResponse.json({ ok: true, automation: "skipped", quote: quoteResult.path });
  }

  const webhookPayload = {
    order_guid: shipment.order_guid,
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
      vehicle_type: vehicle.vehicle_type,
      is_inoperable: vehicle.is_inoperable,
    } : null,
    notes: shipment.notes,
    quote: {
      shipper_quote: quoteResult.shipperQuote,
      estimated_miles: quoteResult.miles,
    },
  };

  try {
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(12_000),
    });

    if (!n8nResponse.ok) {
      console.error("n8n webhook failed:", n8nResponse.status);
      return NextResponse.json({ ok: true, automation: "webhook_failed", quote: quoteResult.path });
    }

    return NextResponse.json({
      ok: true,
      automation: "triggered",
      order_guid: shipment.order_guid,
      quote: quoteResult.path,
    });
  } catch (err) {
    console.error("n8n webhook error:", err);
    return NextResponse.json({ ok: true, automation: "error", quote: quoteResult.path });
  }
}
