"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS, type VehicleType } from "@/lib/types/vehicle";
import type { Database } from "@/lib/supabase/types";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export default function VehiclesPage() {
  const supabase = createBrowserClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [isInoperable, setIsInoperable] = useState(false);
  const [notes, setNotes] = useState("");

  async function loadVehicles() {
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    setVehicles(data ?? []);
  }

  useEffect(() => {
    loadVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setMake(""); setModel(""); setYear(""); setVehicleType("sedan");
    setColor(""); setVin(""); setIsInoperable(false); setNotes("");
    setError(null);
  }

  async function handleAdd() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired."); setLoading(false); return; }

    const yearNum = parseInt(year, 10);
    if (!make || !model || isNaN(yearNum) || yearNum < 1900 || yearNum > 2030) {
      setError("Please fill in make, model, and a valid year.");
      setLoading(false);
      return;
    }

    // vehicleType is validated against VEHICLE_TYPES enum — "car" would be rejected
    // at DB level by the CHECK constraint matching SD's 19 enum values
    const { error: insertError } = await supabase.from("vehicles").insert({
      user_id: user.id,
      make,
      model,
      year: yearNum,
      vehicle_type: vehicleType,
      color: color || null,
      vin: vin || null,
      is_inoperable: isInoperable,
      notes: notes || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      resetForm();
      setAdding(false);
      await loadVehicles();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const { error: delError } = await supabase.from("vehicles").delete().eq("id", id);
    if (!delError) await loadVehicles();
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

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>My Vehicles</h1>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{
              padding: "0.5rem 1.25rem",
              background: "var(--color-brand-600)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add Vehicle
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text)" }}>
            Add a Vehicle
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <label>
              <span style={labelStyle}>Make *</span>
              <input type="text" value={make} onChange={e => setMake(e.target.value)} placeholder="BMW" style={fieldStyle} />
            </label>
            <label>
              <span style={labelStyle}>Model *</span>
              <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="M3" style={fieldStyle} />
            </label>
            <label>
              <span style={labelStyle}>Year *</span>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2024" min="1900" max="2030" style={fieldStyle} />
            </label>
            <label>
              <span style={labelStyle}>Color</span>
              <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Alpine White" style={fieldStyle} />
            </label>
          </div>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            <span style={labelStyle}>Vehicle Type * (Super Dispatch enum — must match exactly)</span>
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)} style={fieldStyle}>
              {VEHICLE_TYPES.map(t => (
                <option key={t} value={t}>{VEHICLE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            <span style={labelStyle}>VIN (optional)</span>
            <input type="text" value={vin} onChange={e => setVin(e.target.value)} placeholder="WBS3R9C50FK334519" style={fieldStyle} />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", cursor: "pointer" }}>
            <input type="checkbox" checked={isInoperable} onChange={e => setIsInoperable(e.target.checked)} />
            <span style={{ fontSize: "0.875rem", color: "var(--color-text)" }}>Vehicle is inoperable</span>
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={labelStyle}>Notes (optional)</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...fieldStyle, resize: "vertical" as const }} />
          </label>

          {error && <p style={{ color: "var(--color-status-cancelled)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{error}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleAdd} disabled={loading} style={{
              padding: "0.5rem 1.25rem",
              background: "var(--color-brand-600)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? "Saving…" : "Save Vehicle"}
            </button>
            <button onClick={() => { setAdding(false); resetForm(); }} style={{
              padding: "0.5rem 1.25rem",
              background: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Vehicle list */}
      {vehicles.length === 0 ? (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "3rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}>
          <p>No vehicles yet. Add one to start booking shipments.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {vehicles.map(v => (
            <div key={v.id} style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem 1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.25rem" }}>
                  {v.year} {v.make} {v.model}
                  {v.is_inoperable && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--color-status-disputed)" }}>· Inoperable</span>}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {VEHICLE_TYPE_LABELS[v.vehicle_type as VehicleType]}
                  {v.color ? ` · ${v.color}` : ""}
                  {v.vin ? ` · VIN: ${v.vin}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDelete(v.id)}
                style={{
                  padding: "0.375rem 0.75rem",
                  background: "transparent",
                  color: "var(--color-status-cancelled)",
                  border: "1px solid var(--color-status-cancelled)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
