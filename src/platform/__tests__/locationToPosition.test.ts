import { readingToPosition } from '@/platform/locationToPosition';

test('maps an expo reading to position + speed', () => {
  const r = readingToPosition({ coords: { latitude: 40.1, longitude: -75.2, speed: 12.3 } });
  expect(r.position).toEqual({ lat: 40.1, lng: -75.2 });
  expect(r.speed).toBeCloseTo(12.3, 3);
});

test('clamps null or negative speed to 0', () => {
  expect(readingToPosition({ coords: { latitude: 0, longitude: 0, speed: null } }).speed).toBe(0);
  expect(readingToPosition({ coords: { latitude: 0, longitude: 0, speed: -1 } }).speed).toBe(0);
});
