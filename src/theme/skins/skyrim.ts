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
