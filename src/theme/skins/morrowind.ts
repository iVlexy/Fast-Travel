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
