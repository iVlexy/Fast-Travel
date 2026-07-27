import { useCallback } from 'react';
import Constants from 'expo-constants';
import { MapboxDirectionsProvider } from '@/map/mapboxDirections';
import { RouteController } from '@/nav/routeController';
import { useNavStore } from '@/state/navStore';
import { LatLng } from '@/nav/navTypes';

const token = (Constants.expoConfig?.extra as { mapboxPublicToken?: string } | undefined)?.mapboxPublicToken ?? '';

// Requests a real Mapbox driving route from the current position to `dest`
// and loads it into the engine. Long-press the map to call this.
export function useRouting() {
  const setNavState = useNavStore((s) => s.setNavState);

  const setDestination = useCallback(
    async (dest: LatLng) => {
      const origin = useNavStore.getState().nav.position ?? { lat: 40.0, lng: -75.0 };
      try {
        const controller = new RouteController(new MapboxDirectionsProvider(token));
        const state = await controller.start(origin, dest);
        setNavState(state);
      } catch (e) {
        console.warn('[FT] routing failed', e);
      }
    },
    [setNavState],
  );

  return { setDestination };
}
