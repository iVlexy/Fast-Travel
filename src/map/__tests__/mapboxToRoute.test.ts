import { mapboxToRoute } from '@/map/mapboxDirections';
import { MAPBOX_SAMPLE } from '@/map/__fixtures__/mapboxResponse';

test('maps a Mapbox response to our Route shape', () => {
  const route = mapboxToRoute(MAPBOX_SAMPLE);
  expect(route.distance).toBeCloseTo(1408.2, 1);
  expect(route.duration).toBeCloseTo(210.5, 1);
  expect(route.geometry).toHaveLength(3);
  expect(route.geometry[0]).toEqual({ lat: 40.0, lng: -75.0 });
  expect(route.steps).toHaveLength(3);
});

test('converts [lng,lat] pairs to {lat,lng} and lifts maneuver fields', () => {
  const route = mapboxToRoute(MAPBOX_SAMPLE);
  const turn = route.steps[1];
  expect(turn.maneuver.instruction).toBe('Turn right');
  expect(turn.maneuver.modifier).toBe('right');
  expect(turn.maneuver.location).toEqual({ lat: 40.0, lng: -75.01 });
  expect(turn.geometry[0]).toEqual({ lat: 40.0, lng: -75.01 });
});

test('throws when the response has no route', () => {
  expect(() => mapboxToRoute({ code: 'Ok', routes: [] })).toThrow();
});
