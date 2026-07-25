import { Route } from '../navTypes';

// A simple 3-point L-shaped route: head west, then turn to a destination.
export const FIXTURE_ROUTE: Route = {
  distance: 1408,
  duration: 240,
  geometry: [
    { lat: 40.0, lng: -75.0 },
    { lat: 40.0, lng: -75.01 },   // ~852m west
    { lat: 40.005, lng: -75.01 }, // ~556m north
  ],
  steps: [
    {
      maneuver: {
        type: 'depart',
        instruction: 'Head west',
        location: { lat: 40.0, lng: -75.0 },
      },
      distance: 852,
      geometry: [
        { lat: 40.0, lng: -75.0 },
        { lat: 40.0, lng: -75.01 },
      ],
    },
    {
      maneuver: {
        type: 'turn',
        modifier: 'right',
        instruction: 'Turn right',
        location: { lat: 40.0, lng: -75.01 },
      },
      distance: 556,
      geometry: [
        { lat: 40.0, lng: -75.01 },
        { lat: 40.005, lng: -75.01 },
      ],
    },
    {
      maneuver: {
        type: 'arrive',
        instruction: 'You have arrived',
        location: { lat: 40.005, lng: -75.01 },
      },
      distance: 0,
      geometry: [{ lat: 40.005, lng: -75.01 }],
    },
  ],
};
