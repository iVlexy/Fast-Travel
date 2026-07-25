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
