import { SkinManifest } from './skinTypes';
import { GTA_SKIN } from './skins/gta';
import { PIPBOY_SKIN } from './skins/pipboy';
import { MINECRAFT_SKIN } from './skins/minecraft';
import { SKYRIM_SKIN } from './skins/skyrim';
import { MORROWIND_SKIN } from './skins/morrowind';

export const SKINS = {
  gta: GTA_SKIN,
  pipboy: PIPBOY_SKIN,
  minecraft: MINECRAFT_SKIN,
  skyrim: SKYRIM_SKIN,
  morrowind: MORROWIND_SKIN,
} satisfies Record<string, SkinManifest>;

export type SkinId = keyof typeof SKINS;

export const DEFAULT_SKIN_ID: SkinId = 'gta';

export function getSkin(id: SkinId): SkinManifest {
  const skin = SKINS[id];
  if (!skin) throw new Error(`Unknown skin id: ${id}`);
  return skin;
}

export function listSkins(): SkinManifest[] {
  return Object.values(SKINS);
}
