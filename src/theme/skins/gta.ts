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
