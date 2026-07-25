import { SKINS, getSkin, listSkins, DEFAULT_SKIN_ID } from '@/theme/skinRegistry';
import { HUD_SLOTS } from '@/theme/skinTypes';

test('registry has exactly the five v1 skins', () => {
  expect(listSkins().map(s => s.id).sort()).toEqual(
    ['gta', 'minecraft', 'morrowind', 'pipboy', 'skyrim'],
  );
});

test('every manifest id matches its registry key', () => {
  for (const [key, skin] of Object.entries(SKINS)) {
    expect(skin.id).toBe(key);
  }
});

test('getSkin returns the requested manifest', () => {
  expect(getSkin('gta').name).toBe('GTA');
});

test('getSkin throws on an unknown id', () => {
  // @ts-expect-error unknown id
  expect(() => getSkin('halo')).toThrow();
});

test('default skin exists in the registry', () => {
  expect(SKINS[DEFAULT_SKIN_ID]).toBeDefined();
});

test('overrideSlots only name real HUD slots', () => {
  for (const skin of listSkins()) {
    for (const slot of skin.overrideSlots) {
      expect(HUD_SLOTS).toContain(slot);
    }
  }
});
