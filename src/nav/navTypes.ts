export type LatLng = { lat: number; lng: number };

export type Maneuver = {
  type: string;        // e.g. 'turn', 'depart', 'arrive'
  modifier?: string;   // e.g. 'left', 'right'
  instruction: string; // human-readable, e.g. "Turn left onto Main St"
  location: LatLng;    // where the maneuver happens
};

export type RouteStep = {
  maneuver: Maneuver;
  distance: number;      // meters for this step
  geometry: LatLng[];    // polyline for this step
};

export type Route = {
  steps: RouteStep[];
  geometry: LatLng[];    // full route polyline
  distance: number;      // total meters
  duration: number;      // total seconds (free-flow estimate)
};

export type NavStatus = 'idle' | 'navigating' | 'off-route' | 'arrived';

export type NavState = {
  status: NavStatus;
  route: Route | null;
  currentStepIndex: number;
  distanceToNextTurn: number; // meters to the next maneuver
  distanceRemaining: number;  // meters to destination
  etaSeconds: number;         // estimated seconds remaining
  position: LatLng | null;
  speed: number;              // m/s (from GPS)
};

export const INITIAL_NAV_STATE: NavState = {
  status: 'idle',
  route: null,
  currentStepIndex: 0,
  distanceToNextTurn: 0,
  distanceRemaining: 0,
  etaSeconds: 0,
  position: null,
  speed: 0,
};
