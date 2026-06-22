# Gymli RN + Expo Migration — Phases 3–5 (Road to v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Capacitor/Vite → Expo migration: ship the Expo web export to Firebase Hosting (Phase 3), wire production ops — Sentry + EAS Update — plus polish (Phase 4), then delete the old `frontend/` and update all repo scripts/docs to the Expo monorepo reality (Phase 5).

**Architecture:** Phases 0–2 are DONE — the Expo app (`apps/mobile`) already renders every screen on Android dev builds and on local web. This plan is **config / ops / cleanup work**, not app-feature work. Phase 3 repoints hosting to the Expo static web export and audits web-only layout divergence. Phase 4 adds `@sentry/react-native` and `expo-updates` (both explicit §14 DoD items) plus a tightly-scoped polish pass. Phase 5 removes the dead Vite app and rewrites root tooling/docs. Backend (`backend/`, Cloud Run) is untouched.

**Tech Stack:** Expo SDK 56, Expo Router (static web export), Firebase Hosting, `@sentry/react-native`, `expo-updates` (EAS Update), EAS Build, NativeWind 4, Reanimated 4, `expo-image`.

**Spec:** `docs/superpowers/specs/2026-06-06-react-native-expo-migration-design.md` (this migration design doc IS the design for Phases 3–5; §11 Phased Delivery, §14 Definition of Done).
**Prior plans (completed):** `docs/superpowers/plans/2026-06-06-rn-expo-migration-phase0-1.md`, `docs/superpowers/plans/2026-06-07-rn-expo-migration-phase2.md`.

---

## Global Constraints

- **Expo SDK 56 — read the versioned docs first.** `apps/mobile/AGENTS.md` mandates reading https://docs.expo.dev/versions/v56.0.0/ before writing any code. The current installed SDK is `expo ~56.0.9` (`apps/mobile/package.json`).
- **Install SDK-managed libs with `npx expo install <pkg>`** — never hardcode versions; `expo install` resolves the SDK-56-compatible version. Pin **only** non-SDK libs (e.g. axios, date-fns, firebase). `@sentry/react-native` is installed via `npx expo install` (it ships an Expo config plugin and is SDK-version-gated). `expo-updates` is an SDK-managed Expo module → `npx expo install`.
- **Behavior parity is the bar for Phase 3; ops correctness for Phase 4; no-regression for Phase 5.** Phase 3 web must match Android behavior screen-for-screen with **0 console errors**.
- **iOS is explicitly OUT of scope** for this v1 milestone (spec §2, §14). Do not add iOS build profiles, TestFlight, or `ios` config beyond what already exists.
- **Backend is untouched** except the already-shipped etag fix. **Do NOT delete `backend/`** — it is the Cloud Run service. Phase 5 deletes only `frontend/`.
- **All command working directories are absolute.** Agent shells reset cwd between calls; always `cd /Users/jayspar/Documents/projects/Gymli/...` at the top of each command block.
- **`NODE_ENV=development`** prefix on Expo/npm install/test commands (established convention in prior plans; without it Expo dev tooling and devDependencies are skipped).
- **Do not commit secrets.** Sentry DSN and the EAS project id are non-secret client identifiers and may live in `EXPO_PUBLIC_*` env / `app.config.ts`. The Sentry **auth token** (source-map upload) is secret → EAS secret only, never committed.

---

## Decisions & Assumptions (REVIEW THESE)

These are choices not fully pinned by the spec. Each is stated as an explicit assumption in the task that uses it and is overridable by changing the one named value.

| # | Decision | Value chosen | Override point | Rationale |
|---|---|---|---|---|
| D1 | Web hosting target dir | `apps/mobile/dist` (Expo static export output) | `firebase.json` → `hosting.public` | `app.config.ts` already sets `web.output:'static'`; `npx expo export -p web` writes to `apps/mobile/dist`. |
| D2 | Firebase hosting target structure | Use **named hosting targets**: `firebase.json` `hosting` becomes an **array** of two configs — `target:"dev"` → site `gimli-app-dev`, `target:"prod"` → site `gimli-app` — reconciling `.firebaserc` (which already declares both targets under project `gimli-app`) with `firebase.json` (currently a single unnamed block). Deploy each via `firebase deploy --only hosting:<target>`. | `firebase.json` `hosting[]` + `.firebaserc` `targets` | `.firebaserc` already maps `dev`→`gimli-app-dev` and `prod`→`gimli-app`; named targets give separate dev and prod hosting sites (user decision). Both serve the same `apps/mobile/dist` export; environment differences come from the per-deploy `EXPO_PUBLIC_*` env used at export time. |
| D3 | SPA rewrite for Expo Router | Keep the existing `"**" → "/index.html"` rewrite. | `firebase.json` → `hosting.rewrites` | Expo Router web (even `output:'static'`) needs deep links to resolve client-side; the rewrite is already present and correct. Static export also emits per-route `.html`, so direct hits work; the rewrite is the fallback. |
| D4 | Sentry: adopt? | **Yes** — `@sentry/react-native` via Expo config plugin + `Sentry.wrap` root layout. Explicit §14 DoD item. | Remove Task 4.x if descoped | DoD requires "Sentry configured". |
| D5 | Sentry org/project slugs | org `gymli`, project `gymli-mobile` | EAS secrets `SENTRY_ORG`, `SENTRY_PROJECT`; plugin reads them | Sensible defaults; user creates/renames the project in Sentry and overrides the two values. |
| D6 | Sentry DSN delivery | `EXPO_PUBLIC_SENTRY_DSN` env (non-secret, build-inlined) read in `Sentry.init`. | `apps/mobile/.env*` + EAS env | DSN is a public client identifier (Sentry docs); consistent with existing `EXPO_PUBLIC_*` Firebase config. |
| D7 | Sentry source-map auth token | EAS **secret** `SENTRY_AUTH_TOKEN` (never committed). | `eas env:create` / EAS secret | Auth token is secret; required for the EAS build-time upload. |
| D8 | EAS Update channels | `development` and `production` (match the existing `eas.json` build-profile names exactly) | `eas.json` `channel` per profile | Channel == profile name keeps mental model 1:1; `preview` shares the `production`-style runtime but we map it to `production` channel (internal track). |
| D9 | `runtimeVersion` policy | `appVersion` (every native `version` bump = new runtime; JS-only changes ship via OTA on the same runtime) | `app.config.ts` → `runtimeVersion` | Simplest correct policy for a solo dev; `fingerprint` is more precise but adds CI fingerprinting friction. App is at `version:'0.1.0'`. |
| D10 | EAS Update URL / project id | reuse existing `extra.eas.projectId` `18695339-...`; `updates.url` = `https://u.expo.dev/18695339-fd5b-4c06-9743-d0e59c0ac197` | `app.config.ts` → `updates.url` | Standard EAS Update endpoint for the existing project. |
| D11 | Root `dev:frontend` / `dev:local` | Replace `dev:frontend` with `dev:mobile` (`expo start --web`). Leave `dev:local` / `dev-with-ports.js` (backend dev orchestration) **as-is for now** — it still boots the backend; flag the stale `frontend/.env.local` copy as a known follow-up, do not rewrite the script in this plan. | root `package.json` / `scripts/dev-with-ports.js` | Rewriting the multi-instance dev orchestrator is a separate concern; this plan keeps scope to the migration cleanup. |
| D12 | Android build scripts | **Drop** Capacitor-based `android` / `android:dev` / `android:local` from root scripts; replace with EAS-based `build:android:dev` / `build:android:prod`. | root `package.json` | Capacitor is removed; Android builds now go through EAS (spec §10). |

---

## File Structure (created/modified in this plan)

```
Gymli/
├── firebase.json                      # MODIFY: hosting.public → apps/mobile/dist (Phase 3, Phase 5)
├── package.json                       # MODIFY: rewrite root scripts (Phase 5)
├── CLAUDE.md                          # MODIFY: stack/structure/commands → Expo reality (Phase 5)
├── frontend/                          # DELETE entire dir (Phase 5)
└── apps/mobile/
    ├── app.config.ts                  # MODIFY: add updates + runtimeVersion + sentry plugin (Phase 4)
    ├── app/_layout.tsx                # MODIFY: Sentry.wrap + init (Phase 4)
    ├── .env.example                   # MODIFY: add SENTRY_DSN line (Phase 4)
    ├── package.json                   # MODIFY: deps added by expo install (Phase 4)
    └── (web layout fixes across components/* — Phase 3, per-screen)
```

---

# PHASE 3 — Web (ship Expo web export to Firebase Hosting)

**Outcome (spec §11):** `web.output:'static'` (already set) → static export → Firebase Hosting; web-specific layout passes; auth + all routes render with 0 console errors. **Acceptance bar: behavior parity with Android.**

---

## Task 3.1: Repoint Firebase Hosting at the Expo web export (named dev + prod targets)

**Files:**
- Modify: `/Users/jayspar/Documents/projects/Gymli/firebase.json`

**Interfaces:**
- Produces: a `firebase.json` whose `hosting` is an **array** of two target configs (`dev`→`apps/mobile/dist`, `prod`→`apps/mobile/dist`), each with an SPA rewrite — consumed by Task 3.5 (deploy per target).

**Assumption (D1, D2, D3):** target dir `apps/mobile/dist` for both; named targets `dev` (site `gimli-app-dev`) + `prod` (site `gimli-app`), already declared in `.firebaserc` under project `gimli-app`; keep `"**" → "/index.html"` rewrite. The `target` value in each `firebase.json` entry matches the `.firebaserc` `targets.gimli-app.hosting` keys (`dev`/`prod`).

- [ ] **Step 1: Confirm the `.firebaserc` targets exist (no edit — reference only)**

```bash
cd /Users/jayspar/Documents/projects/Gymli
node -e "const r=require('./.firebaserc'); console.log(JSON.stringify(r.targets['gimli-app'].hosting))"
```
Expected: `{"dev":["gimli-app-dev"],"prod":["gimli-app"]}`. If this prints something else, stop — the target/site names below must be updated to match `.firebaserc` (override point D2). The `firebase.json` `hosting[].target` keys MUST equal these `.firebaserc` keys (`dev`, `prod`).

- [ ] **Step 2: Replace the single `hosting` block with a two-target array**

In `/Users/jayspar/Documents/projects/Gymli/firebase.json`, replace the **entire** `"hosting": { … }` object (currently `public: "frontend/dist"`, lines 2–35) with an array. Before:
```json
  "hosting": {
    "public": "frontend/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  },
```
After (array — `dev` and `prod` entries, identical except `target`; both serve `apps/mobile/dist`; added `/_expo/static/**` immutable cache header for Expo's hashed bundles):
```json
  "hosting": [
    {
      "target": "dev",
      "public": "apps/mobile/dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        { "source": "**", "destination": "/index.html" }
      ],
      "headers": [
        {
          "source": "/assets/**",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
          ]
        },
        {
          "source": "/_expo/static/**",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
          ]
        },
        {
          "source": "**/*.html",
          "headers": [
            { "key": "Cache-Control", "value": "no-cache" }
          ]
        }
      ]
    },
    {
      "target": "prod",
      "public": "apps/mobile/dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        { "source": "**", "destination": "/index.html" }
      ],
      "headers": [
        {
          "source": "/assets/**",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
          ]
        },
        {
          "source": "/_expo/static/**",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
          ]
        },
        {
          "source": "**/*.html",
          "headers": [
            { "key": "Cache-Control", "value": "no-cache" }
          ]
        }
      ]
    }
  ],
```
(Leave the `"firestore": { … }` block that follows unchanged.)

- [ ] **Step 3: Validate JSON + confirm both targets present**

```bash
cd /Users/jayspar/Documents/projects/Gymli
node -e "const c=JSON.parse(require('fs').readFileSync('firebase.json','utf8')); if(!Array.isArray(c.hosting)) throw new Error('hosting must be an array'); console.log('targets:', c.hosting.map(h=>h.target).join(',')); console.log('publics:', [...new Set(c.hosting.map(h=>h.public))].join(','))"
```
Expected: `targets: dev,prod` and `publics: apps/mobile/dist`.

- [ ] **Step 4: Apply the target→site bindings locally** (idempotent; binds the `firebase.json` targets to the `.firebaserc` sites so `--only hosting:<target>` resolves)

```bash
cd /Users/jayspar/Documents/projects/Gymli
npx firebase target:apply hosting dev gimli-app-dev 2>&1 | tail -3
npx firebase target:apply hosting prod gimli-app 2>&1 | tail -3
```
Expected: each prints an "Applied hosting target …" confirmation. (These bindings already exist in `.firebaserc`; re-applying is a no-op that confirms the CLI can resolve them.)

- [ ] **Step 5: Commit**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add firebase.json .firebaserc
git commit -m "chore(web): firebase hosting dev/prod targets → expo web export (apps/mobile/dist)"
```

---

## Task 3.2: Produce a clean static web export

**Files:**
- Build artifact only: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/dist/` (gitignored build output)

**Interfaces:**
- Consumes: `app.config.ts` `web:{ bundler:'metro', output:'static' }` (already set).
- Produces: `apps/mobile/dist/index.html` + `_expo/static/**` — consumed by Tasks 3.3, 3.5.

- [ ] **Step 1: Ensure `dist/` is gitignored** (build output must not be committed)

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
grep -qxF "dist/" .gitignore || printf "\n# Expo web export\ndist/\n" >> .gitignore
grep -n "dist" .gitignore
```
Expected: a line `dist/` is present.

- [ ] **Step 2: Export the web bundle**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo export -p web 2>&1 | tail -20
```
Expected: ends with an "Exported …" success line and writes `apps/mobile/dist/`. If it fails on a native-only import, that's a Phase-3 web-divergence bug → record it for the relevant Task 3.3/3.4 screen fix, then re-run.

- [ ] **Step 3: Verify the export artifacts exist**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
test -f dist/index.html && echo "index.html OK"
ls dist/_expo/static/js/web/ 2>/dev/null | head -3 && echo "js bundle OK"
```
Expected: `index.html OK` and `js bundle OK`.

- [ ] **Step 4: Commit** (only `.gitignore` — no build output)

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add apps/mobile/.gitignore
git commit -m "chore(mobile): gitignore expo web export dir" || echo "nothing to commit"
```

---

## Task 3.3: Web layout audit — known native/web divergence areas

**Files:**
- Modify (as needed): `/Users/jayspar/Documents/projects/Gymli/apps/mobile/components/**` and `app/**` (only the screens/components with web-specific breakage)

**Interfaces:**
- Consumes: the running local web server.
- Produces: web layout fixes verified at desktop + mobile widths.

**Context:** native/web divergence is a known, already-encountered class of bug (recent commits fixed RN-modal bottom sheets dropping gorhom, chat FAB explicit circle dims because NativeWind w/h is unreliable on `position:absolute`, tab/screen safe areas, and an etag backend fix so RN okhttp didn't render empty history). This task re-audits the SAME divergence-prone surfaces on web.

**Known divergence checklist (verify each on web):**

| Surface | Native fix already shipped | Web risk to verify |
|---|---|---|
| Finish-workout dialog / bottom sheets | rebuilt as RN modal (gorhom wedged on native unmount) | RN-modal renders on web; verify it opens/closes, isn't full-screen-stuck, and backdrop dismiss works |
| Chat FAB | explicit `width`/`height` circle on absolute pos | verify circle isn't an oval/clipped at desktop width; verify it floats above content, not under the tab bar |
| Tab bar + screen safe areas | `useSafeAreaInsets` per screen | on web `insets` are 0 — verify no double padding / no content under a (nonexistent) notch; verify tab bar height is sane |
| Session pill strip (set-row controls) | native sizing pass | verify the horizontal pill strip wraps/scrolls and doesn't overflow viewport at desktop width |
| Workout history list (FlashList) | — | FlashList v2 on web must scroll; verify list virtualizes/renders (this was the etag empty-history class of bug) |
| Bottom modals (ExercisePicker, RoutineEditor) | gorhom/RN-modal | verify they present and are dismissible on web |

- [ ] **Step 1: Start the local web server**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo start --web --port 4200
```
Run in background; leave it up for Steps 2–4 and Tasks 3.4/3.5.

- [ ] **Step 2: Audit each surface at DESKTOP width (~1280px)** — open `http://localhost:4200`, sign in, and for EACH row in the checklist above, exercise the interaction and confirm it behaves. For any breakage, fix the responsible component (the source of truth is the component's existing native styling; the web fix is additive — prefer `Platform.OS === 'web'` branches or web-safe units over breaking native). Re-run the surface after each fix.

- [ ] **Step 3: Audit each surface at MOBILE width (~390px)** — resize the browser to a phone width and repeat. Mobile-web is the realistic web user; verify tab bar, FAB, and sheets at narrow width.

- [ ] **Step 4: Typecheck after any edits**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 5: Commit web layout fixes**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add apps/mobile/components apps/mobile/app
git commit -m "fix(web): layout passes for sheets, fab, safe-areas, session strip, lists" || echo "nothing to commit"
```

---

## Task 3.4: Web auth + per-route render verification (0 console errors)

**Files:**
- Modify (only if a route breaks): relevant `apps/mobile/app/**` route file

**Interfaces:**
- Consumes: local web server from Task 3.3 Step 1; `lib/firebase.web.ts` (`getAuth` + `signInWithPopup` web seam, per spec §6).
- Produces: a verified, console-clean web app — gate for Task 3.5 deploy.

**Each route is independently testable:** load it at web width, assert 0 console errors.

- [ ] **Step 1: Verify Google web auth (popup) and email auth**

At `http://localhost:4200/login`: sign in with Google (web uses `signInWithPopup(GoogleAuthProvider)` — spec §6) and confirm redirect to the app (or `/onboarding` if `needsOnboarding`). Sign out, then sign in with email/password. Confirm the Firebase ID token attaches to API calls (network tab shows `Authorization: Bearer …` on `/api/*`).

- [ ] **Step 2: Walk every route, asserting 0 console errors per route**

Routes (from `app/`): `/login`, `/onboarding`, `/(tabs)` → `/` (Today), `/log`, `/progress`, `/profile`, `/session`, plus the Chat overlay (FAB on every tab). For each:
- Load/navigate to the route.
- Open browser devtools console.
- Assert **0 errors** (warnings from RN-Web shims are acceptable; errors are not).

Use Playwright for a repeatable pass (optional but recommended):
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
# With the playwright MCP available, navigate to each route and read console_messages;
# fail the route if any message.type === 'error'.
```

- [ ] **Step 3: Fix any route that errors**, then re-export and re-walk that route. Common web-only errors: a native-only module imported on web (add a `.web.tsx` variant or `Platform.select`), or a `react-native` API with no web shim.

- [ ] **Step 4: Re-run the export to confirm a clean production build**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo export -p web 2>&1 | tail -5
```
Expected: clean "Exported" with no unresolved-import errors.

- [ ] **Step 5: Commit any route fixes**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add apps/mobile/app apps/mobile/components apps/mobile/lib
git commit -m "fix(web): resolve per-route console errors; verify google web auth" || echo "nothing to commit"
```

---

## Task 3.5: Deploy web to Firebase Hosting (dev + prod targets) and verify

**Files:** none (deploy operation)

**Interfaces:**
- Consumes: `firebase.json` two-target array (Task 3.1), `apps/mobile/dist` (Task 3.4 Step 4).
- Produces: a live hosted Expo web app on the `dev` site (`gimli-app-dev`) and the `prod` site (`gimli-app`).

**Assumption (D2):** named targets — `hosting:dev` → `gimli-app-dev`, `hosting:prod` → `gimli-app`. Both serve `apps/mobile/dist`; per-environment differences come from the `EXPO_PUBLIC_*` env present when the export was built. Deploy **dev first**, verify, then **prod**.

- [ ] **Step 1: Export with the DEV env, then deploy the dev target**

Build the export against the dev backend/Firebase config (use the dev `apps/mobile/.env*`; the relevant vars are `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_FIREBASE_CONFIG` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`). Then deploy only the `dev` hosting target:
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo export -p web 2>&1 | tail -3
cd /Users/jayspar/Documents/projects/Gymli
npx firebase deploy --only hosting:dev 2>&1 | tail -20
```
Expected: ends with `Deploy complete!` and the `gimli-app-dev` Hosting URL.

- [ ] **Step 2: Verify the DEV site**

Open the `gimli-app-dev` URL printed by Step 1. Confirm:
- `/` loads; deep-link a non-root route (e.g. `/progress`) — the SPA rewrite resolves it; 0 console errors.
- Google web auth works against the dev backend.
- A round-trip data action (load Today / start a session / open Progress charts) succeeds.

- [ ] **Step 3: Re-export with the PROD env, then deploy the prod target**

Re-export against the **prod** `EXPO_PUBLIC_*` config (prod backend host + prod Firebase project), then deploy only the `prod` target:
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo export -p web 2>&1 | tail -3
cd /Users/jayspar/Documents/projects/Gymli
npx firebase deploy --only hosting:prod 2>&1 | tail -20
```
Expected: ends with `Deploy complete!` and the `gimli-app` (prod) Hosting URL.

- [ ] **Step 4: Verify the PROD site**

Open the `gimli-app` URL. Repeat the Step 2 checks against the prod backend: `/` + deep-linked route load with 0 console errors, Google web auth works, a data round-trip succeeds.

- [ ] **Step 5: Record Phase 3 done**

No commit needed (deploy is not a repo change). Phase 3 DoD met when: BOTH hosted sites (dev + prod) render all routes at parity, auth works, 0 console errors on every route.

---

# PHASE 4 — Polish + Ops (Sentry, EAS Update, polish)

**Outcome (spec §11, §14):** EAS Update + Sentry wired; Reanimated transitions / `expo-image` / splash+icon polish. Keep polish tightly scoped — YAGNI.

---

## Task 4.1: Wire Sentry (install, plugin, DSN, init, EAS source maps, verify event)

**Files:**
- Modify: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/app.config.ts`
- Modify: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/app/_layout.tsx`
- Modify: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/.env.example`
- Modify: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/package.json` (via expo install)

**Interfaces:**
- Produces: `Sentry.init` + `Sentry.wrap(RootLayout)`; the `@sentry/react-native/expo` config plugin uploading source maps in EAS builds.

**Assumptions (D4–D7):** adopt Sentry; org `gymli`, project `gymli-mobile`; DSN via `EXPO_PUBLIC_SENTRY_DSN`; auth token via EAS secret `SENTRY_AUTH_TOKEN`.

- [ ] **Step 1: Install the SDK (expo install — it is SDK-version-gated)**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo install @sentry/react-native
grep -n "@sentry/react-native" package.json
```
Expected: dependency added at the SDK-56-compatible version.

- [ ] **Step 2: Add the Sentry config plugin to `app.config.ts`**

In `apps/mobile/app.config.ts`, add the plugin to the `plugins` array (org/project are D5; they let EAS upload source maps). Insert after the google-signin plugin entry:
```ts
    ['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.placeholder' }],
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG ?? 'gymli',
        project: process.env.SENTRY_PROJECT ?? 'gymli-mobile',
        // SENTRY_AUTH_TOKEN is read from the environment (EAS secret) at build time — never inline it here.
      },
    ],
```

- [ ] **Step 3: Initialize and wrap in the root layout**

In `apps/mobile/app/_layout.tsx`, add the import after the existing `expo-status-bar` import:
```ts
import * as Sentry from '@sentry/react-native';
```
Add the init call at module top level (after imports, before `AuthGate`):
```ts
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // Tag releases by OTA channel/version (spec §10). enableNative auto on dev/prod builds.
  tracesSampleRate: 0.2,
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN, // no-op locally if DSN unset
});
```
Wrap the default export. Change:
```ts
export default function RootLayout() {
```
to a named function plus a wrapped export — rename the existing function and add the wrap at the bottom of the file:
```ts
function RootLayout() {
```
And at the END of the file, replace nothing-was-there with:
```ts
export default Sentry.wrap(RootLayout);
```
(Ensure there is exactly one default export — the `Sentry.wrap` one.)

- [ ] **Step 4: Add the DSN to the env example**

In `apps/mobile/.env.example`, append:
```
EXPO_PUBLIC_SENTRY_DSN=https://<public-key>@<org-id>.ingest.sentry.io/<project-id>
```

- [ ] **Step 5: Register the secret auth token + DSN with EAS** (build-time)

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
# Secret (source-map upload) — NEVER committed:
NODE_ENV=development npx eas env:create --scope project --name SENTRY_AUTH_TOKEN --type secret --visibility secret --value "<sentry-auth-token>" --environment production --environment development --non-interactive || echo "set SENTRY_AUTH_TOKEN manually in EAS dashboard"
# DSN (public) for production builds:
NODE_ENV=development npx eas env:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --type string --value "<dsn>" --environment production --environment development --non-interactive || echo "set EXPO_PUBLIC_SENTRY_DSN manually in EAS dashboard"
```
Expected: secrets created (or the fallback note printed for manual dashboard entry).

- [ ] **Step 6: Typecheck**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 7: Verify a test event reaches Sentry**

Temporarily add a throwaway test button OR run a one-off capture. Simplest: in a dev session, call `Sentry.captureMessage('gymli sentry wiring test')` from the Today screen mount (add, run a dev build / `expo start`, confirm the event appears in the Sentry project, then REMOVE the test line). Confirm the event shows up under org `gymli` / project `gymli-mobile`.

- [ ] **Step 8: Commit**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add apps/mobile/app.config.ts apps/mobile/app/_layout.tsx apps/mobile/.env.example apps/mobile/package.json
git commit -m "feat(mobile): wire sentry (plugin, init, source maps, dsn env)"
```

---

## Task 4.2: Wire EAS Update (expo-updates, runtimeVersion, channels)

**Files:**
- Modify: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/app.config.ts`
- Modify: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/eas.json`
- Modify: `/Users/jayspar/Documents/projects/Gymli/apps/mobile/package.json` (via expo install)

**Interfaces:**
- Produces: `expo-updates` configured with a `runtimeVersion` policy + per-profile `channel`; OTA publishable via `eas update`.

**Assumptions (D8–D10):** channels `development` / `production`; `runtimeVersion` policy `appVersion`; update URL = `https://u.expo.dev/18695339-fd5b-4c06-9743-d0e59c0ac197`.

- [ ] **Step 1: Install expo-updates (SDK-managed module)**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo install expo-updates
grep -n "expo-updates" package.json
```
Expected: dependency added at the SDK-56 version.

- [ ] **Step 2: Add `runtimeVersion` + `updates` to `app.config.ts`**

In `apps/mobile/app.config.ts`, add these two top-level keys to the `config` object (after `experiments`, before `extra`):
```ts
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: 'https://u.expo.dev/18695339-fd5b-4c06-9743-d0e59c0ac197',
    // fallbackToCacheTimeout 0 = fully non-blocking startup (fetch update in background)
    fallbackToCacheTimeout: 0,
  },
```
(The EAS project id `18695339-…` already lives in `extra.eas.projectId`; D10 reuses it.)

- [ ] **Step 3: Add per-profile `channel` to `eas.json` build profiles**

In `apps/mobile/eas.json`, add a `channel` to each build profile (D8: channel == intended OTA stream). Edit the three `build` profiles:

`development`:
```json
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "environment": "development",
      "channel": "development",
      "env": { "APP_VARIANT": "development" },
      "android": { "buildType": "apk" }
    },
```
`preview` (internal track, prod-style runtime → production channel):
```json
    "preview": {
      "distribution": "internal",
      "environment": "development",
      "autoIncrement": true,
      "channel": "production",
      "env": { "APP_VARIANT": "development" },
      "android": { "buildType": "app-bundle" }
    },
```
`production`:
```json
    "production": {
      "distribution": "store",
      "environment": "production",
      "autoIncrement": true,
      "channel": "production",
      "env": { "APP_VARIANT": "production" },
      "android": { "buildType": "app-bundle" }
    },
```

- [ ] **Step 4: Validate `eas.json` and typecheck config**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('eas.json valid')"
NODE_ENV=development npx tsc --noEmit
NODE_ENV=development npx expo config --type public > /dev/null && echo "app.config.ts resolves"
```
Expected: `eas.json valid`, tsc clean, `app.config.ts resolves`.

- [ ] **Step 5: Verify an update publishes to a channel**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx eas update --channel development --message "phase 4: eas update wiring smoke" --non-interactive 2>&1 | tail -15
```
Expected: prints an update group id and a "published" line for the `development` channel (runtime `appVersion` = the current `version`). Confirm it lists under the project's Updates in the EAS dashboard. (A real device on a dev build of that runtime will then pull it; device pull is a manual follow-up, not required for the wiring DoD.)

- [ ] **Step 6: Commit**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add apps/mobile/app.config.ts apps/mobile/eas.json apps/mobile/package.json
git commit -m "feat(mobile): wire eas update (expo-updates, appVersion runtime, dev/prod channels)"
```

---

## Task 4.3: Polish pass — transitions, expo-image, splash/icon (tightly scoped)

**Files:**
- Modify: relevant `apps/mobile/app/**` / `apps/mobile/components/**` (stack transition + image swaps)
- Verify: `apps/mobile/app.config.ts` splash/icon (already present)

**Interfaces:**
- Consumes: `react-native-reanimated` (installed), `expo-image` (installed, `package.json`).
- Produces: smoother stack transitions, cached images, confirmed splash/icon.

**YAGNI guard:** this is the "looks as good as Strava" pass but scoped to the three concrete items the spec names. Do NOT add shared-element transitions, gesture choreography, or chart re-animation unless a specific screen demands it.

- [ ] **Step 1: Enable a polished stack transition on the session/modal routes**

In `apps/mobile/app/_layout.tsx`, the root `<Stack>` uses defaults. Give the session route a native slide/modal presentation. Add a `<Stack.Screen>` config for `session` inside the `<Stack>` (Expo Router accepts per-route options):
```tsx
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="session" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
```
(Reanimated 4 powers React Navigation's native-stack animations; no manual `Animated.View` needed for screen transitions.)

- [ ] **Step 2: Confirm `expo-image` is used for remote/avatar images**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
grep -rn "from 'react-native'" components app | grep -w "Image" || echo "no raw RN Image imports — good"
grep -rln "expo-image" components app | head
```
If any component imports `Image` from `react-native` for a content/avatar image, swap it to `import { Image } from 'expo-image'` (caching + placeholder). Icons/SVG are unaffected. If none found, no change needed.

- [ ] **Step 3: Verify splash + icon config resolves**

`app.config.ts` already declares `icon`, `android.adaptiveIcon`, and the `expo-splash-screen` plugin (bg `#0c0a09`, the forge dark stone). Confirm the referenced asset files exist:
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
for f in assets/images/icon.png assets/images/android-icon-foreground.png assets/images/android-icon-background.png assets/images/android-icon-monochrome.png assets/images/splash-icon.png assets/images/favicon.png; do
  test -f "$f" && echo "OK $f" || echo "MISSING $f"
done
```
Expected: all `OK`. If any `MISSING`, that asset must be added before a production build (flag it; do not fabricate an asset).

- [ ] **Step 4: Typecheck + web smoke**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx tsc --noEmit
```
Expected: clean. Optionally load localhost:4200 and confirm the session route still presents.

- [ ] **Step 5: Commit**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add apps/mobile/app apps/mobile/components
git commit -m "polish(mobile): modal session transition, expo-image, verify splash/icon" || echo "nothing to commit"
```

---

# PHASE 5 — Cleanup (delete `frontend/`, rewrite scripts, update CLAUDE.md)

**Outcome (spec §11, §14):** old `frontend/` removed; root scripts and CLAUDE.md updated to the Expo monorepo reality. **No-regression bar.** `backend/` stays.

---

## Task 5.1: Delete the old Vite `frontend/` app

**Files:**
- Delete: `/Users/jayspar/Documents/projects/Gymli/frontend/` (entire directory)

**Interfaces:**
- Consumes: Phase 3 complete (web is now served from `apps/mobile/dist`, so `frontend/dist` is dead).
- Produces: a repo with a single frontend (`apps/mobile`).

**Precondition:** Phase 3 Task 3.5 deployed — the hosted web no longer depends on `frontend/dist`. Do NOT delete `backend/`.

- [ ] **Step 1: Confirm nothing outside `frontend/` and `scripts/` still imports it**

```bash
cd /Users/jayspar/Documents/projects/Gymli
grep -rln "frontend/" --include=*.js --include=*.json --include=*.ts --include=*.md . \
  | grep -vE "^\./frontend/|node_modules|/dist/|package-lock|docs/superpowers/plans|docs/superpowers/specs" || echo "only root package.json + scripts/* + firebase.json reference frontend"
```
Expected: the remaining references are root `package.json`, `scripts/*.js` (dev orchestration), and (already repointed) `firebase.json`. These are handled in Tasks 5.2 (package.json) — `scripts/dev-with-ports.js` is intentionally left per D11.

- [ ] **Step 2: Delete the directory**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git rm -r frontend
```
Expected: git stages the deletion of the whole `frontend/` tree.

- [ ] **Step 3: Verify the workspace still installs (frontend already dropped from workspaces)**

Root `package.json` workspaces are already `["apps/*","packages/*"]` (frontend not listed), so no workspace edit is needed for the delete.
```bash
cd /Users/jayspar/Documents/projects/Gymli
test ! -d frontend && echo "frontend/ gone"
```
Expected: `frontend/ gone`.

- [ ] **Step 4: Commit**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git commit -m "chore: remove legacy capacitor/vite frontend (migrated to apps/mobile)"
```

---

## Task 5.2: Rewrite root `package.json` scripts to target `apps/mobile`

**Files:**
- Modify: `/Users/jayspar/Documents/projects/Gymli/package.json`

**Interfaces:**
- Consumes: `frontend/` deleted (Task 5.1).
- Produces: root scripts that point at `apps/mobile` (or are removed); no `cd frontend` left.

**Assumptions (D11, D12):** `dev:frontend` → `dev:mobile` (`expo start --web`); `dev:local` and `dev-with-ports.js` left as-is; drop Capacitor `android*` scripts, add EAS `build:android:*`.

- [ ] **Step 1: Replace the `scripts` block**

In `/Users/jayspar/Documents/projects/Gymli/package.json`, replace the entire `"scripts": { … }` object with:
```json
  "scripts": {
    "install-all": "NODE_ENV=development npm install && cd backend && NODE_ENV=development npm install",
    "build:web": "cd apps/mobile && NODE_ENV=development npx expo export -p web",
    "deploy:web:dev": "npm run build:web && firebase deploy --only hosting:dev",
    "deploy:web:prod": "npm run build:web && firebase deploy --only hosting:prod",
    "lint": "npm run lint --prefix apps/mobile && npm run lint --prefix backend",
    "test": "npm run test --prefix apps/mobile && npm run test --workspace @gymli/shared",
    "dev:local": "node scripts/dev-with-ports.js",
    "dev:local:list": "node scripts/list-instances.js",
    "dev:local:kill": "node scripts/kill-instance.js",
    "dev:mobile": "cd apps/mobile && NODE_ENV=development npx expo start --web",
    "dev:backend": "cd backend && npm run dev",
    "setup:env": "node scripts/setup-env.js",
    "validate-env": "node scripts/validate-env.js",
    "version:get": "node scripts/get-version.js",
    "version:bump": "node scripts/bump-version.js",
    "list-models": "node scripts/list-models.js",
    "release": "standard-version",
    "release:patch": "standard-version --release-as patch",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "prepare": "husky",
    "build:android:dev": "cd apps/mobile && NODE_ENV=development npx eas build -p android --profile development",
    "build:android:prod": "cd apps/mobile && NODE_ENV=development npx eas build -p android --profile production"
  },
```
Notes on the diff: `install-all` drops the `cd frontend` install; `build`→`build:web` (expo export); added `deploy:web:dev` / `deploy:web:prod` (named Firebase hosting targets, per D2 — export carries the matching `EXPO_PUBLIC_*` env before each deploy); `lint`/`test` now target `apps/mobile` + `@gymli/shared` (the workspace package) instead of `frontend`; `dev:frontend`→`dev:mobile`; Capacitor `android`/`android:dev`/`android:local`→EAS `build:android:dev`/`build:android:prod`.

- [ ] **Step 2: Remove `react-dom` from root deps if now unused** (only `frontend` used it at root level)

Check whether anything outside `apps/*`/`packages/*` (which have their own deps) needs root `react`/`react-dom`:
```bash
cd /Users/jayspar/Documents/projects/Gymli
grep -rln "react-dom" scripts/ backend/ 2>/dev/null || echo "no root consumer of react-dom"
```
If "no root consumer": leave `react`/`react-dom` as-is (harmless; some tooling expects a root react) OR remove them — low risk either way. **Decision: leave them** to avoid an install churn regression. (No edit.)

- [ ] **Step 3: Validate JSON + run the rewritten lint**

```bash
cd /Users/jayspar/Documents/projects/Gymli
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json valid')"
npm run lint 2>&1 | tail -15
```
Expected: `package.json valid`; lint runs against `apps/mobile` + `backend` and passes (or surfaces only pre-existing lint debt — fix mobile lint errors introduced by this plan, leave unrelated backend debt).

- [ ] **Step 4: Commit**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add package.json
git commit -m "chore: rewrite root scripts for expo monorepo (drop frontend/capacitor, add eas/web)"
```

---

## Task 5.3: Update `CLAUDE.md` to the Expo monorepo reality

**Files:**
- Modify: `/Users/jayspar/Documents/projects/Gymli/CLAUDE.md`

**Interfaces:**
- Produces: project memory that documents Expo SDK 56 + the `apps/`/`packages/` layout and the new commands.

**Context:** the current `CLAUDE.md` documents React 19 + Vite 7 + Tailwind v4 + Capacitor 8 and a `frontend/`+`backend/` tree — materially wrong post-migration. Update the three stale sections; preserve the doc-style rule (tables, bullets), Theme, Conventions, and Skill Workflows sections that are still accurate.

- [ ] **Step 1: Replace the Architecture section**

In `CLAUDE.md`, replace the `## Architecture` block (the `**Full-stack monorepo:**` bullet list) with:
```markdown
## Architecture

**Expo monorepo (npm workspaces `apps/*`, `packages/*`):**
- **Mobile + Web**: Expo SDK 56 (React Native 0.85 + React 19) → Android + static web from one codebase (`apps/mobile`). Expo Router (typed routes), NativeWind 4 (Tailwind v3), Reanimated 4.
- **Shared logic**: `packages/shared` (`@gymli/shared`) — platform-agnostic TS (axios api client, domain utils, types); zero RN/DOM imports; consumed as source.
- **Backend**: Node.js 22 + Express 5 (unchanged by the migration).
- **Database**: Firebase Firestore | **Auth**: Firebase JS SDK (Google native via `@react-native-google-signin`, Google web via `signInWithPopup`, email/password) | **AI**: Gemini 2.5 Flash
- **Hosting**: Cloud Run (backend) + Firebase Hosting (Expo web export `apps/mobile/dist`). **Builds/OTA**: EAS Build + EAS Update. **Monitoring**: Sentry.
- **iOS**: deferred (codebase is cross-platform; not built in v1).
```

- [ ] **Step 2: Replace the Project Structure tree**

Replace the entire ```` ``` ```` code block under `## Project Structure` with:
```markdown
```
Gymli/
├── apps/
│   └── mobile/              # Expo app → Android + static web (iOS-ready)
│       ├── app/             # Expo Router routes: (tabs)/{index,log,progress,profile}, login, onboarding, session
│       ├── components/      # ui/, workout/, log/, progress/, chat/, routine/, layout/
│       ├── contexts/        # AuthContext, UserProfileContext, ThemeContext
│       ├── lib/             # firebase.web.ts / firebase.native.ts, api, cn
│       ├── assets/          # Inter fonts, icons, splash
│       ├── app.config.ts    # dynamic Expo config (web static, updates, sentry plugin)
│       ├── eas.json         # build profiles + OTA channels (development/preview/production)
│       └── metro.config.js  # NativeWind wrap + Firebase/Hermes resolver fix
├── packages/
│   └── shared/              # @gymli/shared — api client, domain utils, types (vitest)
├── backend/                 # Express API (Cloud Run) — controllers/ + services/ + routes/api.js
├── scripts/                 # dev tooling (dev-with-ports, setup-env, validate-env, bump-version, …)
├── docs/                    # plans (docs/superpowers/plans), specs (docs/superpowers/specs)
├── firebase.json            # Hosting (apps/mobile/dist) + Firestore config
├── firestore.rules
└── version.json
```
```

- [ ] **Step 3: Replace the Commands block**

Replace the ```` ```bash ```` block under `## Commands` with:
```markdown
```bash
npm run install-all          # Install root + backend deps (apps/* via workspaces)
npm run dev:mobile           # Expo dev server (web) for apps/mobile
npm run dev:local            # Backend dev orchestration (multi-instance ports)
npm run dev:backend          # Backend only
npm run lint                 # ESLint apps/mobile + backend
npm run test                 # apps/mobile (jest-expo) + @gymli/shared (vitest)
npm run build:web            # Expo static web export → apps/mobile/dist
npm run deploy:web:dev       # build:web + firebase deploy --only hosting:dev (gimli-app-dev)
npm run deploy:web:prod      # build:web + firebase deploy --only hosting:prod (gimli-app)
npm run build:android:dev    # EAS Android build (development profile)
npm run build:android:prod   # EAS Android build (production profile)
npm run setup:env            # Generate .env files from templates
npm run validate-env         # Check required env vars
npm run release              # Auto-bump version via conventional commits
```
```
Also update the **Frontend**/**Backend** bullets under `### Code Style` if present: replace any "Vite/Capacitor/Tailwind v4/raw fetch" frontend guidance with "Expo Router + NativeWind (Tailwind v3); React Context for global state; api via `@gymli/shared`; never raw fetch in components." Leave the Backend bullet unchanged.

- [ ] **Step 4: Verify no stale stack references remain**

```bash
cd /Users/jayspar/Documents/projects/Gymli
grep -nE "Vite|Capacitor|frontend/dist|frontend/" CLAUDE.md || echo "no stale stack references in CLAUDE.md"
```
Expected: `no stale stack references in CLAUDE.md`. (If the Skill Workflows / Design Docs sections legitimately mention a path, confirm it's still valid.)

- [ ] **Step 5: Commit**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to expo monorepo (stack, structure, commands)"
```

---

## Task 5.4: Final verification — lint, web build, android build all green from new scripts

**Files:** none (verification)

**Interfaces:**
- Consumes: all Phase 5 edits.
- Produces: evidence that the new toolchain works end-to-end.

- [ ] **Step 1: Lint green from the rewritten script**

```bash
cd /Users/jayspar/Documents/projects/Gymli
npm run lint 2>&1 | tail -15
```
Expected: passes (`apps/mobile` + `backend`). Fix any error this plan introduced; leave unrelated pre-existing debt.

- [ ] **Step 2: Tests green**

```bash
cd /Users/jayspar/Documents/projects/Gymli
npm test 2>&1 | tail -20
```
Expected: `apps/mobile` jest-expo suite + `@gymli/shared` vitest both pass.

- [ ] **Step 3: Web build green from the rewritten script**

```bash
cd /Users/jayspar/Documents/projects/Gymli
npm run build:web 2>&1 | tail -10
test -f apps/mobile/dist/index.html && echo "web export OK"
```
Expected: clean export; `web export OK`.

- [ ] **Step 4: Android dev build green from the rewritten script**

```bash
cd /Users/jayspar/Documents/projects/Gymli
NODE_ENV=development npx expo config --type public --json > /dev/null && echo "config resolves"
# Kick the EAS android dev build (cloud build; --no-wait to not block):
npm run build:android:dev -- --no-wait 2>&1 | tail -15
```
Expected: `config resolves`; EAS queues a development Android build and prints a build URL. (Cloud build completion is monitored on EAS; queuing successfully from the new script is the verification.)

- [ ] **Step 5: Confirm no `frontend/` / Capacitor references survive anywhere relevant**

```bash
cd /Users/jayspar/Documents/projects/Gymli
grep -rln "cd frontend\|capacitor\|frontend/dist" package.json firebase.json CLAUDE.md 2>/dev/null && echo "STALE REFERENCE FOUND — fix" || echo "clean"
```
Expected: `clean`.

- [ ] **Step 6: Commit any final fixes**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git add -A && git commit -m "chore: final phase 5 verification fixes" || echo "nothing to commit"
```

---

## Self-Review Notes

**§14 Definition of Done coverage:**
| DoD item | Covered by |
|---|---|
| Android dev build + static web export run all screens at parity vs live backend | Phase 3 (web export + parity audit Tasks 3.2–3.5); Android build verified Task 5.4 Step 4 (Phases 0–2 already built the screens) |
| Auth (Google + email) on Android and web | Task 3.4 Step 1 (web Google popup + email); Android auth verified in Phases 0–1 (vertical slice) |
| `packages/shared` zero RN/DOM imports; shared tests pass | Task 5.4 Step 2 (`@gymli/shared` vitest) — boundary established in Phase 0, re-verified |
| Old `frontend/` removed; root scripts + docs updated | Task 5.1 (delete), 5.2 (scripts), 5.3 (CLAUDE.md) |
| EAS Build (Android) + EAS Update + Sentry configured | EAS Build already exists (verified Task 5.4 Step 4); EAS Update Task 4.2; Sentry Task 4.1 |
| iOS excluded | Honored — no iOS tasks (Global Constraints) |

**Spec §11 phase coverage:** Phase 3 web (output static already set; hosting repoint 3.1, export 3.2, layout passes 3.3, deploy 3.5). Phase 4 polish+ops (Sentry 4.1, EAS Update 4.2, transitions/expo-image/splash 4.3). Phase 5 cleanup (delete frontend 5.1, scripts 5.2, CLAUDE.md 5.3, CI/verify 5.4).

**Placeholder scan:** angle-bracket tokens (`<sentry-auth-token>`, `<dsn>`, `<public-key>`, `<org-id>`, `<project-id>`) are real **user-supplied secrets/identifiers**, not plan placeholders — each is documented in Decisions & Assumptions with its override point, which the writing-plans skill permits for genuinely external credentials. No "TBD/TODO/handle edge cases/similar to Task N" placeholders. Every config edit shows exact before→after.

**Consistency check:** `apps/mobile/dist` used identically in firebase.json both targets (3.1), export (3.2), deploy (3.5), build:web/deploy:web:dev/deploy:web:prod/verify (5.2/5.4), CLAUDE.md (5.3). Firebase hosting target keys `dev`/`prod` consistent across `.firebaserc` (sites `gimli-app-dev`/`gimli-app`), `firebase.json` `hosting[].target` (3.1), `target:apply` (3.1 Step 4), and `--only hosting:dev`/`--only hosting:prod` (3.5, 5.2 scripts). Channel names `development`/`production` consistent across eas.json (4.2) and the publish smoke (4.2 Step 5). EAS project id `18695339-fd5b-4c06-9743-d0e59c0ac197` matches `app.config.ts` `extra.eas.projectId` and the updates URL (4.2). Sentry env var `EXPO_PUBLIC_SENTRY_DSN` consistent in init (4.1 Step 3), env example (4.1 Step 4), EAS secret (4.1 Step 5). `runtimeVersion:{policy:'appVersion'}` matches D9.

**Known follow-ups (intentionally out of scope, flagged not silently dropped):** `scripts/dev-with-ports.js` still copies `frontend/.env.local` (D11) — left for a later dev-tooling cleanup; per-target `dev`/`prod` Firebase hosting (D2) not adopted; on-device EAS Update pull and full EAS cloud-build completion are manual confirmations beyond the wiring DoD.

---

## Task Dependency Graph

```
Phase 3:  3.1 ─┐
               ├─► 3.2 ─► 3.3 ─► 3.4 ─► 3.5
(3.1 firebase.json + 3.2 export are independent setup; 3.3/3.4 audit needs a running export;
 3.5 deploy needs both 3.1 and a clean 3.4 export)

Phase 4:  4.1 (Sentry)   ─┐  independent of each other and of Phase 3
          4.2 (EAS Update)─┤  (can run in parallel after Phase 3, or alongside it)
          4.3 (Polish)    ─┘

Phase 5:  5.1 (delete frontend) ──► 5.2 (root scripts) ──► 5.3 (CLAUDE.md) ──► 5.4 (final verify)
          5.1 requires Phase 3 (3.5 deploy) done — web no longer served from frontend/dist.
          5.4 requires 4.1/4.2 (verifies sentry/update config resolves) + 5.2/5.3.
```
