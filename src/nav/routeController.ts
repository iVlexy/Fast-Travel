import { DirectionsProvider } from './directions';
import { beginNav } from './navSession';
import { LatLng, NavState } from './navTypes';

export class RouteController {
  constructor(private readonly provider: DirectionsProvider) {}

  async start(origin: LatLng, destination: LatLng): Promise<NavState> {
    const route = await this.provider.getRoute(origin, destination);
    return beginNav(route);
  }
}
