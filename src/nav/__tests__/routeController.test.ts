import { RouteController } from '@/nav/routeController';
import { MockDirectionsProvider } from '@/nav/directions';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';

test('RouteController.start fetches a route and returns navigating state', async () => {
  const controller = new RouteController(new MockDirectionsProvider(FIXTURE_ROUTE));
  const state = await controller.start(
    { lat: 40.0, lng: -75.0 },
    { lat: 40.005, lng: -75.01 },
  );
  expect(state.status).toBe('navigating');
  expect(state.route).toBe(FIXTURE_ROUTE);
  expect(state.distanceRemaining).toBe(1408);
});
