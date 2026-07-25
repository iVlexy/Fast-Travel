import { haversine, bearing, distancePointToSegment, distanceToPolyline } from '@/nav/geo';
import { LatLng } from '@/nav/navTypes';

const A: LatLng = { lat: 40.0, lng: -75.0 };
const B: LatLng = { lat: 40.0, lng: -75.01 }; // ~852m due west

test('haversine returns ~0 for identical points', () => {
  expect(haversine(A, A)).toBeCloseTo(0, 5);
});

test('haversine ~852m for the known pair', () => {
  expect(haversine(A, B)).toBeGreaterThan(830);
  expect(haversine(A, B)).toBeLessThan(870);
});

test('bearing due west is ~270 degrees', () => {
  expect(bearing(A, B)).toBeGreaterThan(265);
  expect(bearing(A, B)).toBeLessThan(275);
});

test('distancePointToSegment: point on the segment is ~0', () => {
  const mid: LatLng = { lat: 40.0, lng: -75.005 };
  expect(distancePointToSegment(mid, A, B)).toBeLessThan(1);
});

test('distancePointToSegment: point off the segment measures perpendicular gap', () => {
  const off: LatLng = { lat: 40.001, lng: -75.005 }; // ~111m north of the line
  const d = distancePointToSegment(off, A, B);
  expect(d).toBeGreaterThan(90);
  expect(d).toBeLessThan(130);
});

test('distanceToPolyline picks the nearest segment', () => {
  const poly: LatLng[] = [A, B, { lat: 40.0, lng: -75.02 }];
  const near: LatLng = { lat: 40.0, lng: -75.015 };
  expect(distanceToPolyline(near, poly)).toBeLessThan(5);
});
