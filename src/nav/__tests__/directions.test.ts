import { MockDirectionsProvider } from '@/nav/directions';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

test('MockDirectionsProvider returns the configured route', async () => {
  const provider = new MockDirectionsProvider(FIXTURE_ROUTE);
  const route = await provider.getRoute(
    { lat: 40.0, lng: -75.0 },
    { lat: 40.005, lng: -75.01 },
  );
  expect(route.steps).toHaveLength(3);
  expect(route.distance).toBe(1704);
});
