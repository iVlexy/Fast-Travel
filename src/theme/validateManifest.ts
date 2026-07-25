import { HUD_SLOTS, PaletteTokens, SkinManifest } from './skinTypes';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validateManifest(m: SkinManifest): string[] {
  const problems: string[] = [];
  if (!m.id) problems.push('id is empty');
  if (!m.name) problems.push('name is empty');
  if (!m.mapStyleRef) problems.push('mapStyleRef is empty');

  const palette = m.tokens?.palette ?? ({} as PaletteTokens);
  (Object.keys(palette) as (keyof PaletteTokens)[]).forEach((k) => {
    if (!HEX.test(palette[k])) problems.push(`palette.${String(k)} is not a hex color: ${palette[k]}`);
  });

  if (m.tokens?.frame) {
    if (m.tokens.frame.borderWidth < 0) problems.push('frame.borderWidth is negative');
    if (m.tokens.frame.cornerRadius < 0) problems.push('frame.cornerRadius is negative');
  }

  (m.overrideSlots ?? []).forEach((slot) => {
    if (!HUD_SLOTS.includes(slot)) problems.push(`overrideSlots contains unknown slot: ${slot}`);
  });

  return problems;
}
