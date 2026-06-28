/**
 * Six user role types for Bigfella Auto Express portal.
 * NOTE: "athlete" / "agent" / "college_athlete" / "team_staff" / "nil_collective"
 * are OUR architecture assumptions based on job post language — not yet confirmed by Andre.
 * Treat as MVP scaffold — adjust after kickoff call.
 */
export const USER_ROLES = [
  "professional_athlete",
  "college_athlete",
  "agent",
  "team_staff",
  "nil_collective",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Maps a role to its dashboard route */
export const ROLE_DASHBOARD_ROUTE: Record<UserRole, string> = {
  professional_athlete: "/athlete",
  college_athlete: "/athlete",
  agent: "/agent",
  team_staff: "/agent",
  nil_collective: "/agent",
  admin: "/admin",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  professional_athlete: "Professional Athlete",
  college_athlete: "College / NCAA Athlete",
  agent: "Sports Agent / Agency",
  team_staff: "Team Operations / Staff",
  nil_collective: "NIL Collective",
  admin: "Admin / Dispatcher",
};
