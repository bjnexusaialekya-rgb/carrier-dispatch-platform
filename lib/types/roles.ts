/**
 * Six user role types for Carrier Dispatch Portal.
 * MVP scaffold — adjust after kickoff call.
 */
export const USER_ROLES = [
  'shipper',
  'carrier',
  'broker',
  'fleet_manager',
  'support_staff',
  'admin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_DASHBOARD_ROUTE: Record<UserRole, string> = {
  shipper: '/shipper',
  carrier: '/carrier',
  broker: '/agent',
  fleet_manager: '/agent',
  support_staff: '/agent',
  admin: '/admin',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  shipper: 'Shipper',
  carrier: 'Carrier',
  broker: 'Broker / Agent',
  fleet_manager: 'Fleet Manager',
  support_staff: 'Support Staff',
  admin: 'Admin / Dispatcher',
};
