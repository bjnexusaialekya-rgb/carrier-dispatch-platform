"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/types/roles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("professional_athlete");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  async function handleEmailLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: { role },
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the magic link.");
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    // CVE-2026-31813: OIDC token bypass — fixed in gotrue 2.185.0 (our locked version)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface-muted)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--color-border)",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: "0.25rem",
          }}
        >
          Carrier Dispatch Portal
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
          Sign in to manage your shipments
        </p>

        {/* Role selector */}
        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)", display: "block", marginBottom: "0.375rem" }}>
            I am a
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          >
            {USER_ROLES.filter((r) => r !== "admin").map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>

        {/* Email */}
        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)", display: "block", marginBottom: "0.375rem" }}>
            Email address
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
            }}
          />
        </label>

        {error && (
          <p style={{ color: "var(--color-status-cancelled)", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {error}
          </p>
        )}
        {message && (
          <p style={{ color: "var(--color-status-delivered)", fontSize: "0.875rem", marginBottom: "1rem" }}>
            {message}
          </p>
        )}

        <button
          onClick={handleEmailLogin}
          disabled={loading || !email}
          style={{
            width: "100%",
            padding: "0.625rem 1rem",
            background: "var(--color-brand-600)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "0.75rem",
            opacity: loading || !email ? 0.6 : 1,
          }}
        >
          {loading ? "Sending link…" : "Send magic link"}
        </button>

        <div style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>
          or
        </div>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "0.625rem 1rem",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
