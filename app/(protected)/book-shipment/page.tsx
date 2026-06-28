"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  type VehicleType,
} from "@/lib/types/vehicle";
import {
  BOOKING_MODEL_LABELS,
  BOOKING_MODELS,
  SERVICE_TIER_DESCRIPTIONS,
  SERVICE_TIER_LABELS,
  SERVICE_TIERS,
  type BookingModel,
  type ServiceTier,
} from "@/lib/types/booking";
import type { Database } from "@/lib/supabase/types";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export default function BookShipmentPage() {
  const supabase = createBrowserClient();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [bookingModel, setBookingModel] = useState<BookingModel>("full_service");
  const [serviceTier, setServiceTier] = useState<ServiceTier>("standard");
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [originZip, setOriginZip] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationState, setDestinationState] = useState("");
  const [destinationZip, setDestinationZip] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVehicles() {
      const { data } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
      setVehicles(data ?? []);
    }
    loadVehicles();
  }, [supabase]);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    if (!selectedVehicleId) {
      setError("Please select a vehicle.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("shipments").insert({
      user_id: user.id,
      vehicle_id: selectedVehicleId,
      booking_model: bookingModel,
      service_tier: serviceTier,
      origin_address: "",
      origin_city: originCity,
      origin_state: originState,
      origin_zip: originZip,
      destination_address: "",
      destination_city: destinationCity,
      destination_state: destinationState,
      destination_zip: destinationZip,
      pickup_date: pickupDate || null,
      notes: notes || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      window.location.href = "/athlete";
    }

    setLoading(false);
  }

  const fieldStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    background: "var(--color-surface)",
    color: "var(--color-text)",
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "0.875rem",
    fontWeight: 500 as const,
    color: "var(--color-text)",
    marginBottom: "0.375rem",
  };

  const sectionStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-xl)",
    padding: "1.5rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1.5rem" }}>
        Book a Shipment
      </h1>

      {/* Vehicle */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text)" }}>
          Vehicle
        </h2>
        {vehicles.length > 0 ? (
          <label style={{ display: "block" }}>
            <span style={labelStyle}>Select vehicle</span>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              style={fieldStyle}
            >
              <option value="">— choose a vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({VEHICLE_TYPE_LABELS[v.vehicle_type as VehicleType]})
                  {v.is_inoperable ? " · Inoperable" : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            No vehicles found.{" "}
            <a href="/vehicles" style={{ color: "var(--color-brand-500)" }}>
              Add a vehicle first.
            </a>
          </p>
        )}
      </div>

      {/* Booking model */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text)" }}>
          Booking Model
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {BOOKING_MODELS.map((m) => (
            <label
              key={m}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.75rem",
                border: `1px solid ${bookingModel === m ? "var(--color-brand-500)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="bookingModel"
                value={m}
                checked={bookingModel === m}
                onChange={() => setBookingModel(m)}
                style={{ marginTop: "2px" }}
              />
              <span style={{ fontSize: "0.875rem", color: "var(--color-text)" }}>
                {BOOKING_MODEL_LABELS[m]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Service tier */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text)" }}>
          Service Tier
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {SERVICE_TIERS.map((t) => (
            <label
              key={t}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.75rem",
                border: `1px solid ${serviceTier === t ? "var(--color-brand-500)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="serviceTier"
                value={t}
                checked={serviceTier === t}
                onChange={() => setServiceTier(t)}
                style={{ marginTop: "2px" }}
              />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>
                  {SERVICE_TIER_LABELS[t]}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {SERVICE_TIER_DESCRIPTIONS[t]}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Route */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text)" }}>
          Route
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <label style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Origin city</span>
            <input type="text" value={originCity} onChange={(e) => setOriginCity(e.target.value)} placeholder="Houston" style={fieldStyle} />
          </label>
          <label>
            <span style={labelStyle}>State</span>
            <input type="text" value={originState} onChange={(e) => setOriginState(e.target.value)} placeholder="TX" maxLength={2} style={fieldStyle} />
          </label>
          <label>
            <span style={labelStyle}>ZIP</span>
            <input type="text" value={originZip} onChange={(e) => setOriginZip(e.target.value)} placeholder="77002" style={fieldStyle} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <label style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Destination city</span>
            <input type="text" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} placeholder="Miami" style={fieldStyle} />
          </label>
          <label>
            <span style={labelStyle}>State</span>
            <input type="text" value={destinationState} onChange={(e) => setDestinationState(e.target.value)} placeholder="FL" maxLength={2} style={fieldStyle} />
          </label>
          <label>
            <span style={labelStyle}>ZIP</span>
            <input type="text" value={destinationZip} onChange={(e) => setDestinationZip(e.target.value)} placeholder="33101" style={fieldStyle} />
          </label>
        </div>
      </div>

      {/* Pickup date + notes */}
      <div style={sectionStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <label>
            <span style={labelStyle}>Preferred pickup date</span>
            <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} style={fieldStyle} />
          </label>
        </div>
        <label style={{ display: "block", marginTop: "0.75rem" }}>
          <span style={labelStyle}>Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            rows={3}
            style={{ ...fieldStyle, resize: "vertical" as const }}
          />
        </label>
      </div>

      {error && (
        <p style={{ color: "var(--color-status-cancelled)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          background: "var(--color-brand-600)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-md)",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Requesting quote…" : "Request quote"}
      </button>
    </div>
  );
}
