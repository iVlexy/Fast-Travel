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
