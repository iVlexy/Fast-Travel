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
