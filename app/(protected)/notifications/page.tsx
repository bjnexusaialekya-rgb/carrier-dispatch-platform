import { requireAuth } from "@/lib/auth/session";

export default async function NotificationsPage() {
  const { supabase } = await requireAuth();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark unread as read
  const unreadIds = (notifications ?? [])
    .filter(n => !n.is_read)
    .map(n => n.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  }

  const CHANNEL_ICONS: Record<string, string> = {
    sms: "💬",
    email: "✉️",
    push: "🔔",
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "1.5rem" }}>
        Notifications
      </h1>

      {!notifications || notifications.length === 0 ? (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "3rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem 1.25rem",
              opacity: n.is_read ? 0.75 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  {n.subject && (
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.25rem" }}>
                      {n.subject}
                    </p>
                  )}
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{n.body}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem" }}>{CHANNEL_ICONS[n.channel] ?? "🔔"}</span>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
