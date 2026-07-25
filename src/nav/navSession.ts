import { NavState, Route, LatLng } from './navTypes';
import { haversine, distanceToPolyline } from './geo';

const OFF_ROUTE_M = 40;
const ARRIVE_M = 25;
const ADVANCE_M = 30; // within this distance of a maneuver, consider it passed
const FALLBACK_SPEED = 13.4; // m/s (~30mph) used for ETA when stationary

export function beginNav(route: Route): NavState {
  return {
    status: 'navigating',
    route,
    currentStepIndex: 0,
    distanceToNextTurn: route.steps[0]?.distance ?? 0,
    distanceRemaining: route.distance,
    etaSeconds: route.duration,
    position: null,
    speed: 0,
  };
}

// Meters from `pos` to the maneuver point of a given step.
function distanceToManeuver(pos: LatLng, route: Route, stepIndex: number): number {
  const step = route.steps[stepIndex];
  if (!step) return 0;
  return haversine(pos, step.maneuver.location);
}

// Sum of remaining step distances from the current step onward.
function remainingFromStep(route: Route, stepIndex: number): number {
  return route.steps
    .slice(stepIndex)
    .reduce((sum, s) => sum + s.distance, 0);
}

export function updateNav(prev: NavState, position: LatLng, speed: number): NavState {
  const route = prev.route;
  if (!route) return { ...prev, position, speed };
  // Fix 3: guard degenerate routes so we never dereference an undefined point.
  if (route.geometry.length === 0 || route.steps.length === 0) {
    return { ...prev, position, speed };
  }

  const destination = route.geometry[route.geometry.length - 1];
  const distToDest = haversine(position, destination);
  if (distToDest <= ARRIVE_M) {
    return {
      ...prev,
      status: 'arrived',
      position,
      speed,
      distanceToNextTurn: 0,
      distanceRemaining: distToDest,
      etaSeconds: 0,
    };
  }

  const offBy = distanceToPolyline(position, route.geometry);
  if (offBy > OFF_ROUTE_M) {
    return { ...prev, status: 'off-route', position, speed };
  }

  // Advance the step once we're within ADVANCE_M of the NEXT maneuver point
  // (currentStepIndex = the step being driven; the next turn is stepIndex+1).
  let stepIndex = prev.currentStepIndex;
  const lastStepIndex = route.steps.length - 1;
  while (
    stepIndex < lastStepIndex &&
    distanceToManeuver(position, route, stepIndex + 1) <= ADVANCE_M
  ) {
    stepIndex++;
  }

  // Fix 2: on the final step there is no "next maneuver" — measure to the
  // destination itself so remaining/ETA don't collapse to 0 while still navigating.
  const onLastStep = stepIndex >= lastStepIndex;
  const distanceToNextTurn = onLastStep
    ? distToDest
    : distanceToManeuver(position, route, stepIndex + 1);
  const distanceRemaining = onLastStep
    ? distToDest
    : distanceToNextTurn + remainingFromStep(route, stepIndex + 1);
  const effectiveSpeed = speed > 1 ? speed : FALLBACK_SPEED;
  const etaSeconds = Math.round(distanceRemaining / effectiveSpeed);

  return {
    ...prev,
    status: 'navigating',
    position,
    speed,
    currentStepIndex: stepIndex,
    distanceToNextTurn,
    distanceRemaining,
    etaSeconds,
  };
}
