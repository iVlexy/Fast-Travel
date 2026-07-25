// Token access. In tests/Node, reads from an env record (defaults to process.env).
// At runtime the app passes Expo's `extra.mapboxPublicToken` in as the value.
type Env = Record<string, string | undefined>;

export function getMapboxToken(env: Env = process.env): string {
  const token = env.MAPBOX_PUBLIC_TOKEN;
  if (!token) {
    throw new Error(
      'MAPBOX_PUBLIC_TOKEN is not set. Add it to .env.local (tests) or app.json extra (runtime). See docs/MAPBOX_SETUP.md.',
    );
  }
  return token;
}
