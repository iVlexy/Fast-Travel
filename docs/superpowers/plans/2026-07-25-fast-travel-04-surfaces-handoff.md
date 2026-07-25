# Fast Travel — Plan 4: Surfaces (Phone HUD + CarPlay/Android Auto) & Device Handoff

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.
>
> **⚠️ Environment gate:** Everything past Task 1 requires `expo prebuild` + a real device or simulator, and CarPlay additionally requires Apple's `carplay-maps` entitlement (their review, weeks). These steps **cannot be verified in a headless CI/agent environment** — they are authored as code + exact run instructions for a developer on a Mac (iOS) / with Android Studio. Only Task 1 (a pure adapter) is unit-testable and should be executed the same TDD way as Plans 1–3.

**Goal:** Put the visible app on phone + car: a `@rnmapbox/maps` MapView styled by the active skin, the token-driven HUD slot components (+ the declared per-skin overrides), live `expo-location` driving `NavState`, a skin switcher, and CarPlay + Android Auto surfaces reading the same `NavState`.

**Architecture:** The App subscribes to `useNavStore`. A headless `locationToPosition` adapter (Task 1) converts each GPS reading into an `applyPosition(position, speed)` call — the single write path into the engine. `MapScreen` renders `Mapbox.MapView` with `styleURL = resolveMapStyle(activeSkin.mapStyleRef)`, draws the route line + camera-follow, and overlays the HUD. Each HUD slot is resolved via `resolveSlot(activeSkin, slot)`: `tokens` → the default token-driven component; `override` → the skin's bespoke component (Pip-Boy scanline frame, Minecraft voxel marker, etc.). CarPlay/Android Auto mount separate templated surfaces that read the same store.

**Tech Stack (new deps):** `@rnmapbox/maps`, `expo-location`, `expo-av`, `react-native-carplay`, `expo-dev-client`. Requires `expo prebuild` (no Expo Go).

---

## Task 1: Location→engine adapter (TESTABLE — do this headless, TDD)

**Files:** Create `src/platform/locationToPosition.ts`. Test: `src/platform/__tests__/locationToPosition.test.ts`.

Converts an Expo location reading (`{ coords: { latitude, longitude, speed } }`) into our `{ position: LatLng, speed: number }`, clamping a null/negative speed to 0.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run → FAIL** — `npm test -- locationToPosition`.

- [ ] **Step 3: Implement `src/platform/locationToPosition.ts`**

```ts
import { LatLng } from '@/nav/navTypes';

export type LocationReading = {
  coords: { latitude: number; longitude: number; speed: number | null };
};

export function readingToPosition(r: LocationReading): { position: LatLng; speed: number } {
  const speed = r.coords.speed;
  return {
    position: { lat: r.coords.latitude, lng: r.coords.longitude },
    speed: speed != null && speed > 0 ? speed : 0,
  };
}
```

- [ ] **Step 4: Run → PASS** (2 tests). Full suite + typecheck. Commit `Add:`; push.

---

## Task 2: App entry + dependencies (device)

- [ ] Install deps: `npx expo install @rnmapbox/maps expo-location expo-av expo-dev-client` and `npm i react-native-carplay`.
- [ ] Fix the entry: change `package.json` `"main"` from `src/index.ts` to `"expo-router/entry"` OR add an `App.tsx` root and `"main": "index.js"` with `registerRootComponent(App)`. (Plan 1 left a headless entry; this is the noted carry-over.)
- [ ] Add the `@rnmapbox/maps` config plugin to `app.json` with the download token wired from env, and set the public token via `Mapbox.setAccessToken(getMapboxToken(...))` at app start (read from `expo-constants` `extra.mapboxPublicToken`). See `docs/MAPBOX_SETUP.md`.
- [ ] `npx expo prebuild` to generate `ios/` + `android/`.

## Task 3: MapScreen (device)

- [ ] `src/surfaces/phone/MapScreen.tsx`: `Mapbox.MapView` with `styleURL={resolveMapStyle(activeSkin.mapStyleRef)}`, a `Mapbox.Camera` following `nav.position` with heading-up (`followUserMode`), a `Mapbox.ShapeSource`/`LineLayer` drawing `nav.route.geometry` styled with `activeSkin.tokens.palette.routeLine` + casing, and a destination marker. Subscribe with `useNavStore`.

## Task 4: HUD slots (device)

- [ ] `src/surfaces/phone/hud/`: default token-driven components for each `HudSlot` (`TurnCard`, `SpeedBadge`, `EtaPanel`, `CompassStrip`, `PlayerMarker`, `MapFrame`, `WaypointLayer`), each reading its config from `resolveSlot(skin, slot)` → `tokens`.
- [ ] Override components for the declared slots: Pip-Boy `MapFrame` (green phosphor + scanline via `expo-gl` or an overlay) & `CompassStrip`; Minecraft `MapFrame` + `PlayerMarker` (pixel); Morrowind `MapFrame` (parchment); Skyrim `CompassStrip`. A `<HudSlotHost slot=...>` picks override-vs-default from `resolveSlot`.
- [ ] The turn-card driven directly by `nav.currentStepIndex`/`distanceToNextTurn` (same fields the web preview uses).

## Task 5: Skin switcher (device)

- [ ] `src/surfaces/phone/SkinSwitcher.tsx`: horizontal picker of `listSkins()`; tapping calls `useNavStore.setActiveSkin(id)`; persist the choice (add `expo-secure-store`/`AsyncStorage`, hydrate on launch). Switching must not disturb `nav` (already guaranteed by the store).

## Task 6: Live location (device)

- [ ] On launch request `Location.requestForegroundPermissionsAsync()` (and background for turn-by-turn). Subscribe `Location.watchPositionAsync({accuracy:High})`; for each reading call `applyPosition(...readingToPosition(reading))`. Add the iOS/Android background-location + `NSLocationWhenInUseUsageDescription` config.

## Task 7: CarPlay + Android Auto (device + Apple entitlement)

- [ ] `react-native-carplay`: mount a `CarPlay` navigation template; draw the styled map via the shared map component; feed maneuver/eta from `NavState`. **Head-unit UI is system-templated — only the map + allowed colors are themable** (per spec §8).
- [ ] Android Auto: `androidx.car.app` `NavigationTemplate` via the same lib.
- [ ] **Apple CarPlay entitlement** (`com.apple.developer.carplay-maps`): request from Apple **on day 1** — it gates shipping and takes weeks. Add the entitlement to the iOS target once granted.

---

## Device Handoff — exact run steps

```bash
# 1. tokens (once, per machine) — see docs/MAPBOX_SETUP.md
#    ~/.netrc (iOS) + ~/.gradle/gradle.properties (Android) get the sk. token

# 2. install + generate native projects
npx expo install @rnmapbox/maps expo-location expo-av expo-dev-client
npm i react-native-carplay
npx expo prebuild

# 3a. iOS (Mac only)
npx expo run:ios          # builds a dev client + launches simulator
#     Simulator ▸ Features ▸ Location ▸ Freeway Drive  → live route demo
#     CarPlay: Simulator ▸ I/O ▸ External Displays ▸ CarPlay

# 3b. Android
npx expo run:android
#     Android Auto: use the Desktop Head Unit (DHU) from Android Studio

# 4. verify
#   - map renders in the active skin's style; switching skins re-styles live
#   - driving the simulated route advances the turn card + ETA (same engine as tests)
#   - off-route (drive off the line) flips to recalculating
```

**Verification gates (device):** map visible in each skin · route line themed per skin · turn card/ETA advance on movement · off-route detection fires · skin switch preserves the active route · CarPlay/AA surfaces show the map + maneuvers.

**Blocked-in-this-environment items:** everything in Tasks 2–7 (native build, on-device map, CarPlay/AA), plus Apple's entitlement approval. These need the developer's Mac/device and Apple's review — they are the reason Plan 4 is a handoff, not a headless build.

---

## Next

After Plan 4 ships on-device, **Phase 2**: waypoints/quests + minigames, walking/cycling modes, offline maps, accounts — each its own spec → plan cycle (out of v1 scope per the design).
