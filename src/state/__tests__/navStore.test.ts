import { useNavStore } from '@/state/navStore';
import { beginNav } from '@/nav/navSession';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

beforeEach(() => useNavStore.getState().reset());

test('store starts idle with a default skin', () => {
  const s = useNavStore.getState();
  expect(s.nav.status).toBe('idle');
  expect(s.activeSkinId).toBe('gta');
});

test('setNavState replaces nav state', () => {
  useNavStore.getState().setNavState(beginNav(FIXTURE_ROUTE));
  expect(useNavStore.getState().nav.status).toBe('navigating');
});

test('applyPosition runs updateNav against the active route', () => {
  useNavStore.getState().setNavState(beginNav(FIXTURE_ROUTE));
  useNavStore.getState().applyPosition({ lat: 40.005, lng: -75.01 }, 0);
  expect(useNavStore.getState().nav.status).toBe('arrived');
});

test('setActiveSkin changes the skin without touching nav', () => {
  useNavStore.getState().setNavState(beginNav(FIXTURE_ROUTE));
  useNavStore.getState().setActiveSkin('pipboy');
  const s = useNavStore.getState();
  expect(s.activeSkinId).toBe('pipboy');
  expect(s.nav.status).toBe('navigating');
});
