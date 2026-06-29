"use client";

import { loginWithEmailPassword } from "./actions";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/types/roles";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("professional_athlete");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createBrowserClient();
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signin") {
      const result = await loginWithEmailPassword(email, password);
      if (result?.error) {
        setError(result.error);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! You can now sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-muted)", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "2rem" }}>
        
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.25rem" }}>
          Carrier Dispatch Portal
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          {mode === "signin" ? "Sign in to manage your shipments" : "Create your account"}
        </p>

        {/* Sign in / Sign up toggle */}
        <div style={{ display: "flex", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", overflow: "hidden" }}>
          <button onClick={() => { setMode("signin"); setError(null); setMessage(null); }} style={{ flex: 1, padding: "0.5rem", fontSize: "0.875rem", fontWeight: 500, border: "none", cursor: "pointer", background: mode === "signin" ? "var(--color-brand-600)" : "var(--color-surface)", color: mode === "signin" ? "#fff" : "var(--color-text-muted)" }}>
            Sign In
          </button>
          <button onClick={() => { setMode("signup"); setError(null); setMessage(null); }} style={{ flex: 1, padding: "0.5rem", fontSize: "0.875rem", fontWeight: 500, border: "none", cursor: "pointer", background: mode === "signup" ? "var(--color-brand-600)" : "var(--color-surface)", color: mode === "signup" ? "#fff" : "var(--color-text-muted)" }}>
            Sign Up
          </button>
        </div>

        {/* Role selector — only on signup */}
        {mode === "signup" && (
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)", display: "block", marginBottom: "0.375rem" }}>I am a</span>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", background: "var(--color-surface)", color: "var(--color-text)" }}>
              {USER_ROLES.filter((r) => r !== "admin").map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </label>
        )}

        <label style={{ display: "block", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)", display: "block", marginBottom: "0.375rem" }}>Email address</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", background: "var(--color-surface)", color: "var(--color-text)" }} />
        </label>

        <label style={{ display: "block", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)", display: "block", marginBottom: "0.375rem" }}>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", background: "var(--color-surface)", color: "var(--color-text)" }} />
        </label>

        {error && <p style={{ color: "var(--color-status-cancelled)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}
        {message && <p style={{ color: "var(--color-status-delivered)", fontSize: "0.875rem", marginBottom: "1rem" }}>{message}</p>}

        <button onClick={handleSubmit} disabled={loading || !email || !password} style={{ width: "100%", padding: "0.625rem 1rem", background: "var(--color-brand-600)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: "0.75rem", opacity: loading || !email || !password ? 0.6 : 1 }}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        <div style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>or</div>

        <button onClick={handleGoogleLogin} style={{ width: "100%", padding: "0.625rem 1rem", background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

      </div>
    </main>
  );
}
