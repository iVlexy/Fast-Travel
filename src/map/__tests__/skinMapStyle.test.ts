import { buildSkinStyle, mapColorsFor } from '@/map/skinMapStyle';
import { getSkin, listSkins } from '@/theme/skinRegistry';

type Layer = { id: string; type: string; paint?: Record<string, unknown> };

test('builds a valid GL style (v8, streets source, bg + water + roads) for every skin', () => {
  for (const skin of listSkins()) {
    const style = buildSkinStyle(skin) as { version: number; sources: Record<string, unknown>; layers: Layer[] };
    expect(style.version).toBe(8);
    expect(style.sources.composite).toBeDefined();
    const ids = style.layers.map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(['bg', 'water', 'roads', 'roads-major']));
    const bg = style.layers.find((l) => l.type === 'background');
    expect(bg?.paint?.['background-color']).toBe(mapColorsFor(skin.id).background);
  }
});

test('pip-boy map is the green-phosphor palette', () => {
  const style = buildSkinStyle(getSkin('pipboy')) as { layers: Layer[] };
  const bg = style.layers.find((l) => l.id === 'bg');
  expect(bg?.paint?.['background-color']).toBe('#03140a');
});

test('unknown skin id falls back to a default map palette', () => {
  expect(mapColorsFor('halo')).toEqual(mapColorsFor('gta'));
});
