import type { ParsedEventLocation } from "@/lib/imports/event-locations";

export type MasterLocation = {
  id: string;
  landmark: string;
  locationUrl: string;
  clue: string;
  campusPopulation: string;
};

export function masterLocationToEventLocation(
  location: MasterLocation,
  position: number,
): ParsedEventLocation {
  return {
    rowNumber: position,
    position,
    landmark: location.landmark,
    normalizedLandmark: location.landmark.trim().toLowerCase(),
    locationUrl: location.locationUrl,
    clue: location.clue,
    campusPopulation: location.campusPopulation,
  };
}
