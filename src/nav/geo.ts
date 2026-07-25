import { LatLng } from './navTypes';

const R = 6371000; // Earth radius (m)
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearing(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Project to a local planar frame (meters) around `origin`, so we can do
// straight-line segment math. Accurate enough at street scale.
function toXY(p: LatLng, origin: LatLng): { x: number; y: number } {
  const x = toRad(p.lng - origin.lng) * Math.cos(toRad(origin.lat)) * R;
  const y = toRad(p.lat - origin.lat) * R;
  return { x, y };
}

export function distancePointToSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const P = toXY(p, a);
  const A = { x: 0, y: 0 };
  const B = toXY(b, a);
  const abx = B.x - A.x;
  const aby = B.y - A.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return haversine(p, a);
  let t = (P.x * abx + P.y * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = abx * t;
  const cy = aby * t;
  return Math.hypot(P.x - cx, P.y - cy);
}

export function distanceToPolyline(p: LatLng, poly: LatLng[]): number {
  if (poly.length === 0) return Infinity;
  if (poly.length === 1) return haversine(p, poly[0]);
  let min = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const d = distancePointToSegment(p, poly[i], poly[i + 1]);
    if (d < min) min = d;
  }
  return min;
}
