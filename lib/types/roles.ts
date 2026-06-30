/**
 * Six user role types for Carrier Dispatch Express portal.
 * Based on Job 3 post language — athletes, agents, managers, dealerships, retail customers.
 */
export const USER_ROLES = [
  'professional_athlete',
  'college_athlete',
  'agent',
  'team_staff',
  'nil_collective',
  'admin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_DASHBOARD_ROUTE: Record<UserRole, string> = {
  professional_athlete: '/athlete',
  college_athlete: '/athlete',
  agent: '/agent',
  team_staff: '/agent',
  nil_collective: '/agent',
  admin: '/admin',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  professional_athlete: 'Professional Athlete',
  college_athlete: 'College / NCAA Athlete',
  agent: 'Sports Agent / Agency',
  team_staff: 'Team Operations / Staff',
  nil_collective: 'NIL Collective',
  admin: 'Admin / Dispatcher',
};
