import { create } from 'zustand';
import { INITIAL_NAV_STATE, LatLng, NavState } from '@/nav/navTypes';
import { updateNav } from '@/nav/navSession';
import { SkinId, DEFAULT_SKIN_ID, SKINS } from '@/theme/skinRegistry';

export type { SkinId };

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
  activeSkinId: DEFAULT_SKIN_ID,
  setNavState: (nav) => set({ nav }),
  applyPosition: (position, speed) =>
    set({ nav: updateNav(get().nav, position, speed) }),
  setActiveSkin: (activeSkinId) => {
    if (SKINS[activeSkinId]) set({ activeSkinId });
  },
  reset: () => set({ nav: INITIAL_NAV_STATE, activeSkinId: DEFAULT_SKIN_ID }),
}));
