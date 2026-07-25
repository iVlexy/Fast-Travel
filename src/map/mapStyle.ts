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
