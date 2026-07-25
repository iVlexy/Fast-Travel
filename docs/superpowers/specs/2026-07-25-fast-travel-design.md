# Fast Travel — Design Spec

- **Date:** 2026-07-25
- **Publisher:** Browning Cloud Solutions
- **Working name:** Fast Travel — GPS turn-by-turn navigation skinned like AAA game minimaps.
- **Status:** Approved design, pre-implementation.

---

## 1. Summary

Fast Travel is a mobile turn-by-turn driving navigation app whose entire look is
a swappable **game minimap skin**. Users navigate real roads while the map, HUD,
markers, route line, and turn cards render in the style of a chosen AAA title
(GTA, Fallout/Pip-Boy, Minecraft, Skyrim, Morrowind/Oblivion). Skins are
switchable at runtime. Car head-unit support (CarPlay + Android Auto) ships in v1.

A later phase adds a waypoint/quest layer and minigames.

## 2. Goals

- Real driving turn-by-turn navigation that is genuinely usable.
- Five fully realized game skins in v1, including **per-skin restyling of the
  actual map tiles** (roads, water, terrain), not just HUD chrome.
- Runtime theme switcher.
- CarPlay + Android Auto navigation surfaces in v1.
- Architecture that makes adding a 6th+ skin cheap (drop in a manifest).

## 3. Non-Goals (explicitly out of v1)

- Waypoints / quests / objective markers — **Phase 2**.
- Minigames — **Phase 2**.
- Walking / cycling travel modes — **Phase 2**.
- Offline maps.
- User accounts / cloud sync / social.

## 4. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Platform | Expo (custom dev client / prebuild) + React Native + TypeScript, iOS + Android | Best real GPS; single codebase; car libs need prebuild (no Expo Go) |
| Map + routing | Mapbox — `@rnmapbox/maps` + Mapbox Directions API | Full vector map restyling (required for per-skin map look) + turn-by-turn routing in one SDK; free tier (~50k loads/mo) covers hobby scale |
| Map abstraction | `MapAdapter` interface, `MapboxAdapter` impl | Contain a future swap to free MapLibre without touching upper layers |
| Theme architecture | **Hybrid** — token-driven manifests + per-slot component overrides | 5 skins cheap via data; bespoke effects (Pip-Boy scanlines, Minecraft voxel) still possible |
| Map restyle depth | **Full per-skin map restyle** for all 5 skins | Most immersive; each skin ships its own Mapbox style |
| Travel modes v1 | Driving only | Scope; walking/cycling pair with Phase 2 quest layer |
| Car support | CarPlay + Android Auto in v1 (**blocking**) via `react-native-carplay` | User requirement |

## 5. Architecture (layered)

Five layers, each isolated behind an interface. Phone, car, and every skin
consume the same core.

```
SURFACES   PhoneHud (rich game HUD, full skins) · CarSurface (CarPlay + Android Auto, styled map only)
THEME      SkinManifest[] (tokens) · SlotRegistry (default token slots + per-skin overrides)
NAV        RouteController (request/select route) · NavSession (step, dist-to-turn, ETA, reroute, off-route) → NavState
MAP        MapAdapter iface → MapboxAdapter (v1)   [swap → MapLibre later]
PLATFORM   Location · permissions · storage · audio
```

**Invariant:** `NavState` is the single source of truth. Phone HUD, car surface,
and all skins read the same `NavState` stream and differ only in rendering. No
navigation logic lives in UI. UI dispatches intents (start route, cancel, switch
skin); it never mutates nav state directly. Data flow is one-way.

## 6. Theme / Skin System (approach #3)

A skin = **one manifest** + optional **slot overrides**.

```ts
type SkinManifest = {
  id: 'gta' | 'pipboy' | 'minecraft' | 'skyrim' | 'morrowind'
  name: string
  mapStyle: MapStyleRef          // Mapbox style URL or inline style JSON (per-skin map restyle)
  tokens: {
    palette: { routeLine, background, text, accent, danger, /* … */ }
    typography: { fontFamily, weights, sizes }
    frame: { shape: 'circle' | 'rect' | 'strip' | 'paper', border, glow }
    markers: { player, waypoint, quest, destination }   // glyph/asset per role
    turnCard: { layout, iconSet }
    sfx?: { reroute, arrive, turn }                      // optional sound pack
  }
  overrides?: Partial<Record<HudSlot, React.ComponentType<SlotProps>>>
}
```

**HUD slots** (fixed set, token-rendered by default):
`MapFrame · PlayerMarker · TurnCard · CompassStrip · SpeedBadge · EtaPanel · WaypointLayer`

- Pure-data skins (GTA, Skyrim, Morrowind): manifest only.
- Override skins:
  - **Pip-Boy** → custom `MapFrame` (green phosphor + scanline shader) + `sfx`.
  - **Minecraft** → custom `MapFrame` / `PlayerMarker` (pixel/voxel styling).
- Adding a skin later = new manifest (+ overrides only if bespoke).
- Switcher swaps active `SkinManifest` at runtime; `NavState` untouched. Last
  chosen skin persisted.

### Skin roster v1

| Skin | Map style | Notable overrides |
|---|---|---|
| GTA V | Gray streets, dark bg, glowing blue route | none (token-only) |
| Fallout (Pip-Boy) | Green phosphor monochrome | MapFrame (scanline shader), sfx |
| Minecraft | Pixel-green terrain, blocky | MapFrame, PlayerMarker (voxel) |
| Skyrim | Muted terrain, top compass strip | none / light |
| Morrowind / Oblivion | Parchment, ink roads | frame shape 'paper' |

## 7. Navigation Engine (headless)

- `RouteController` — calls Mapbox Directions (driving); returns route geometry +
  step maneuvers; handles route selection.
- `NavSession` — consumes live GPS; computes current step, distance-to-next-turn,
  ETA/arrival, speed, off-route detection → triggers reroute; emits `NavState`.
- No React, no Mapbox UI. Deterministic and unit-testable against recorded GPS
  traces.

## 8. Car Surfaces (v1, blocking)

- `react-native-carplay` (covers both platforms) via Expo prebuild / custom dev client.
- **CarPlay** → `CPMapTemplate` + `CPNavigationSession`; app draws the styled map,
  system renders maneuver/turn UI.
- **Android Auto** → `androidx.car.app` `NavigationTemplate`.
- Both read the same `NavState`.
- **Constraint:** head-unit UI is **system-templated for driver safety**. The
  skin's *map style* carries onto the car screen; turn/maneuver chrome is
  templated and only lightly themed via allowed colors. The rich game HUD is a
  **phone-only** experience.

### Top schedule risk — Apple CarPlay entitlement

CarPlay navigation requires the `carplay-maps` entitlement, which Apple must
approve. Turnaround is weeks and outside our control. **Day-1 action: file the
entitlement request** so review runs in parallel with the build. Android Auto
requires a Play Console nav-app declaration + review (lower risk).

## 9. Data Flow

```
GPS fix → LocationService → NavSession → NavState ─┬→ PhoneHud (active skin renders slots)
                                 ▲                  ├→ CarSurface (styled map + templated chrome)
                       RouteController               └→ WaypointLayer (Phase 2)
                                 ▲
                       Mapbox Directions
```

One-way. UI reads `NavState`, dispatches intents, never mutates nav.

## 10. Tech Stack & Project Structure

**Stack:** Expo (custom dev client / prebuild) · React Native · TypeScript ·
`@rnmapbox/maps` · Mapbox Directions · `react-native-carplay` · Zustand (holds
`NavState` + `activeSkin`) · `expo-location` (GPS) · `expo-av` (skin SFX) ·
MMKV / AsyncStorage (persist last skin + prefs).

```
/src
  /platform      location, permissions, storage, audio
  /map           MapAdapter iface, MapboxAdapter
  /nav           RouteController, NavSession, navState types
  /theme         SkinManifest type, SlotRegistry, /skins/{gta,pipboy,minecraft,skyrim,morrowind}
  /surfaces
    /phone       PhoneHud + slot components (defaults)
    /car         CarPlay + AndroidAuto bridges
  /app           screens, navigation shell, skin switcher
/assets/skins    per-skin fonts, glyphs, map style JSON, sfx
```

## 11. Testing

- **Nav engine** — TDD; unit tests on recorded GPS traces (off-route, reroute,
  arrival, ETA math). Core correctness lives here.
- **Theme engine** — snapshot each skin's slot rendering; manifest schema
  validation; TDD on SlotRegistry resolution (default vs override).
- **Map / car** — thin adapters; manual + smoke tests (simulator GPS routes,
  CarPlay simulator, Android Auto DHU).
- Discipline: TDD on the two headless engines (nav, theme); manual verification
  on native surfaces.

## 12. Open Items / Follow-ups

- Confirm Mapbox account + access token provisioning (billing safeguard on free tier).
- Author 5 Mapbox styles (largest art task) — may parallelize per skin.
- File Apple CarPlay entitlement request on day 1.
- Phase 2 spec (waypoints/quests/minigames/walking) authored separately after v1.
