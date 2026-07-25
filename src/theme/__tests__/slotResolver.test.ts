import { resolveSlot } from '@/theme/slotResolver';
import { getSkin } from '@/theme/skinRegistry';

test('a non-overridden slot resolves to token config', () => {
  const r = resolveSlot(getSkin('gta'), 'TurnCard');
  expect(r.kind).toBe('tokens');
  if (r.kind === 'tokens') expect(r.tokens.turnCard.layout).toBe('card');
});

test('an overridden slot resolves to an override marker', () => {
  const r = resolveSlot(getSkin('pipboy'), 'MapFrame');
  expect(r.kind).toBe('override');
  if (r.kind === 'override') expect(r.slot).toBe('MapFrame');
});

test('gta overrides nothing — all slots are token-driven', () => {
  const gta = getSkin('gta');
  for (const slot of ['MapFrame', 'PlayerMarker', 'TurnCard'] as const) {
    expect(resolveSlot(gta, slot).kind).toBe('tokens');
  }
});
