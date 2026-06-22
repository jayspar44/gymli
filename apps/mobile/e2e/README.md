# Gymli E2E Smoke Suite

Two mirrored suites over the same `testID` registry (`apps/mobile/lib/test-ids.ts`):
**Playwright** (web export, Chromium) and **Maestro** (Android native). They express
the same flows with the same selector IDs so a pass-on-one / fail-on-other directly
exposes web-vs-native divergence.

## Selector rule

Every selector is a constant in `apps/mobile/lib/test-ids.ts`.
- Playwright imports it: `getByTestId(TestIds.X)`.
- Maestro uses the literal string: `id: "x"`. **Keep Maestro strings in sync with the registry.**

## Env

Copy `e2e/.env.e2e.example` → `e2e/.env.e2e` (gitignored) and fill in:
| Var | Meaning |
|---|---|
| `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` | Dedicated, permanently-onboarded dev account (email/password, NOT Google). |
| `EXPO_PUBLIC_API_URL` | Dev Cloud Run API base (`.../api`). |
| `EXPO_PUBLIC_FIREBASE_CONFIG` | Firebase web config JSON; the helper parses out `apiKey` for REST `signInWithPassword`. |

## Test data

Each test creates uniquely-suffixed entities and deletes them in failure-safe teardown
via the authenticated `@gymli/shared` API client. The dev DB stays orphan-free.

## Web (Playwright)

```bash
npm run e2e:web        # builds the web export, serves dist/, runs Chromium specs
npm run e2e:web -- create-routine.spec.ts   # single flow
```
First run is slow (it runs `expo export -p web`). Requires the Chromium binary:
`npx -w apps/mobile playwright install chromium`.

## Android (Maestro)

One-time prerequisites:
1. Install Maestro: https://maestro.mobile.dev (`curl -fsSL "https://get.maestro.mobile.dev" | bash`).
2. Start an Android emulator (or attach a device) with USB debugging.
3. Build + install the **dev** build (appId `com.getgymli.dev`) per the SDK 56 dev-build docs
   (https://docs.expo.dev/versions/v56.0.0/), e.g. `npx expo run:android --variant debug`
   with `APP_VARIANT=development`.

Then:
```bash
npm run e2e:android                          # all flows
maestro test e2e/maestro/flows/smoke.yaml    # single flow (env not needed for smoke)
```

## Run both

```bash
npm run e2e            # web then android
```
