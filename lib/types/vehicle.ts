/**
 * Super Dispatch vehicle.type enum — verified March 20 2025.
 * All 19 values. Sending anything else (e.g. "car") returns HTTP 400.
 * This enum is the ONLY place vehicle types are defined — import everywhere, never hardcode.
 */
export const VEHICLE_TYPES = [
  "sedan",
  "2_door_coupe",
  "suv",
  "pickup",
  "4_door_pickup",
  "van",
  "truck_daycab",
  "truck_sleeper",
  "motorcycle",
  "boat",
  "rv",
  "heavy_machinery",
  "freight",
  "livestock",
  "atv",
  "trailer_bumper_pull",
  "trailer_gooseneck",
  "trailer_5th_wheel",
  "other",
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  sedan: "Sedan",
  "2_door_coupe": "2-Door Coupe",
  suv: "SUV",
  pickup: "Pickup Truck",
  "4_door_pickup": "4-Door Pickup",
  van: "Van",
  truck_daycab: "Truck – Day Cab",
  truck_sleeper: "Truck – Sleeper",
  motorcycle: "Motorcycle",
  boat: "Boat",
  rv: "RV / Motorhome",
  heavy_machinery: "Heavy Machinery",
  freight: "Freight",
  livestock: "Livestock",
  atv: "ATV / Off-Road",
  trailer_bumper_pull: "Trailer – Bumper Pull",
  trailer_gooseneck: "Trailer – Gooseneck",
  trailer_5th_wheel: "Trailer – 5th Wheel",
  other: "Other",
};
