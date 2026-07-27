import { SkinManifest } from '@/theme/skinTypes';
import { patternsFor } from '@/map/skinTextures';

// Per-skin MAP palette (colors the actual map tiles, distinct from HUD tokens).
// This is what makes the map itself look like each game's map/minimap. These are
// tuned starting points; a Mapbox Studio style can replace them later by swapping
// buildSkinStyle for a styleURL — MapScreen would change one prop.
export type MapColors = {
  background: string;
  land: string;
  water: string;
  road: string;
  roadMajor: string;
  building: string;
};

const MAP_PALETTES: Record<string, MapColors> = {
  gta: { background: '#0b0f14', land: '#12181f', water: '#0a2a3a', road: '#3a4450', roadMajor: '#5a6472', building: '#1a2430' },
  pipboy: { background: '#03140a', land: '#04250f', water: '#021d0c', road: '#1f7a44', roadMajor: '#3cff7a', building: '#063318' },
  minecraft: { background: '#5b8a3c', land: '#6b9a4c', water: '#3a6bb0', road: '#8a7a55', roadMajor: '#a08b5f', building: '#7a6a45' },
  skyrim: { background: '#0d1519', land: '#20303a', water: '#12242c', road: '#4a5a66', roadMajor: '#cddce6', building: '#2a3a44' },
  morrowind: { background: '#cdb37a', land: '#d8c48c', water: '#9fb08a', road: '#7a6338', roadMajor: '#5a3d17', building: '#b09b6a' },
};

const DEFAULT_MAP: MapColors = MAP_PALETTES.gta;

export function mapColorsFor(skinId: string): MapColors {
  return MAP_PALETTES[skinId] ?? DEFAULT_MAP;
}

// A minimal-but-real Mapbox GL style JSON over the Mapbox Streets v8 vector source,
// recolored per skin. Labels are intentionally omitted for a clean minimap look
// (also avoids needing a glyphs endpoint). Returns a plain object; MapScreen
// JSON.stringifies it into the MapView's styleJSON prop.
export function buildSkinStyle(skin: SkinManifest): Record<string, unknown> {
  const c = mapColorsFor(skin.id);
  const pat = patternsFor(skin.id);

  const bgPaint: Record<string, unknown> = { 'background-color': c.background };
  if (pat.bg) bgPaint['background-pattern'] = pat.bg;

  const landPaint: Record<string, unknown> = { 'fill-color': c.land, 'fill-opacity': 0.55 };
  if (pat.landuse) {
    landPaint['fill-pattern'] = pat.landuse;
    landPaint['fill-opacity'] = 1;
  }

  const waterPaint: Record<string, unknown> = { 'fill-color': c.water };
  if (pat.water) waterPaint['fill-pattern'] = pat.water;

  const buildingPaint: Record<string, unknown> = { 'fill-color': c.building, 'fill-opacity': 0.7 };
  if (pat.building) {
    buildingPaint['fill-pattern'] = pat.building;
    buildingPaint['fill-opacity'] = 1;
  }

  return {
    version: 8,
    name: `fast-travel-${skin.id}`,
    sources: {
      composite: { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' },
    },
    layers: [
      { id: 'bg', type: 'background', paint: bgPaint },
      {
        id: 'landuse',
        type: 'fill',
        source: 'composite',
        'source-layer': 'landuse',
        paint: landPaint,
      },
      {
        id: 'water',
        type: 'fill',
        source: 'composite',
        'source-layer': 'water',
        paint: waterPaint,
      },
      {
        id: 'buildings',
        type: 'fill',
        source: 'composite',
        'source-layer': 'building',
        minzoom: 14,
        paint: buildingPaint,
      },
      {
        id: 'roads',
        type: 'line',
        source: 'composite',
        'source-layer': 'road',
        paint: {
          'line-color': c.road,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 6, 20, 18],
        },
      },
      {
        id: 'roads-major',
        type: 'line',
        source: 'composite',
        'source-layer': 'road',
        filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
        paint: {
          'line-color': c.roadMajor,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 16, 10, 20, 28],
        },
      },
    ],
  };
}
