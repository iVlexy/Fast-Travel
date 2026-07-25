// Trimmed but shape-accurate Mapbox Directions v5 response (geometries=geojson, steps=true).
export const MAPBOX_SAMPLE = {
  code: 'Ok',
  routes: [
    {
      distance: 1408.2,
      duration: 210.5,
      geometry: {
        type: 'LineString',
        coordinates: [
          [-75.0, 40.0],
          [-75.01, 40.0],
          [-75.01, 40.005],
        ],
      },
      legs: [
        {
          steps: [
            {
              distance: 852.0,
              duration: 120.0,
              geometry: { type: 'LineString', coordinates: [[-75.0, 40.0], [-75.01, 40.0]] },
              maneuver: { type: 'depart', instruction: 'Head west', location: [-75.0, 40.0] },
            },
            {
              distance: 556.2,
              duration: 90.5,
              geometry: { type: 'LineString', coordinates: [[-75.01, 40.0], [-75.01, 40.005]] },
              maneuver: { type: 'turn', modifier: 'right', instruction: 'Turn right', location: [-75.01, 40.0] },
            },
            {
              distance: 0,
              duration: 0,
              geometry: { type: 'LineString', coordinates: [[-75.01, 40.005]] },
              maneuver: { type: 'arrive', instruction: 'You have arrived', location: [-75.01, 40.005] },
            },
          ],
        },
      ],
    },
  ],
};
