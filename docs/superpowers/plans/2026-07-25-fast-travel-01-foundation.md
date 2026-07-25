# Fast Travel — Plan 1: Foundation & Nav Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Expo/TypeScript app and build the headless navigation engine (geometry utils, routing interface, live NavSession, NavState store) — all pure logic, fully unit-tested, with **zero** Mapbox token or native build required.

**Architecture:** A headless nav core with no UI and no map SDK. `RouteController` fetches a `Route` from a pluggable `DirectionsProvider` (a mock in this plan; Mapbox in Plan 3). `NavSession.update()` is a pure function: given the active route and a new GPS fix, it returns a new `NavState` (current step, distance-to-turn, remaining distance, ETA, off-route, arrival). A Zustand store holds `NavState` + `activeSkinId`. This is the single source of truth every surface will later read.

**Tech Stack:** Expo (custom dev client target) · React Native · TypeScript · Zustand · Jest (`jest-expo` preset) · ts-jest types.

---

## File Structure

```
/package.json, /tsconfig.json, /jest.config.js, /app.json   scaffold + tooling
/src/nav/navTypes.ts        LatLng, Route, RouteStep, Maneuver, NavState, NavStatus
/src/nav/geo.ts             haversine(), bearing(), distancePointToSegment(), distanceToPolyline()
/src/nav/directions.ts      DirectionsProvider interface + MockDirectionsProvider
/src/nav/navSession.ts      beginNav(), updateNav()  (pure functions)
/src/nav/routeController.ts  RouteController (async, wraps a DirectionsProvider)
/src/state/navStore.ts      Zustand store (NavState + activeSkinId + actions)
/src/nav/__fixtures__/route.ts   a hand-built fixture Route for tests
/src/**/__tests__/*.test.ts       colocated tests
```

Each file has one responsibility. `geo.ts` is math only. `navSession.ts` is decision logic only (imports geo, no I/O). `routeController.ts` is the only async/I-O piece. Store is state only.

---

## Task 1: Scaffold Expo + TypeScript + Jest

**Files:**
- Create: `package.json`, `tsconfig.json`, `jest.config.js`, `app.json`, `babel.config.js`, `src/index.ts`
- Test: `src/__tests__/smoke.test.ts`

- [ ] **Step 1: Initialize the project files**

Create `package.json`:

```json
{
  "name": "fast-travel",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/react": "~18.2.79",
    "jest": "^29.7.0",
    "jest-expo": "~51.0.0",
    "typescript": "~5.3.3"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "esnext",
    "lib": ["esnext"],
    "jsx": "react-native",
    "skipLibCheck": true,
    "types": ["jest", "react"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

Create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
```

Create `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
```

Create `app.json`:

```json
{
  "expo": {
    "name": "Fast Travel",
    "slug": "fast-travel",
    "scheme": "fasttravel",
    "version": "0.1.0",
    "orientation": "portrait",
    "ios": { "bundleIdentifier": "cloud.browning.fasttravel" },
    "android": { "package": "cloud.browning.fasttravel" }
  }
}
```

Create `src/index.ts`:

```ts
export const APP_NAME = 'Fast Travel';
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: dependencies resolve, `node_modules/` populated (git-ignored).

- [ ] **Step 3: Write the smoke test**

Create `src/__tests__/smoke.test.ts`:

```ts
import { APP_NAME } from '@/index';

test('app name is set', () => {
  expect(APP_NAME).toBe('Fast Travel');
});
```

- [ ] **Step 4: Run the test**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo TS app with jest"
git push
```

---

## Task 2: Nav types

**Files:**
- Create: `src/nav/navTypes.ts`

No test (types only); consumed and validated by later tasks' tests.

- [ ] **Step 1: Define the types**

Create `src/nav/navTypes.ts`:

```ts
export type LatLng = { lat: number; lng: number };

export type Maneuver = {
  type: string;        // e.g. 'turn', 'depart', 'arrive'
  modifier?: string;   // e.g. 'left', 'right'
  instruction: string; // human-readable, e.g. "Turn left onto Main St"
  location: LatLng;    // where the maneuver happens
};

export type RouteStep = {
  maneuver: Maneuver;
  distance: number;      // meters for this step
  geometry: LatLng[];    // polyline for this step
};

export type Route = {
  steps: RouteStep[];
  geometry: LatLng[];    // full route polyline
  distance: number;      // total meters
  duration: number;      // total seconds (free-flow estimate)
};

export type NavStatus = 'idle' | 'navigating' | 'off-route' | 'arrived';

export type NavState = {
  status: NavStatus;
  route: Route | null;
  currentStepIndex: number;
  distanceToNextTurn: number; // meters to the next maneuver
  distanceRemaining: number;  // meters to destination
  etaSeconds: number;         // estimated seconds remaining
  position: LatLng | null;
  speed: number;              // m/s (from GPS)
};

export const INITIAL_NAV_STATE: NavState = {
  status: 'idle',
  route: null,
  currentStepIndex: 0,
  distanceToNextTurn: 0,
  distanceRemaining: 0,
  etaSeconds: 0,
  position: null,
  speed: 0,
};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/nav/navTypes.ts
git commit -m "feat(nav): add nav domain types"
git push
```

---

## Task 3: Geometry utilities

**Files:**
- Create: `src/nav/geo.ts`
- Test: `src/nav/__tests__/geo.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/nav/__tests__/geo.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- geo.test`
Expected: FAIL ("Cannot find module '@/nav/geo'").

- [ ] **Step 3: Implement geo.ts**

Create `src/nav/geo.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- geo.test`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/nav/geo.ts src/nav/__tests__/geo.test.ts
git commit -m "feat(nav): add geo utils (haversine, bearing, polyline distance)"
git push
```

---

## Task 4: Directions provider interface + mock

**Files:**
- Create: `src/nav/directions.ts`
- Create: `src/nav/__fixtures__/route.ts`
- Test: `src/nav/__tests__/directions.test.ts`

- [ ] **Step 1: Create the fixture route**

Create `src/nav/__fixtures__/route.ts`:

```ts
import { Route } from '../navTypes';

// A simple 3-point L-shaped route: head west, then turn to a destination.
export const FIXTURE_ROUTE: Route = {
  distance: 1704,
  duration: 240,
  geometry: [
    { lat: 40.0, lng: -75.0 },
    { lat: 40.0, lng: -75.01 },   // ~852m west
    { lat: 40.005, lng: -75.01 }, // ~556m north
  ],
  steps: [
    {
      maneuver: {
        type: 'depart',
        instruction: 'Head west',
        location: { lat: 40.0, lng: -75.0 },
      },
      distance: 852,
      geometry: [
        { lat: 40.0, lng: -75.0 },
        { lat: 40.0, lng: -75.01 },
      ],
    },
    {
      maneuver: {
        type: 'turn',
        modifier: 'right',
        instruction: 'Turn right',
        location: { lat: 40.0, lng: -75.01 },
      },
      distance: 556,
      geometry: [
        { lat: 40.0, lng: -75.01 },
        { lat: 40.005, lng: -75.01 },
      ],
    },
    {
      maneuver: {
        type: 'arrive',
        instruction: 'You have arrived',
        location: { lat: 40.005, lng: -75.01 },
      },
      distance: 0,
      geometry: [{ lat: 40.005, lng: -75.01 }],
    },
  ],
};
```

- [ ] **Step 2: Write the failing test**

Create `src/nav/__tests__/directions.test.ts`:

```ts
import { MockDirectionsProvider } from '@/nav/directions';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

test('MockDirectionsProvider returns the configured route', async () => {
  const provider = new MockDirectionsProvider(FIXTURE_ROUTE);
  const route = await provider.getRoute(
    { lat: 40.0, lng: -75.0 },
    { lat: 40.005, lng: -75.01 },
  );
  expect(route.steps).toHaveLength(3);
  expect(route.distance).toBe(1704);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- directions.test`
Expected: FAIL ("Cannot find module '@/nav/directions'").

- [ ] **Step 4: Implement directions.ts**

Create `src/nav/directions.ts`:

```ts
import { LatLng, Route } from './navTypes';

export interface DirectionsProvider {
  getRoute(origin: LatLng, destination: LatLng): Promise<Route>;
}

// Test/dev double. Plan 3 adds MapboxDirectionsProvider implementing the same interface.
export class MockDirectionsProvider implements DirectionsProvider {
  constructor(private readonly route: Route) {}
  async getRoute(_origin: LatLng, _destination: LatLng): Promise<Route> {
    return this.route;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- directions.test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/nav/directions.ts src/nav/__fixtures__/route.ts src/nav/__tests__/directions.test.ts
git commit -m "feat(nav): add DirectionsProvider interface + mock and fixture route"
git push
```

---

## Task 5: NavSession (pure decision logic)

**Files:**
- Create: `src/nav/navSession.ts`
- Test: `src/nav/__tests__/navSession.test.ts`

`beginNav(route)` returns the initial navigating state. `updateNav(state, position, speed)` returns the next state: advances the step when the driver passes a maneuver, computes distance-to-next-turn, remaining distance, ETA, flags off-route (>40m from polyline) and arrival (<25m from destination).

- [ ] **Step 1: Write the failing tests**

Create `src/nav/__tests__/navSession.test.ts`:

```ts
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
  // first maneuver (the right turn) is ~852m west
  expect(s1.distanceToNextTurn).toBeGreaterThan(830);
  expect(s1.distanceToNextTurn).toBeLessThan(870);
});

test('updateNav advances the step after passing a maneuver', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  // near the corner where the right turn happens
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0099 }, 10);
  expect(s1.currentStepIndex).toBe(1);
});

test('updateNav flags off-route when far from the polyline', () => {
  const s0 = beginNav(FIXTURE_ROUTE);
  const s1 = updateNav(s0, { lat: 40.02, lng: -75.0 }, 10); // ~2km north
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
  const s1 = updateNav(s0, { lat: 40.0, lng: -75.0 }, 20); // 20 m/s
  // ~1704m remaining at 20 m/s ~= 85s (within tolerance)
  expect(s1.etaSeconds).toBeGreaterThan(60);
  expect(s1.etaSeconds).toBeLessThan(120);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- navSession.test`
Expected: FAIL ("Cannot find module '@/nav/navSession'").

- [ ] **Step 3: Implement navSession.ts**

Create `src/nav/navSession.ts`:

```ts
import { NavState, Route, LatLng } from './navTypes';
import { haversine, distanceToPolyline } from './geo';

const OFF_ROUTE_M = 40;
const ARRIVE_M = 25;
const ADVANCE_M = 30; // within this distance of a maneuver, consider it passed
const FALLBACK_SPEED = 13.4; // m/s (~30mph) used for ETA when stationary

export function beginNav(route: Route): NavState {
  return {
    status: 'navigating',
    route,
    currentStepIndex: 0,
    distanceToNextTurn: route.steps[0]?.distance ?? 0,
    distanceRemaining: route.distance,
    etaSeconds: route.duration,
    position: null,
    speed: 0,
  };
}

// Meters from `pos` to the maneuver point of a given step.
function distanceToManeuver(pos: LatLng, route: Route, stepIndex: number): number {
  const step = route.steps[stepIndex];
  if (!step) return 0;
  return haversine(pos, step.maneuver.location);
}

// Sum of remaining step distances from the current step onward.
function remainingFromStep(route: Route, stepIndex: number): number {
  return route.steps
    .slice(stepIndex)
    .reduce((sum, s) => sum + s.distance, 0);
}

export function updateNav(prev: NavState, position: LatLng, speed: number): NavState {
  const route = prev.route;
  if (!route) return { ...prev, position, speed };

  const destination = route.geometry[route.geometry.length - 1];
  const distToDest = haversine(position, destination);
  if (distToDest <= ARRIVE_M) {
    return {
      ...prev,
      status: 'arrived',
      position,
      speed,
      distanceToNextTurn: 0,
      distanceRemaining: distToDest,
      etaSeconds: 0,
    };
  }

  const offBy = distanceToPolyline(position, route.geometry);
  if (offBy > OFF_ROUTE_M) {
    return { ...prev, status: 'off-route', position, speed };
  }

  // Advance the step once we're within ADVANCE_M of the NEXT maneuver point
  // (currentStepIndex = the step being driven; the next turn is stepIndex+1).
  let stepIndex = prev.currentStepIndex;
  const lastStepIndex = route.steps.length - 1;
  while (
    stepIndex < lastStepIndex &&
    distanceToManeuver(position, route, stepIndex + 1) <= ADVANCE_M
  ) {
    stepIndex++;
  }

  const distanceToNextTurn = distanceToManeuver(position, route, stepIndex + 1);
  const distanceRemaining =
    distanceToNextTurn + remainingFromStep(route, stepIndex + 1);
  const effectiveSpeed = speed > 1 ? speed : FALLBACK_SPEED;
  const etaSeconds = Math.round(distanceRemaining / effectiveSpeed);

  return {
    ...prev,
    status: 'navigating',
    position,
    speed,
    currentStepIndex: stepIndex,
    distanceToNextTurn,
    distanceRemaining,
    etaSeconds,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- navSession.test`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/nav/navSession.ts src/nav/__tests__/navSession.test.ts
git commit -m "feat(nav): add NavSession step tracking, off-route, arrival, ETA"
git push
```

---

## Task 6: RouteController

**Files:**
- Create: `src/nav/routeController.ts`
- Test: `src/nav/__tests__/routeController.test.ts`

Thin async wrapper: takes a `DirectionsProvider`, fetches a route, hands back the initial NavState via `beginNav`.

- [ ] **Step 1: Write the failing test**

Create `src/nav/__tests__/routeController.test.ts`:

```ts
import { RouteController } from '@/nav/routeController';
import { MockDirectionsProvider } from '@/nav/directions';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

test('RouteController.start fetches a route and returns navigating state', async () => {
  const controller = new RouteController(new MockDirectionsProvider(FIXTURE_ROUTE));
  const state = await controller.start(
    { lat: 40.0, lng: -75.0 },
    { lat: 40.005, lng: -75.01 },
  );
  expect(state.status).toBe('navigating');
  expect(state.route).toBe(FIXTURE_ROUTE);
  expect(state.distanceRemaining).toBe(1704);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- routeController.test`
Expected: FAIL ("Cannot find module '@/nav/routeController'").

- [ ] **Step 3: Implement routeController.ts**

Create `src/nav/routeController.ts`:

```ts
import { DirectionsProvider } from './directions';
import { beginNav } from './navSession';
import { LatLng, NavState } from './navTypes';

export class RouteController {
  constructor(private readonly provider: DirectionsProvider) {}

  async start(origin: LatLng, destination: LatLng): Promise<NavState> {
    const route = await this.provider.getRoute(origin, destination);
    return beginNav(route);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- routeController.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/nav/routeController.ts src/nav/__tests__/routeController.test.ts
git commit -m "feat(nav): add RouteController wrapping a DirectionsProvider"
git push
```

---

## Task 7: Nav store (Zustand)

**Files:**
- Create: `src/state/navStore.ts`
- Test: `src/state/__tests__/navStore.test.ts`

Holds `NavState` + `activeSkinId`. Actions: `setNavState`, `applyPosition` (runs `updateNav`), `setActiveSkin`, `reset`. This is the single source of truth all surfaces subscribe to.

- [ ] **Step 1: Write the failing tests**

Create `src/state/__tests__/navStore.test.ts`:

```ts
import { useNavStore } from '@/state/navStore';
import { beginNav } from '@/nav/navSession';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

beforeEach(() => useNavStore.getState().reset());

test('store starts idle with a default skin', () => {
  const s = useNavStore.getState();
  expect(s.nav.status).toBe('idle');
  expect(s.activeSkinId).toBe('gta');
});

test('setNavState replaces nav state', () => {
  useNavStore.getState().setNavState(beginNav(FIXTURE_ROUTE));
  expect(useNavStore.getState().nav.status).toBe('navigating');
});

test('applyPosition runs updateNav against the active route', () => {
  useNavStore.getState().setNavState(beginNav(FIXTURE_ROUTE));
  useNavStore.getState().applyPosition({ lat: 40.005, lng: -75.01 }, 0);
  expect(useNavStore.getState().nav.status).toBe('arrived');
});

test('setActiveSkin changes the skin without touching nav', () => {
  useNavStore.getState().setNavState(beginNav(FIXTURE_ROUTE));
  useNavStore.getState().setActiveSkin('pipboy');
  const s = useNavStore.getState();
  expect(s.activeSkinId).toBe('pipboy');
  expect(s.nav.status).toBe('navigating');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- navStore.test`
Expected: FAIL ("Cannot find module '@/state/navStore'").

- [ ] **Step 3: Implement navStore.ts**

Create `src/state/navStore.ts`:

```ts
import { create } from 'zustand';
import { INITIAL_NAV_STATE, LatLng, NavState } from '@/nav/navTypes';
import { updateNav } from '@/nav/navSession';

// Skin ids are declared here as a string union placeholder; Plan 2 replaces
// this with the SkinManifest registry's id type.
export type SkinId = 'gta' | 'pipboy' | 'minecraft' | 'skyrim' | 'morrowind';

type NavStore = {
  nav: NavState;
  activeSkinId: SkinId;
  setNavState: (nav: NavState) => void;
  applyPosition: (position: LatLng, speed: number) => void;
  setActiveSkin: (id: SkinId) => void;
  reset: () => void;
};

export const useNavStore = create<NavStore>((set, get) => ({
  nav: INITIAL_NAV_STATE,
  activeSkinId: 'gta',
  setNavState: (nav) => set({ nav }),
  applyPosition: (position, speed) =>
    set({ nav: updateNav(get().nav, position, speed) }),
  setActiveSkin: (activeSkinId) => set({ activeSkinId }),
  reset: () => set({ nav: INITIAL_NAV_STATE, activeSkinId: 'gta' }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- navStore.test`
Expected: PASS (4 tests).

- [ ] **Step 5: Full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/state/navStore.ts src/state/__tests__/navStore.test.ts
git commit -m "feat(state): add nav store (NavState + active skin)"
git push
```

---

## Self-Review (completed by plan author)

**Spec coverage (Plan 1 slice):** Nav engine (§7) → Tasks 3–6. NavState single-source-of-truth (§5) → Task 7. Map abstraction seam (§4) → `DirectionsProvider` interface (Task 4) mirrors the `MapAdapter` seam; Mapbox impl deferred to Plan 3 as designed. Theme/surfaces/car (§6,§8) intentionally deferred to Plans 2–4. No token used anywhere — matches "build first, token last".

**Placeholder scan:** No TBD/TODO. `SkinId` union in Task 7 is explicitly marked as a placeholder the Plan 2 registry replaces — acceptable and documented.

**Type consistency:** `LatLng`, `Route`, `RouteStep`, `Maneuver`, `NavState`, `NavStatus`, `INITIAL_NAV_STATE` defined once (Task 2), imported everywhere. `beginNav`/`updateNav` signatures consistent across Tasks 5–7. `DirectionsProvider.getRoute` signature consistent Tasks 4 & 6. `getState().reset()` defined in Task 7 and used in its own tests.

---

## Next

Plan 2 (Theme engine + 5 skin manifests + switcher) authored after Plan 1 lands. Mapbox token instructions delivered just before Plan 3 (first token-requiring milestone).
