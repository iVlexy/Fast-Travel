# Fast Travel — Plan 3: Mapbox Data Path

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the mock routing with the real Mapbox data path — a `MapboxDirectionsProvider` implementing the existing `DirectionsProvider` interface, a response mapper (Mapbox Directions JSON → our `Route`), a map-style resolver (`mapStyleRef` → Mapbox style URI), and a token config module. All unit-tested with **mocked `fetch`** so the suite needs no live token. This completes the engine's real data path; the native map/HUD/car UI is Plan 4.

**Architecture:** `MapboxDirectionsProvider` builds a Directions v5 request URL from an origin/destination + the public token, fetches (via an injectable `fetch`), and maps the JSON to a `Route` with `mapboxToRoute`. The nav engine (Plan 1) consumes it unchanged — `RouteController` takes any `DirectionsProvider`, so swapping mock → Mapbox touches no nav logic. `resolveMapStyle` turns each skin's `mapStyleRef` into a Mapbox style URI (built-in styles now; custom Mapbox Studio styles swap in later without code change). `src/config/mapbox.ts` reads the public token from Expo `extra` at runtime and `process.env` in tests.

**Tech Stack:** TypeScript · Jest. No new deps (uses global `fetch`, injectable for tests).

---

## File Structure

```
/src/config/mapbox.ts                     getMapboxToken(env?) — token access
/src/map/mapboxDirections.ts              mapboxToRoute(json) + MapboxDirectionsProvider
/src/map/__fixtures__/mapboxResponse.ts   a captured Directions v5 sample
/src/map/mapStyle.ts                      resolveMapStyle(mapStyleRef): string
/src/map/__tests__/*.test.ts              colocated tests
```

`mapboxToRoute` is a pure mapper. `MapboxDirectionsProvider` is the only piece doing I/O (injectable fetch). `mapStyle.ts` and `config/mapbox.ts` are pure.

---

## Task 1: Token config

**Files:** Create `src/config/mapbox.ts`. Test: `src/config/__tests__/mapbox.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { getMapboxToken } from '@/config/mapbox';

test('returns the public token from the provided env', () => {
  expect(getMapboxToken({ MAPBOX_PUBLIC_TOKEN: 'pk.test' })).toBe('pk.test');
});

test('throws a helpful error when the token is missing', () => {
  expect(() => getMapboxToken({})).toThrow(/MAPBOX_PUBLIC_TOKEN/);
});
```

- [ ] **Step 2: Run → FAIL** — `npm test -- config/__tests__/mapbox` (PowerShell).

- [ ] **Step 3: Implement `src/config/mapbox.ts`**

```ts
// Token access. In tests/Node, reads from an env record (defaults to process.env).
// At runtime the app passes Expo's `extra.mapboxPublicToken` in as the value.
type Env = Record<string, string | undefined>;

export function getMapboxToken(env: Env = process.env): string {
  const token = env.MAPBOX_PUBLIC_TOKEN;
  if (!token) {
    throw new Error(
      'MAPBOX_PUBLIC_TOKEN is not set. Add it to .env.local (tests) or app.json extra (runtime). See docs/MAPBOX_SETUP.md.',
    );
  }
  return token;
}
```

- [ ] **Step 4: Run → PASS** (2 tests). Paste output.
- [ ] **Step 5: Commit** — `Add:` prefix; explicit path; push to `feat/plan-03-mapbox`.

---

## Task 2: Directions response mapper

**Files:** Create `src/map/__fixtures__/mapboxResponse.ts` and `src/map/mapboxDirections.ts` (mapper part). Test: `src/map/__tests__/mapboxToRoute.test.ts`.

- [ ] **Step 1: Create the fixture** — `src/map/__fixtures__/mapboxResponse.ts`

```ts
// Trimmed but shape-accurate Mapbox Directions v5 response (geometries=geojson, steps=true).
export const MAPBOX_SAMPLE = {
  code: 'Ok',
  routes: [
    {
      distance: 1408.2,
      duration: 210.5,
      geometry: {
        type: 'LineString',
        coordinates: [
          [-75.0, 40.0],
          [-75.01, 40.0],
          [-75.01, 40.005],
        ],
      },
      legs: [
        {
          steps: [
            {
              distance: 852.0,
              duration: 120.0,
              geometry: { type: 'LineString', coordinates: [[-75.0, 40.0], [-75.01, 40.0]] },
              maneuver: { type: 'depart', instruction: 'Head west', location: [-75.0, 40.0] },
            },
            {
              distance: 556.2,
              duration: 90.5,
              geometry: { type: 'LineString', coordinates: [[-75.01, 40.0], [-75.01, 40.005]] },
              maneuver: { type: 'turn', modifier: 'right', instruction: 'Turn right', location: [-75.01, 40.0] },
            },
            {
              distance: 0,
              duration: 0,
              geometry: { type: 'LineString', coordinates: [[-75.01, 40.005]] },
              maneuver: { type: 'arrive', instruction: 'You have arrived', location: [-75.01, 40.005] },
            },
          ],
        },
      ],
    },
  ],
};
```

- [ ] **Step 2: Write the failing test** — `src/map/__tests__/mapboxToRoute.test.ts`

```ts
import { mapboxToRoute } from '@/map/mapboxDirections';
import { MAPBOX_SAMPLE } from '@/map/__fixtures__/mapboxResponse';

test('maps a Mapbox response to our Route shape', () => {
  const route = mapboxToRoute(MAPBOX_SAMPLE);
  expect(route.distance).toBeCloseTo(1408.2, 1);
  expect(route.duration).toBeCloseTo(210.5, 1);
  expect(route.geometry).toHaveLength(3);
  expect(route.geometry[0]).toEqual({ lat: 40.0, lng: -75.0 });
  expect(route.steps).toHaveLength(3);
});

test('converts [lng,lat] pairs to {lat,lng} and lifts maneuver fields', () => {
  const route = mapboxToRoute(MAPBOX_SAMPLE);
  const turn = route.steps[1];
  expect(turn.maneuver.instruction).toBe('Turn right');
  expect(turn.maneuver.modifier).toBe('right');
  expect(turn.maneuver.location).toEqual({ lat: 40.0, lng: -75.01 });
  expect(turn.geometry[0]).toEqual({ lat: 40.0, lng: -75.01 });
});

test('throws when the response has no route', () => {
  expect(() => mapboxToRoute({ code: 'Ok', routes: [] })).toThrow();
});
```

- [ ] **Step 3: Run → FAIL** — `npm test -- mapboxToRoute`.

- [ ] **Step 4: Implement the mapper in `src/map/mapboxDirections.ts`** (provider added in Task 3; create the file with the mapper + types now)

```ts
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
```

- [ ] **Step 5: Run → PASS** (3 tests). Paste output.
- [ ] **Step 6: Commit** — `Add:` prefix; explicit paths; push.

---

## Task 3: MapboxDirectionsProvider

**Files:** Modify `src/map/mapboxDirections.ts` (append the provider). Test: `src/map/__tests__/mapboxDirectionsProvider.test.ts`.

`MapboxDirectionsProvider implements DirectionsProvider`. Injectable `fetch` for tests. Builds the v5 driving URL: `https://api.mapbox.com/directions/v5/mapbox/{profile}/{lng},{lat};{lng},{lat}?geometries=geojson&steps=true&overview=full&access_token=...`.

- [ ] **Step 1: Write the failing test** — `src/map/__tests__/mapboxDirectionsProvider.test.ts`

```ts
import { MapboxDirectionsProvider } from '@/map/mapboxDirections';
import { MAPBOX_SAMPLE } from '@/map/__fixtures__/mapboxResponse';

function fakeFetch(captured: { url?: string }) {
  return async (url: string) => {
    captured.url = url;
    return { ok: true, json: async () => MAPBOX_SAMPLE } as Response;
  };
}

test('builds a driving directions URL with coords and token, returns a Route', async () => {
  const cap: { url?: string } = {};
  const provider = new MapboxDirectionsProvider('pk.test', 'driving', fakeFetch(cap) as unknown as typeof fetch);
  const route = await provider.getRoute({ lat: 40.0, lng: -75.0 }, { lat: 40.005, lng: -75.01 });

  expect(cap.url).toContain('/directions/v5/mapbox/driving/');
  expect(cap.url).toContain('-75,40;-75.01,40.005');   // lng,lat;lng,lat
  expect(cap.url).toContain('access_token=pk.test');
  expect(cap.url).toContain('geometries=geojson');
  expect(route.distance).toBeCloseTo(1408.2, 1);
  expect(route.steps).toHaveLength(3);
});

test('throws on a non-ok HTTP response', async () => {
  const badFetch = (async () => ({ ok: false, status: 422, json: async () => ({}) })) as unknown as typeof fetch;
  const provider = new MapboxDirectionsProvider('pk.test', 'driving', badFetch);
  await expect(
    provider.getRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 }),
  ).rejects.toThrow(/422/);
});
```

- [ ] **Step 2: Run → FAIL** — `npm test -- mapboxDirectionsProvider`.

- [ ] **Step 3: Append to `src/map/mapboxDirections.ts`**

```ts
import { DirectionsProvider } from '@/nav/directions';
import { LatLng } from '@/nav/navTypes';

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
```

(Keep the mapper + types from Task 2 at the top of the file; add these imports alongside the existing `navTypes` import.)

- [ ] **Step 4: Run → PASS** (2 tests). Paste output.
- [ ] **Step 5: Commit** — `Add:` prefix; explicit paths; push.

---

## Task 4: Map style resolver

**Files:** Create `src/map/mapStyle.ts`. Test: `src/map/__tests__/mapStyle.test.ts`.

Maps each skin's `mapStyleRef` to a Mapbox style URI. Built-in styles are used as starting points; custom Mapbox Studio styles replace the values later with no code change. Every shipped skin's `mapStyleRef` must resolve.

- [ ] **Step 1: Write the failing test** — `src/map/__tests__/mapStyle.test.ts`

```ts
import { resolveMapStyle } from '@/map/mapStyle';
import { listSkins } from '@/theme/skinRegistry';

test('every shipped skin mapStyleRef resolves to a mapbox style uri', () => {
  for (const skin of listSkins()) {
    const uri = resolveMapStyle(skin.mapStyleRef);
    expect(uri).toMatch(/^mapbox:\/\/styles\//);
  }
});

test('unknown ref falls back to the default style', () => {
  expect(resolveMapStyle('does-not-exist')).toMatch(/^mapbox:\/\/styles\//);
});

test('gta ref maps to a dark base style', () => {
  expect(resolveMapStyle('gta-streets')).toBe('mapbox://styles/mapbox/dark-v11');
});
```

- [ ] **Step 2: Run → FAIL** — `npm test -- mapStyle`.

- [ ] **Step 3: Implement `src/map/mapStyle.ts`**

```ts
// mapStyleRef -> Mapbox style URI. These built-in styles are v1 starting points;
// replace the values with custom Mapbox Studio style URIs per skin later — the
// keys (the skins' mapStyleRef values) stay the same, so no caller changes.
const STYLES: Record<string, string> = {
  'gta-streets': 'mapbox://styles/mapbox/dark-v11',
  'pipboy-green': 'mapbox://styles/mapbox/dark-v11',
  'minecraft-pixel': 'mapbox://styles/mapbox/outdoors-v12',
  'skyrim-terrain': 'mapbox://styles/mapbox/outdoors-v12',
  'morrowind-parchment': 'mapbox://styles/mapbox/light-v11',
};

export const DEFAULT_STYLE = 'mapbox://styles/mapbox/navigation-night-v1';

export function resolveMapStyle(mapStyleRef: string): string {
  return STYLES[mapStyleRef] ?? DEFAULT_STYLE;
}
```

- [ ] **Step 4: Run → PASS** (3 tests). Paste output.
- [ ] **Step 5: Full suite + typecheck** — `npm test` && `npm run typecheck`. All pass, no type errors. Paste summary lines.
- [ ] **Step 6: Commit** — `Add:` prefix; explicit paths; push.

---

## Self-Review (completed by plan author)

**Spec coverage (Plan 3 slice):** Mapbox routing (§4) → Tasks 2–3 (`MapboxDirectionsProvider` implements the Plan 1 `DirectionsProvider` seam; nav engine unchanged). Per-skin map restyle (§6) → Task 4 `resolveMapStyle` keyed on each manifest's `mapStyleRef`; custom Studio styles swap in later. Free-tier token handling (§4) → Task 1 config + `docs/MAPBOX_SETUP.md`. Tests mock `fetch`, so CI needs no live token — matches "token used, but suite stays hermetic."

**Placeholder scan:** No TBD/TODO. Built-in style URIs in Task 4 are explicitly documented as swappable starting points (custom styles = later art work), not incomplete code.

**Type consistency:** `mapboxToRoute` returns the Plan 1 `Route`/`RouteStep`/`Maneuver`/`LatLng` types (imported, not redefined). `MapboxDirectionsProvider` implements `DirectionsProvider` from `@/nav/directions` — so `RouteController` accepts it directly. `resolveMapStyle` consumes the registry's `mapStyleRef` strings (Plan 2).

---

## Next

Plan 4: native surfaces — phone HUD RN components (token-driven slot defaults + the declared per-skin overrides), `@rnmapbox/maps` MapView wired to the active skin's style + live route, `expo-location` feeding `applyPosition`, the skin-switcher screen, and the CarPlay/Android Auto surfaces. Requires `expo prebuild` + a device/simulator and (CarPlay) Apple's entitlement — see the Plan 4 handoff. This is the part that cannot be verified in a headless environment.
