# Gymli E2E Smoke Test Suite — Design

**Date:** 2026-06-22
**Status:** Approved (brainstorming)
**Author:** Jason + Claude

## Goal

Stand up an end-to-end regression smoke suite for the Expo (React Native) app so critical user paths can be re-verified after each major piece of work, on **both** the web export and the native Android build. A primary motivation is surfacing **web-vs-native divergence** (UI that works on web but is broken/funky on Android).

## Scope

**In scope:** 4 asserted critical-path flows + a shared login precondition, mirrored across two suites (Playwright web, Maestro Android), run locally on demand against the existing dev backend, each test self-contained (creates and cleans up its own data). A foundation `testID` pass on the elements those flows touch.

**Out of scope (this build):**
- Sign-in, sign-out, and onboarding as *asserted* flows — tested manually by the user. (Login still exists as a non-asserted precondition helper.)
- CI wiring — structure is CI-ready, but no GitHub Actions / EAS Workflows in this build.
- Full-inventory coverage (history pagination, all progress tabs, chat, rest timer, theme, edit/delete routine) — deferred; suite is designed to grow.
- Mocking / seeded test backend / emulator backend — real dev backend only.
- iOS.

## Decisions (locked in brainstorming)

| Decision | Choice |
|---|---|
| Tooling | **Maestro** (Android native, YAML) + **Playwright** (web export, TS) — two mirrored suites |
| Backend | Existing **dev** Cloud Run + dev Firestore; no new infra |
| Auth | Dedicated **email/password** test user (no Google); creds from gitignored `.env.e2e` |
| Test data | Each test creates uniquely-suffixed entities and cleans up after itself via authenticated API |
| Coverage | Critical-path **smoke** (4 asserted flows), designed to grow |
| Execution | Local **on-demand** npm scripts; CI-ready structure, CI wiring deferred |
| AI flows | Assert on resulting **app state**, never exact AI reply wording |

## Architecture

Both suites live under the app they test and share one selector vocabulary.

```
apps/mobile/
├── e2e/
│   ├── playwright/
│   │   ├── playwright.config.ts   # webServer builds+serves web export; chromium
│   │   ├── fixtures/              # auth (login helper), test-data create/cleanup
│   │   └── flows/                 # *.spec.ts — one per asserted flow
│   ├── maestro/
│   │   ├── config.yaml            # appId (com.getgymli.dev), flow includes
│   │   ├── flows/                 # *.yaml — mirrors playwright/flows
│   │   └── helpers/               # login subflow, cleanup subflow
│   └── README.md                  # emulator setup, env, how to run
└── lib/test-ids.ts                # SHARED testID registry (single source of truth)
```

**Mirroring principle:** the two suites express the *same* logical flows with the *same* selector IDs — Playwright in TS, Maestro in YAML. A flow that passes on one platform and fails on the other directly exposes a web-vs-native divergence.

## Component 1 — Selector layer (`lib/test-ids.ts`)

The app currently lacks stable selectors. This is the foundation everything else depends on.

- One canonical constant per interactive element (e.g. `SAVE_ROUTINE_BTN`, `SET_ROW_WEIGHT`, `LOGIN_EMAIL`).
- Apply `testID={TestIds.X}` to **only** the elements the asserted flows + login helper touch (~35–45 elements), not the whole app.
- React Native forwards `testID` → `data-testid` (web DOM) and the native accessibility id (Android). **One prop, both platforms, identical string.**
- Playwright selects via `getByTestId(...)`; Maestro selects via `id:`. Both reference the same constant value.

**Source impact:** adds `testID` props to existing components — no behavior change.

## Component 2 — Auth precondition (login helper)

Every asserted flow requires an authenticated session. Login is a **reusable precondition helper**, not an asserted test.

- **Maestro:** `helpers/login.yaml` subflow drives the real login UI with `${E2E_TEST_EMAIL}` / `${E2E_TEST_PASSWORD}`, invoked at the start of each flow.
- **Playwright:** an auth fixture drives the login UI with the same env creds. Optionally cache via `storageState` if Firebase web persistence cooperates; default to UI login per test for robustness. (Implementation detail — left to the plan.)
- Test user is a **permanently-onboarded** dev account, so flows skip onboarding entirely.
- Creds live in a gitignored `apps/mobile/e2e/.env.e2e` (`E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`). A `.env.e2e.example` is committed.

## Component 3 — Asserted flows

| # | Flow | Screen(s) | Core assertions (state, not AI text) | API touched |
|---|---|---|---|---|
| 3 | Create routine | Log → RoutineEditor → ExercisePicker | Routine appears in Log list with correct name + exercise count | `createRoutine`, `searchExercises` |
| 4 | Guided session + log sets | session.tsx | Enter weight/reps → mark set complete → finish → summary shows volume + set count | `getPreviousPerformance`, `logWorkout` |
| 5 | Conversational log | session.tsx (LogInput/LogFeed) | Type `"bench 225 5,5,4"` → a set row shows weight=225 and reps 5/5/4; AI reply wording ignored | `parseLog` |
| 6 | View progress | (tabs)/progress.tsx | Overview: streak + week stats render. Strength tab: select exercise → chart renders | `getStreakData`, `getVolumeStats`, `getLoggedExercises`, `getExerciseProgress` |
| 7 | Edit profile | (tabs)/profile.tsx | Change display name → debounced "Saved" indicator appears (no sign-out) | `updateProfile` |

Each flow: login (helper) → set up its own data → exercise the flow → assert state → tear down its own data.

## Data flow & test-data lifecycle

1. **Setup:** authenticate (helper). For flows needing pre-existing data, create it via authenticated API with a unique suffix (e.g. `E2E Routine <timestamp>`).
2. **Exercise:** drive the UI through the flow.
3. **Assert:** on resulting UI state and/or persisted state.
4. **Teardown:** delete entities the test created via authenticated API — runs even on failure, so the dev DB never accumulates orphans and reruns never collide.

Unique suffixes prevent collisions across reruns and any parallelism.

## Error handling & reliability

- Built-in waits: Playwright web-first auto-retrying assertions; Maestro auto-wait + retry (sub-1% flake target).
- AI flows (4, 5) make **real** Gemini calls — generous timeouts; assert on resulting state only.
- Test-level retry = 1; genuine failures surface rather than being masked.
- Teardown is failure-safe (orphan-free).

## Execution

```bash
npm run e2e:web        # playwright: expo export -p web → serve dist/ → chromium specs (headless)
npm run e2e:android    # maestro: YAML flows vs dev APK (com.getgymli.dev) on emulator/device
npm run e2e            # both
```

- **Playwright** `webServer` config builds + serves the static web export (production-like), then drives Chromium.
- **Maestro** one-time local prerequisite: Android emulator + dev APK installed. Documented in `e2e/README.md`.
- All config env-driven → adding GitHub Actions (web) + EAS Workflows (Android cloud devices) later is zero rework.

## Testing the tests (validation)

- Each flow is validated by running it green on both platforms against the dev backend before being considered done.
- A deliberately broken selector should fail the relevant flow (proves assertions bite).
- Divergence check: confirm the mirrored web + Android flows agree on at least one known-good path.

## Definition of Done

- `lib/test-ids.ts` exists; smoke-flow elements carry `testID`s on both platforms.
- 4 asserted Playwright specs + 4 mirrored Maestro flows + shared login helper, all green locally against dev backend.
- Each test self-cleans; dev DB shows no leftover E2E data after a run.
- `npm run e2e:web`, `e2e:android`, `e2e` work; `e2e/README.md` documents emulator + env setup.
- `.env.e2e.example` committed; real `.env.e2e` gitignored.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| App lacks stable selectors | Foundation `testID` pass before flows (Component 1) |
| Firebase web auth persistence not captured by Playwright `storageState` | Default to UI login per test; storageState only as optimization if it works |
| Gemini cost/latency on every run (flows 4,5) | On-demand suite (not per-commit); state-only assertions; generous timeouts |
| Maestro web mode immaturity | Web handled by Playwright, not Maestro — avoids the immaturity entirely |
| Shared dev-backend data pollution | Unique-suffix entities + failure-safe teardown |
| Android local setup friction | Documented emulator + dev-APK steps in README |

## Future extensions (not this build)

- Grow to full-inventory coverage (history pagination, all progress tabs, chat, rest timer, theme, edit/delete routine).
- CI: GitHub Actions for Playwright web; EAS Workflows for Maestro on cloud devices.
- Visual regression (Playwright screenshots) on web.
- iOS via Maestro once iOS build exists.
