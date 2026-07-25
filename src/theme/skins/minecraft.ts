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
