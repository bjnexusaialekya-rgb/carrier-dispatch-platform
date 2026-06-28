export const BOOKING_MODELS = ["full_service", "marketplace"] as const;
export type BookingModel = (typeof BOOKING_MODELS)[number];

export const BOOKING_MODEL_LABELS: Record<BookingModel, string> = {
  full_service: "Full Service (Bigfella Manages Everything)",
  marketplace: "Carrier Marketplace (You Choose Your Carrier)",
};

export const SERVICE_TIERS = ["standard", "priority", "white_glove"] as const;
export type ServiceTier = (typeof SERVICE_TIERS)[number];

export const SERVICE_TIER_LABELS: Record<ServiceTier, string> = {
  standard: "Standard",
  priority: "Priority",
  white_glove: "White Glove",
};

export const SERVICE_TIER_DESCRIPTIONS: Record<ServiceTier, string> = {
  standard: "Regular transit times, standard carrier pool",
  priority: "Faster dispatch, vetted carriers",
  white_glove: "Enclosed transport, dedicated handler, real-time updates",
};

export const SHIPMENT_STATUSES = [
  "pending",
  "quoted",
  "accepted",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "disputed",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  quoted: "Quote Ready",
  accepted: "Accepted",
  assigned: "Carrier Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  disputed: "Disputed",
};
