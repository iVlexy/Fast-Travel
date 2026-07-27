import { useRef } from 'react';
import { useNavStore } from '@/state/navStore';
import { beginNav } from '@/nav/navSession';
import { haversine } from '@/nav/geo';
import { FIXTURE_ROUTE } from '@/nav/__fixtures__/route';
import { LatLng } from '@/nav/navTypes';

// Drives the fixture route through the real nav engine on a timer, so the HUD
// animates on-device without needing a live GPS drive. Same engine the tests
// and the web preview use.
export function useSimulatedDrive() {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const setNavState = useNavStore((s) => s.setNavState);
  const applyPosition = useNavStore((s) => s.applyPosition);

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    // Drive whatever route is currently loaded (a real routed destination), or
    // fall back to the demo fixture route if none is set yet.
    const existing = useNavStore.getState().nav.route;
    const route = existing ?? FIXTURE_ROUTE;
    setNavState(beginNav(route));

    const pts = route.geometry;
    const seg: number[] = [];
    const cum = [0];
    for (let i = 0; i < pts.length - 1; i++) {
      const d = haversine(pts[i], pts[i + 1]);
      seg.push(d);
      cum.push(cum[i] + d);
    }
    const total = cum[cum.length - 1];

    let dist = 0;
    const speed = 14; // m/s
    const dt = 0.5; // seconds per tick
    timer.current = setInterval(() => {
      dist += speed * dt;
      if (dist >= total) {
        dist = total;
        if (timer.current) clearInterval(timer.current);
      }
      let i = 0;
      while (i < seg.length - 1 && dist > cum[i + 1]) i++;
      const t = seg[i] === 0 ? 0 : (dist - cum[i]) / seg[i];
      const a = pts[i];
      const b = pts[i + 1] ?? pts[i];
      const pos: LatLng = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
      applyPosition(pos, speed);
    }, dt * 1000);
  };

  return { start };
}
