# Fast Travel — Plan 2: Theme Engine & 5 Skin Manifests

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the token-driven theme engine (approach #3) as pure data + a resolver: five skin manifests (GTA, Pip-Boy, Minecraft, Skyrim, Morrowind), a registry, a slot resolver that returns either token config or an override marker, and manifest validation. All pure/data, unit-tested, **zero** Mapbox token, **zero** React (the actual RN slot components arrive in Plan 3).

**Architecture:** A `SkinManifest` is a plain data object: an id, a display name, a `mapStyleRef` (a string id resolved to a Mapbox style in Plan 3 — not fetched here), a `tokens` bundle (palette, typography, frame, markers, turnCard, optional sfx), and an `overrideSlots` list naming HUD slots that need a bespoke component in Plan 3. The `SlotResolver` decides, per (skin, slot), whether the phone HUD should render the token-driven default or defer to a custom component. The registry exposes lookup/list and a default. `navStore`'s `SkinId` placeholder is replaced by the registry's real id type.

**Tech Stack:** TypeScript · Jest (`jest-expo`). No new dependencies.

---

## File Structure

```
/src/theme/skinTypes.ts       SkinId, HudSlot, token types, SkinManifest, SlotResolution
/src/theme/skins/gta.ts       GTA_SKIN manifest
/src/theme/skins/pipboy.ts    PIPBOY_SKIN manifest
/src/theme/skins/minecraft.ts MINECRAFT_SKIN manifest
/src/theme/skins/skyrim.ts    SKYRIM_SKIN manifest
/src/theme/skins/morrowind.ts MORROWIND_SKIN manifest
/src/theme/skinRegistry.ts    SKINS map, getSkin(), listSkins(), DEFAULT_SKIN_ID, SkinId (derived)
/src/theme/slotResolver.ts    resolveSlot(skin, slot): SlotResolution
/src/theme/validateManifest.ts validateManifest(m): string[]  (empty = valid)
/src/theme/__tests__/*.test.ts colocated tests
```

Manifests are data files with one responsibility each. `slotResolver.ts` and `validateManifest.ts` are pure functions. `skinRegistry.ts` is the single place that knows all skins.

---

## Task 1: Skin & token types

**Files:** Create `src/theme/skinTypes.ts`. No test (types only; validated by later tasks).

- [ ] **Step 1: Create `src/theme/skinTypes.ts`**

```ts
// The seven HUD render slots every skin provides (token-driven by default,
// or overridden by a bespoke component in Plan 3).
export const HUD_SLOTS = [
  'MapFrame',
  'PlayerMarker',
  'TurnCard',
  'CompassStrip',
  'SpeedBadge',
  'EtaPanel',
  'WaypointLayer',
] as const;
export type HudSlot = (typeof HUD_SLOTS)[number];

export type PaletteTokens = {
  background: string;
  surface: string;
  routeLine: string;
  routeCasing: string;
  text: string;
  textMuted: string;
  accent: string;   // objective / highlight
  danger: string;   // off-route / recalculation
};

export type TypographyTokens = {
  fontFamily: string;      // font asset id resolved in Plan 3
  headingWeight: number;   // 100..900
  bodyWeight: number;
  letterSpacing: number;   // em
};

export type FrameShape = 'circle' | 'rect' | 'strip' | 'paper';
export type FrameTokens = {
  shape: FrameShape;
  borderColor: string;
  borderWidth: number;     // dp
  glow: boolean;
  cornerRadius: number;    // dp (ignored for circle)
};

// Marker glyph ids; resolved to assets/components in Plan 3.
export type MarkerTokens = {
  player: string;
  waypoint: string;
  quest: string;
  destination: string;
};

export type TurnCardLayout = 'banner' | 'compass' | 'card';
export type TurnCardTokens = {
  layout: TurnCardLayout;
  iconSet: string;         // icon pack id resolved in Plan 3
};

export type SfxTokens = {
  reroute: string;
  arrive: string;
  turn: string;
};

export type SkinTokens = {
  palette: PaletteTokens;
  typography: TypographyTokens;
  frame: FrameTokens;
  markers: MarkerTokens;
  turnCard: TurnCardTokens;
  sfx?: SfxTokens;
};

export type SkinManifest = {
  id: string;              // registry narrows this to SkinId
  name: string;
  mapStyleRef: string;     // resolved to a Mapbox style in Plan 3
  tokens: SkinTokens;
  overrideSlots: HudSlot[]; // slots needing a bespoke component in Plan 3
};

// What the phone HUD should render for a given (skin, slot).
export type SlotResolution =
  | { kind: 'tokens'; tokens: SkinTokens }
  | { kind: 'override'; slot: HudSlot };
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` (PowerShell). Expected: no errors.
- [ ] **Step 3: Commit** — team git conventions (`Add:` prefix; stage only this file by explicit path, not `git add -A`); push.

---

## Task 2: Five skin manifests + registry

**Files:** Create `src/theme/skins/{gta,pipboy,minecraft,skyrim,morrowind}.ts` and `src/theme/skinRegistry.ts`. Test: `src/theme/__tests__/skinRegistry.test.ts`.

- [ ] **Step 1: Write the failing test** — `src/theme/__tests__/skinRegistry.test.ts`

```ts
import { SKINS, getSkin, listSkins, DEFAULT_SKIN_ID } from '@/theme/skinRegistry';
import { HUD_SLOTS } from '@/theme/skinTypes';

test('registry has exactly the five v1 skins', () => {
  expect(listSkins().map(s => s.id).sort()).toEqual(
    ['gta', 'minecraft', 'morrowind', 'pipboy', 'skyrim'],
  );
});

test('every manifest id matches its registry key', () => {
  for (const [key, skin] of Object.entries(SKINS)) {
    expect(skin.id).toBe(key);
  }
});

test('getSkin returns the requested manifest', () => {
  expect(getSkin('gta').name).toBe('GTA');
});

test('getSkin throws on an unknown id', () => {
  // @ts-expect-error unknown id
  expect(() => getSkin('halo')).toThrow();
});

test('default skin exists in the registry', () => {
  expect(SKINS[DEFAULT_SKIN_ID]).toBeDefined();
});

test('overrideSlots only name real HUD slots', () => {
  for (const skin of listSkins()) {
    for (const slot of skin.overrideSlots) {
      expect(HUD_SLOTS).toContain(slot);
    }
  }
});
```

- [ ] **Step 2: Run test → FAIL** — `npm test -- skinRegistry.test` (module not found).

- [ ] **Step 3: Create the five manifests.**

`src/theme/skins/gta.ts`:
```ts
import { SkinManifest } from '../skinTypes';

export const GTA_SKIN: SkinManifest = {
  id: 'gta',
  name: 'GTA',
  mapStyleRef: 'gta-streets',
  tokens: {
    palette: {
      background: '#0b0f14', surface: '#12181f', routeLine: '#29b6ff',
      routeCasing: '#dff3ff', text: '#e8eef5', textMuted: '#7a8798',
      accent: '#7bd63f', danger: '#ff5a4d',
    },
    typography: { fontFamily: 'gta-condensed', headingWeight: 800, bodyWeight: 600, letterSpacing: 0.06 },
    frame: { shape: 'rect', borderColor: '#05070a', borderWidth: 3, glow: false, cornerRadius: 16 },
    markers: { player: 'chevron', waypoint: 'pin', quest: 'ring', destination: 'flag' },
    turnCard: { layout: 'card', iconSet: 'gta-arrows' },
    sfx: { reroute: 'gta-reroute', arrive: 'gta-arrive', turn: 'gta-blip' },
  },
  overrideSlots: [],
};
```

`src/theme/skins/pipboy.ts`:
```ts
import { SkinManifest } from '../skinTypes';

export const PIPBOY_SKIN: SkinManifest = {
  id: 'pipboy',
  name: 'Pip-Boy',
  mapStyleRef: 'pipboy-green',
  tokens: {
    palette: {
      background: '#03140a', surface: '#04250f', routeLine: '#3cff7a',
      routeCasing: '#bfffd6', text: '#3cff7a', textMuted: '#1f7a44',
      accent: '#bfffd6', danger: '#ff6b57',
    },
    typography: { fontFamily: 'pipboy-mono', headingWeight: 700, bodyWeight: 500, letterSpacing: 0.08 },
    frame: { shape: 'strip', borderColor: '#2f7f4f', borderWidth: 1, glow: true, cornerRadius: 6 },
    markers: { player: 'triangle', waypoint: 'diamond', quest: 'diamond', destination: 'diamond' },
    turnCard: { layout: 'compass', iconSet: 'pipboy-ticks' },
    sfx: { reroute: 'pipboy-static', arrive: 'pipboy-ping', turn: 'pipboy-tick' },
  },
  overrideSlots: ['MapFrame', 'CompassStrip'],
};
```

`src/theme/skins/minecraft.ts`:
```ts
import { SkinManifest } from '../skinTypes';

export const MINECRAFT_SKIN: SkinManifest = {
  id: 'minecraft',
  name: 'Minecraft',
  mapStyleRef: 'minecraft-pixel',
  tokens: {
    palette: {
      background: '#c8a976', surface: '#6b5334', routeLine: '#f4d03f',
      routeCasing: '#6b5334', text: '#3a2a12', textMuted: '#6b5334',
      accent: '#5b8a3c', danger: '#c0392b',
    },
    typography: { fontFamily: 'minecraft-pixel', headingWeight: 700, bodyWeight: 400, letterSpacing: 0 },
    frame: { shape: 'rect', borderColor: '#6b5334', borderWidth: 6, glow: false, cornerRadius: 0 },
    markers: { player: 'pixel-arrow', waypoint: 'pixel-banner', quest: 'pixel-star', destination: 'pixel-beacon' },
    turnCard: { layout: 'banner', iconSet: 'minecraft-pixel-arrows' },
  },
  overrideSlots: ['MapFrame', 'PlayerMarker'],
};
```

`src/theme/skins/skyrim.ts`:
```ts
import { SkinManifest } from '../skinTypes';

export const SKYRIM_SKIN: SkinManifest = {
  id: 'skyrim',
  name: 'Skyrim',
  mapStyleRef: 'skyrim-terrain',
  tokens: {
    palette: {
      background: '#0d1519', surface: '#20303a', routeLine: '#cddce6',
      routeCasing: '#0d1519', text: '#e8f2f8', textMuted: '#6b7c88',
      accent: '#c9a24a', danger: '#b0503c',
    },
    typography: { fontFamily: 'skyrim-serif', headingWeight: 600, bodyWeight: 400, letterSpacing: 0.04 },
    frame: { shape: 'strip', borderColor: '#0d1519', borderWidth: 1, glow: false, cornerRadius: 4 },
    markers: { player: 'chevron', waypoint: 'triangle', quest: 'triangle-filled', destination: 'triangle-filled' },
    turnCard: { layout: 'compass', iconSet: 'skyrim-marks' },
  },
  overrideSlots: ['CompassStrip'],
};
```

`src/theme/skins/morrowind.ts`:
```ts
import { SkinManifest } from '../skinTypes';

export const MORROWIND_SKIN: SkinManifest = {
  id: 'morrowind',
  name: 'Morrowind',
  mapStyleRef: 'morrowind-parchment',
  tokens: {
    palette: {
      background: '#241a0f', surface: '#cdb37a', routeLine: '#5a3d17',
      routeCasing: '#efe2c4', text: '#2b1d0c', textMuted: '#6b4a1e',
      accent: '#2b6cff', danger: '#8a1f1f',
    },
    typography: { fontFamily: 'morrowind-hand', headingWeight: 700, bodyWeight: 400, letterSpacing: 0.02 },
    frame: { shape: 'paper', borderColor: '#4a3a20', borderWidth: 4, glow: false, cornerRadius: 4 },
    markers: { player: 'red-arrow', waypoint: 'ink-x', quest: 'ink-x', destination: 'ink-x' },
    turnCard: { layout: 'card', iconSet: 'morrowind-ink-arrows' },
  },
  overrideSlots: ['MapFrame'],
};
```

- [ ] **Step 4: Create `src/theme/skinRegistry.ts`**

```ts
import { SkinManifest } from './skinTypes';
import { GTA_SKIN } from './skins/gta';
import { PIPBOY_SKIN } from './skins/pipboy';
import { MINECRAFT_SKIN } from './skins/minecraft';
import { SKYRIM_SKIN } from './skins/skyrim';
import { MORROWIND_SKIN } from './skins/morrowind';

export const SKINS = {
  gta: GTA_SKIN,
  pipboy: PIPBOY_SKIN,
  minecraft: MINECRAFT_SKIN,
  skyrim: SKYRIM_SKIN,
  morrowind: MORROWIND_SKIN,
} satisfies Record<string, SkinManifest>;

export type SkinId = keyof typeof SKINS;

export const DEFAULT_SKIN_ID: SkinId = 'gta';

export function getSkin(id: SkinId): SkinManifest {
  const skin = SKINS[id];
  if (!skin) throw new Error(`Unknown skin id: ${id}`);
  return skin;
}

export function listSkins(): SkinManifest[] {
  return Object.values(SKINS);
}
```

- [ ] **Step 5: Run test → PASS** — `npm test -- skinRegistry.test` (6 tests). Paste output.
- [ ] **Step 6: Commit** — `Add:` prefix; stage the 6 files by explicit path; push.

---

## Task 3: Slot resolver

**Files:** Create `src/theme/slotResolver.ts`. Test: `src/theme/__tests__/slotResolver.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { resolveSlot } from '@/theme/slotResolver';
import { getSkin } from '@/theme/skinRegistry';

test('a non-overridden slot resolves to token config', () => {
  const r = resolveSlot(getSkin('gta'), 'TurnCard');
  expect(r.kind).toBe('tokens');
  if (r.kind === 'tokens') expect(r.tokens.turnCard.layout).toBe('card');
});

test('an overridden slot resolves to an override marker', () => {
  const r = resolveSlot(getSkin('pipboy'), 'MapFrame');
  expect(r.kind).toBe('override');
  if (r.kind === 'override') expect(r.slot).toBe('MapFrame');
});

test('gta overrides nothing — all slots are token-driven', () => {
  const gta = getSkin('gta');
  for (const slot of ['MapFrame', 'PlayerMarker', 'TurnCard'] as const) {
    expect(resolveSlot(gta, slot).kind).toBe('tokens');
  }
});
```

- [ ] **Step 2: Run test → FAIL** — `npm test -- slotResolver.test`.

- [ ] **Step 3: Implement `src/theme/slotResolver.ts`**

```ts
import { HudSlot, SkinManifest, SlotResolution } from './skinTypes';

export function resolveSlot(skin: SkinManifest, slot: HudSlot): SlotResolution {
  if (skin.overrideSlots.includes(slot)) return { kind: 'override', slot };
  return { kind: 'tokens', tokens: skin.tokens };
}
```

- [ ] **Step 4: Run test → PASS** — 3 tests. Paste output.
- [ ] **Step 5: Commit** — `Add:` prefix; explicit paths; push.

---

## Task 4: Manifest validation

**Files:** Create `src/theme/validateManifest.ts`. Test: `src/theme/__tests__/validateManifest.test.ts`.

`validateManifest` returns a list of problem strings (empty = valid): all palette keys are non-empty hex, `borderWidth`/`cornerRadius` are non-negative, `mapStyleRef`/`name`/`id` non-empty, and every `overrideSlots` entry is a real HUD slot.

- [ ] **Step 1: Write the failing test**

```ts
import { validateManifest } from '@/theme/validateManifest';
import { listSkins } from '@/theme/skinRegistry';
import { SkinManifest } from '@/theme/skinTypes';

test('all shipped skins are valid', () => {
  for (const skin of listSkins()) {
    expect(validateManifest(skin)).toEqual([]);
  }
});

test('flags a bad hex color and a bad slot', () => {
  const bad = {
    id: 'x', name: 'X', mapStyleRef: 'x',
    tokens: {
      palette: { background: 'nope', surface: '#fff', routeLine: '#fff', routeCasing: '#fff',
        text: '#fff', textMuted: '#fff', accent: '#fff', danger: '#fff' },
      typography: { fontFamily: 'f', headingWeight: 700, bodyWeight: 400, letterSpacing: 0 },
      frame: { shape: 'rect', borderColor: '#000', borderWidth: -1, glow: false, cornerRadius: 0 },
      markers: { player: 'a', waypoint: 'b', quest: 'c', destination: 'd' },
      turnCard: { layout: 'card', iconSet: 'i' },
    },
    overrideSlots: ['NotASlot'],
  } as unknown as SkinManifest;
  const problems = validateManifest(bad);
  expect(problems.some(p => p.includes('background'))).toBe(true);
  expect(problems.some(p => p.includes('borderWidth'))).toBe(true);
  expect(problems.some(p => p.includes('NotASlot'))).toBe(true);
});
```

- [ ] **Step 2: Run test → FAIL** — `npm test -- validateManifest.test`.

- [ ] **Step 3: Implement `src/theme/validateManifest.ts`**

```ts
import { HUD_SLOTS, PaletteTokens, SkinManifest } from './skinTypes';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validateManifest(m: SkinManifest): string[] {
  const problems: string[] = [];
  if (!m.id) problems.push('id is empty');
  if (!m.name) problems.push('name is empty');
  if (!m.mapStyleRef) problems.push('mapStyleRef is empty');

  const palette = m.tokens?.palette ?? ({} as PaletteTokens);
  (Object.keys(palette) as (keyof PaletteTokens)[]).forEach((k) => {
    if (!HEX.test(palette[k])) problems.push(`palette.${String(k)} is not a hex color: ${palette[k]}`);
  });

  if (m.tokens?.frame) {
    if (m.tokens.frame.borderWidth < 0) problems.push('frame.borderWidth is negative');
    if (m.tokens.frame.cornerRadius < 0) problems.push('frame.cornerRadius is negative');
  }

  (m.overrideSlots ?? []).forEach((slot) => {
    if (!HUD_SLOTS.includes(slot)) problems.push(`overrideSlots contains unknown slot: ${slot}`);
  });

  return problems;
}
```

- [ ] **Step 4: Run test → PASS** — 2 tests. Paste output.
- [ ] **Step 5: Commit** — `Add:` prefix; explicit paths; push.

---

## Task 5: Wire the registry's SkinId into the nav store

**Files:** Modify `src/state/navStore.ts`. Test: modify `src/state/__tests__/navStore.test.ts`.

Replace the placeholder `SkinId` union with the registry's derived `SkinId`, default to `DEFAULT_SKIN_ID`, and guard `setActiveSkin` so an unknown id is ignored (keeps state valid).

- [ ] **Step 1: Update the store test** — replace the existing `navStore.test.ts` contents with:

```ts
import { useNavStore } from '@/state/navStore';
import { beginNav } from '@/nav/navSession';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

beforeEach(() => useNavStore.getState().reset());

test('store starts idle with the default skin', () => {
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

test('setActiveSkin changes to a known skin without touching nav', () => {
  useNavStore.getState().setNavState(beginNav(FIXTURE_ROUTE));
  useNavStore.getState().setActiveSkin('pipboy');
  const s = useNavStore.getState();
  expect(s.activeSkinId).toBe('pipboy');
  expect(s.nav.status).toBe('navigating');
});

test('setActiveSkin ignores an unknown skin id', () => {
  // @ts-expect-error unknown id
  useNavStore.getState().setActiveSkin('halo');
  expect(useNavStore.getState().activeSkinId).toBe('gta');
});
```

- [ ] **Step 2: Run test → FAIL** — `npm test -- navStore.test` (the unknown-id test fails; store currently accepts any string).

- [ ] **Step 3: Update `src/state/navStore.ts`** — replace the placeholder `SkinId` block and `setActiveSkin`:

Replace:
```ts
// Skin ids are declared here as a string union placeholder; Plan 2 replaces
// this with the SkinManifest registry's id type.
export type SkinId = 'gta' | 'pipboy' | 'minecraft' | 'skyrim' | 'morrowind';
```
with:
```ts
import { SkinId, DEFAULT_SKIN_ID, SKINS } from '@/theme/skinRegistry';
export type { SkinId };
```

Change the initial `activeSkinId: 'gta'` (both in the store body and in `reset`) to `activeSkinId: DEFAULT_SKIN_ID`, and replace `setActiveSkin`:
```ts
  setActiveSkin: (activeSkinId) => {
    if (SKINS[activeSkinId]) set({ activeSkinId });
  },
```

Keep everything else unchanged. (Note: the `import { create }` line and other imports stay; add the new import at the top with the others.)

- [ ] **Step 4: Run test → PASS** — `npm test -- navStore.test` (5 tests). Paste output.
- [ ] **Step 5: Full suite + typecheck** — `npm test` then `npm run typecheck` (PowerShell). Expected: all pass, no type errors. Paste summary lines.
- [ ] **Step 6: Commit** — `Update:` prefix (modifying existing file); explicit paths; push.

---

## Self-Review (completed by plan author)

**Spec coverage (Plan 2 slice):** Theme engine approach #3 (§6) → Tasks 1–4 (tokens + overrideSlots + resolver). Five skins v1 (§4) → Task 2. Switcher wiring (§6) → Task 5 (`setActiveSkin` guarded). Runtime switch leaves `NavState` untouched → asserted in Task 5. Map restyle per skin (§6) represented by `mapStyleRef` (resolved to a real Mapbox style in Plan 3, as designed). No token, no React — matches build-first ordering.

**Placeholder scan:** No TBD/TODO. `mapStyleRef`, `fontFamily`, `iconSet`, marker/sfx ids are intentional string references resolved to assets in Plan 3 — documented, not placeholders-in-disguise.

**Type consistency:** `HudSlot`/`HUD_SLOTS` defined once (Task 1), used by resolver (Task 3) and validator (Task 4). `SkinManifest`/`SkinTokens` defined once, used by all manifests. `SkinId` derived in the registry (Task 2) and re-exported through the store (Task 5), removing the Plan 1 placeholder union.

---

## Next

Plan 3: Mapbox wiring — `MapboxDirectionsProvider` (implements `DirectionsProvider`), map style resolution from `mapStyleRef`, phone HUD slot components (token defaults + the declared overrides), and the switcher UI. First milestone that consumes the Mapbox tokens; token-setup instructions delivered at its start.
