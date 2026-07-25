import { resolveMapStyle } from '@/map/mapStyle';
import { listSkins } from '@/theme/skinRegistry';

test('every shipped skin mapStyleRef resolves to a mapbox style uri', () => {
  for (const skin of listSkins()) {
    const uri = resolveMapStyle(skin.mapStyleRef);
    expect(uri).toMatch(/^mapbox:\/\/styles\//);
  }
});

test('unknown ref falls back to the default style', () => {
  expect(resolveMapStyle('does-not-exist')).toMatch(/^mapbox:\/\/styles\//);
});

test('gta ref maps to a dark base style', () => {
  expect(resolveMapStyle('gta-streets')).toBe('mapbox://styles/mapbox/dark-v11');
});
