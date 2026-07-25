import { LatLng } from '@/nav/navTypes';

export type LocationReading = {
  coords: { latitude: number; longitude: number; speed: number | null };
};

// Converts an Expo location reading into the engine's { position, speed }.
// A null or negative GPS speed (common when stationary) clamps to 0.
export function readingToPosition(r: LocationReading): { position: LatLng; speed: number } {
  const speed = r.coords.speed;
  return {
    position: { lat: r.coords.latitude, lng: r.coords.longitude },
    speed: speed != null && speed > 0 ? speed : 0,
  };
}
