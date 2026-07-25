import { HudSlot, SkinManifest, SlotResolution } from './skinTypes';

export function resolveSlot(skin: SkinManifest, slot: HudSlot): SlotResolution {
  if (skin.overrideSlots.includes(slot)) return { kind: 'override', slot };
  return { kind: 'tokens', tokens: skin.tokens };
}
