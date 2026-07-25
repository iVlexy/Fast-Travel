# Mapbox Token Setup — Fast Travel

Two tokens are already saved locally in `.env.local` (git-ignored, never committed):

| Var | Token | Used |
|---|---|---|
| `MAPBOX_PUBLIC_TOKEN` | `pk.…` | Runtime — map render + Directions API. Ships in the app. |
| `MAPBOX_DOWNLOAD_TOKEN` | `sk.…` | Build time only — download the native SDK. Never ships. |

> **Security:** the `sk.` token is a secret. It goes only in the machine-level locations below — never in the repo, app bundle, or a committed file. Both tokens were shared in chat; **rotate the `sk.` token** in the Mapbox dashboard once native setup is verified.

## 1. Public token — runtime (used in Plan 3 code, testable now)

Exposed to the JS via Expo. Add to `app.json` → `expo.extra` (read by `src/config/mapbox.ts`):

```jsonc
"extra": { "mapboxPublicToken": "pk...." }   // or inject from env in CI
```

For Jest/Node, the same token is read from `process.env.MAPBOX_PUBLIC_TOKEN` (set from `.env.local`). Tests mock `fetch`, so no live token is needed for the suite to pass.

**Restrict it** in the Mapbox dashboard → token → URL restrictions: allow only bundle ids `cloud.browning.fasttravel`.

## 2. Secret download token — build time (needed only at native build, Plan 4)

**iOS (CocoaPods)** — add to `~/.netrc`:
```
machine api.mapbox.com
login mapbox
password sk.eyJ1Ijoi...   # the MAPBOX_DOWNLOAD_TOKEN
```

**Android (Gradle)** — add to `~/.gradle/gradle.properties`:
```
MAPBOX_DOWNLOADS_TOKEN=sk.eyJ1Ijoi...
```

These are read by `@rnmapbox/maps` during `expo prebuild` / native compile. They are per-machine, not per-repo.

## 3. Verify

- **Now (Plan 3):** `npm test` passes with mocked fetch; `getMapboxToken()` returns the `pk.` token when `MAPBOX_PUBLIC_TOKEN` is set.
- **Plan 4 (device):** after `expo prebuild`, a dev build renders a live map. If the map is blank, the `pk.` token/restriction is wrong; if the native build fails to fetch the SDK, the `sk.` token in `.netrc`/`gradle.properties` is wrong.
