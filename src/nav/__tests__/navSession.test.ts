import { beginNav, updateNav } from '@/nav/navSession';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

test('beginNav starts navigating on step 0', () => {
  const s = beginNav(FIXTURE_ROUTE);
  expect(s.status).toBe('navigating');
  expect(s.currentStepIndex).toBe(0);
  expect(s.distanceRemaining).toBe(1704);
});

test('updateNav at the start reports distance to the first turn', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0 }, 0);
  expect(s1.status).toBe('navigating');
  expect(s1.distanceToNextTurn).toBeGreaterThan(830);
  expect(s1.distanceToNextTurn).toBeLessThan(870);
});

test('updateNav advances the step after passing a maneuver', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0099 }, 10);
  expect(s1.currentStepIndex).toBe(1);
});

test('updateNav flags off-route when far from the polyline', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.02, lng: -75.0 }, 10);
  expect(s1.status).toBe('off-route');
});

test('updateNav flags arrival near the destination', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.005, lng: -75.01 }, 0);
  expect(s1.status).toBe('arrived');
  expect(s1.distanceRemaining).toBeLessThan(25);
});

test('updateNav computes ETA from remaining distance and speed', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0 }, 20);
  expect(s1.etaSeconds).toBeGreaterThan(60);
  expect(s1.etaSeconds).toBeLessThan(120);
});
