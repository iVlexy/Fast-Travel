import { LatLng, Route } from './navTypes';

export interface DirectionsProvider {
  getRoute(origin: LatLng, destination: LatLng): Promise<Route>;
}

// Test/dev double. Plan 3 adds MapboxDirectionsProvider implementing the same interface.
export class MockDirectionsProvider implements DirectionsProvider {
  constructor(private readonly route: Route) {}
  async getRoute(_origin: LatLng, _destination: LatLng): Promise<Route> {
    return this.route;
  }
}
