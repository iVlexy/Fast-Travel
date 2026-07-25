import { DirectionsProvider } from '@/nav/directions';
import { LatLng, Route, RouteStep } from '@/nav/navTypes';

type LngLat = [number, number];
const toLatLng = ([lng, lat]: LngLat): LatLng => ({ lat, lng });

type MbManeuver = { type: string; modifier?: string; instruction: string; location: LngLat };
type MbStep = { distance: number; duration: number; geometry: { coordinates: LngLat[] }; maneuver: MbManeuver };
type MbLeg = { steps: MbStep[] };
type MbRoute = { distance: number; duration: number; geometry: { coordinates: LngLat[] }; legs: MbLeg[] };
export type MapboxDirectionsResponse = { code: string; routes: MbRoute[] };

export function mapboxToRoute(res: MapboxDirectionsResponse): Route {
  const r = res.routes?.[0];
  if (!r) throw new Error(`Mapbox returned no route (code=${res.code})`);
  const steps: RouteStep[] = r.legs
    .flatMap((leg) => leg.steps)
    .map((s) => ({
      distance: s.distance,
      geometry: s.geometry.coordinates.map(toLatLng),
      maneuver: {
        type: s.maneuver.type,
        modifier: s.maneuver.modifier,
        instruction: s.maneuver.instruction,
        location: toLatLng(s.maneuver.location),
      },
    }));
  return {
    distance: r.distance,
    duration: r.duration,
    geometry: r.geometry.coordinates.map(toLatLng),
    steps,
  };
}

export type DrivingProfile = 'driving' | 'driving-traffic';

export class MapboxDirectionsProvider implements DirectionsProvider {
  constructor(
    private readonly token: string,
    private readonly profile: DrivingProfile = 'driving',
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async getRoute(origin: LatLng, destination: LatLng) {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${this.profile}/${coords}` +
      `?geometries=geojson&steps=true&overview=full&access_token=${this.token}`;
    const res = await this.fetchFn(url);
    if (!res.ok) throw new Error(`Mapbox Directions HTTP ${res.status}`);
    const json = (await res.json()) as MapboxDirectionsResponse;
    return mapboxToRoute(json);
  }
}
