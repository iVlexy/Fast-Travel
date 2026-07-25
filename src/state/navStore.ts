import { create } from 'zustand';
import { INITIAL_NAV_STATE, LatLng, NavState } from '@/nav/navTypes';
import { updateNav } from '@/nav/navSession';

// Skin ids are declared here as a string union placeholder; Plan 2 replaces
// this with the SkinManifest registry's id type.
export type SkinId = 'gta' | 'pipboy' | 'minecraft' | 'skyrim' | 'morrowind';

type NavStore = {
  nav: NavState;
  activeSkinId: SkinId;
  setNavState: (nav: NavState) => void;
  applyPosition: (position: LatLng, speed: number) => void;
  setActiveSkin: (id: SkinId) => void;
  reset: () => void;
};

export const useNavStore = create<NavStore>((set, get) => ({
  nav: INITIAL_NAV_STATE,
  activeSkinId: 'gta',
  setNavState: (nav) => set({ nav }),
  applyPosition: (position, speed) =>
    set({ nav: updateNav(get().nav, position, speed) }),
  setActiveSkin: (activeSkinId) => set({ activeSkinId }),
  reset: () => set({ nav: INITIAL_NAV_STATE, activeSkinId: 'gta' }),
}));
