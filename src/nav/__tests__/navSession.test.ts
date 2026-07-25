import { beginNav, updateNav } from '@/nav/navSession';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';
import { Route } from '@/nav/navTypes';

test('beginNav starts navigating on step 0', () => {
  const s = beginNav(FIXTURE_ROUTE);
  expect(s.status).toBe('navigating');
  expect(s.currentStepIndex).toBe(0);
  expect(s.distanceRemaining).toBe(1408);
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

test('updateNav on the second leg reports remaining distance to destination', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0099 }, 10);
  expect(s1.currentStepIndex).toBe(1);
  expect(s1.distanceRemaining).toBeGreaterThan(500);
  expect(s1.distanceRemaining).toBeLessThan(620);
});

test('updateNav flags off-route when far from the polyline', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.02, lng: -75.0 }, 10);
  expect(s1.status).toBe('off-route');
});

test('updateNav recovers to navigating after returning to the route', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const off = updateNav(s0, { lat: 40.02, lng: -75.0 }, 10);
  expect(off.status).toBe('off-route');
  const back = updateNav(off, { lat: 40.0, lng: -75.0 }, 10);
  expect(back.status).toBe('navigating');
});

test('updateNav flags arrival near the destination', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.005, lng: -75.01 }, 0);
  expect(s1.status).toBe('arrived');
  expect(s1.distanceRemaining).toBeLessThan(25);
});

test('updateNav on the final approach still reports nonzero remaining (not premature 0)', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  // thread through the corner so the step advances realistically, then approach dest
  const atCorner = updateNav(s0, { lat: 40.0, lng: -75.0099 }, 10);
  // ~27m south of the destination: past the 30m advance band, before the 25m arrival band
  const s1 = updateNav(atCorner, { lat: 40.004758, lng: -75.01 }, 0);
  expect(s1.status).toBe('navigating');
  expect(s1.currentStepIndex).toBe(2);
  expect(s1.distanceRemaining).toBeGreaterThan(25);
  expect(s1.distanceRemaining).toBeLessThan(35);
  expect(s1.etaSeconds).toBeGreaterThan(0);
});

test('updateNav computes ETA from remaining distance and speed', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0 }, 20);
  // ~1408m at 20 m/s ~= 70s
  expect(s1.etaSeconds).toBeGreaterThan(66);
  expect(s1.etaSeconds).toBeLessThan(74);
});

test('updateNav does not throw on a degenerate empty route', () => {
  const empty: Route = { steps: [], geometry: [], distance: 0, duration: 0 };
  const s0 = { ...beginNav(FIXTURE_ROUTE), route: empty };
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0 }, 5);
  expect(s1.position).toEqual({ lat: 40.0, lng: -75.0 });
});
