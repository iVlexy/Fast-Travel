import { MapboxDirectionsProvider } from '@/map/mapboxDirections';
import { MAPBOX_SAMPLE } from '@/map/__fixtures__/mapboxResponse';

function fakeFetch(captured: { url?: string }) {
  return async (url: string) => {
    captured.url = url;
    return { ok: true, json: async () => MAPBOX_SAMPLE } as Response;
  };
}

test('builds a driving directions URL with coords and token, returns a Route', async () => {
  const cap: { url?: string } = {};
  const provider = new MapboxDirectionsProvider('pk.test', 'driving', fakeFetch(cap) as unknown as typeof fetch);
  const route = await provider.getRoute({ lat: 40.0, lng: -75.0 }, { lat: 40.005, lng: -75.01 });

  expect(cap.url).toContain('/directions/v5/mapbox/driving/');
  expect(cap.url).toContain('-75,40;-75.01,40.005');   // lng,lat;lng,lat
  expect(cap.url).toContain('access_token=pk.test');
  expect(cap.url).toContain('geometries=geojson');
  expect(route.distance).toBeCloseTo(1408.2, 1);
  expect(route.steps).toHaveLength(3);
});

test('throws on a non-ok HTTP response', async () => {
  const badFetch = (async () => ({ ok: false, status: 422, json: async () => ({}) })) as unknown as typeof fetch;
  const provider = new MapboxDirectionsProvider('pk.test', 'driving', badFetch);
  await expect(
    provider.getRoute({ lat: 0, lng: 0 }, { lat: 1, lng: 1 }),
  ).rejects.toThrow(/422/);
});
