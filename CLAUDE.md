# Gymli - AI Gym Assistant

AI-powered gym assistant with dwarf/forge-themed UI, workout plan generation, guided sessions, progress tracking, and AI chat companion.

**Doc style:** Tables over prose, inline formats, no duplicate info, bullets not paragraphs.

## Architecture

**Expo monorepo (npm workspaces `apps/*`, `packages/*`):**
- **Mobile + Web**: Expo SDK 56 (React Native 0.85 + React 19) → Android + static web from one codebase (`apps/mobile`). Expo Router (typed routes), NativeWind 4 (Tailwind v3), Reanimated 4.
- **Shared logic**: `packages/shared` (`@gymli/shared`) — platform-agnostic TS (axios api client, domain utils, types); zero RN/DOM imports; consumed as source.
- **Backend**: Node.js 22 + Express 5 (unchanged by the migration).
- **Database**: Firebase Firestore | **Auth**: Firebase JS SDK (Google native via `@react-native-google-signin`, Google web via `signInWithPopup`, email/password) | **AI**: Gemini 2.5 Flash
- **Hosting**: Cloud Run (backend) + Firebase Hosting — **dev** `gimli-app-dev.web.app` / **prod** `gimli-app.web.app` (Expo web export `apps/mobile/dist`, named targets). **Builds/OTA**: EAS Build (Android **AABs** by default → Play internal; no installable APK) + EAS Update (dev/prod channels).
- **iOS**: deferred (codebase is cross-platform; not built in v1).

> **Before writing any Expo code:** read https://docs.expo.dev/versions/v56.0.0/ (mandated by `apps/mobile/AGENTS.md`).

## Project Structure

```
Gymli/
├── apps/
│   └── mobile/              # Expo app → Android + static web (iOS-ready)
│       ├── app/             # Expo Router routes: (tabs)/{index,log,progress,profile}, login, onboarding, session
│       ├── components/      # ui/, workout/, log/, progress/, chat/, routine/, layout/
│       ├── contexts/        # AuthContext, UserProfileContext, ThemeContext
│       ├── lib/             # firebase.ts, auth.ts (+ auth.web/.native), api, cn, test-ids
│       ├── assets/          # icons, splash
│       ├── e2e/             # E2E tests: playwright/ (web) + maestro/ (Android)
│       ├── app.config.ts    # dynamic Expo config (web static, updates)
│       ├── eas.json         # build profiles + OTA channels (development/preview/production)
│       └── metro.config.js  # NativeWind wrap + Firebase/Hermes resolver fix
├── packages/
│   └── shared/              # @gymli/shared — api client, domain utils, types (vitest)
├── backend/                 # Express API (Cloud Run) — controllers/ + services/ + routes/api.js
├── scripts/                 # dev tooling (dev-with-ports, setup-env, validate-env, bump-version, …)
├── docs/                    # plans (docs/plans), superpowers plans/specs (docs/superpowers/)
├── firebase.json            # Hosting (apps/mobile/dist) + Firestore config
├── firestore.rules
└── version.json
```

## Commands

```bash
npm run install-all          # Install root + backend deps (apps/* via workspaces)
npm run dev:mobile           # Expo dev server (web) for apps/mobile
npm run dev:local            # legacy multi-instance orchestrator — still references the removed frontend/ (D11 follow-up); for Expo dev use dev:mobile + dev:backend
npm run dev:backend          # Backend only
npm run lint                 # ESLint apps/mobile + backend
npm run test                 # apps/mobile (jest-expo) + @gymli/shared (vitest)
npm run e2e:web              # Playwright E2E tests (web)
npm run e2e:android          # Maestro E2E tests (Android)
npm run e2e                  # All E2E tests
npm run build:web            # Expo static web export → apps/mobile/dist
npm run deploy:web:dev       # build:web + firebase deploy --only hosting:dev
npm run deploy:web:prod      # build:web + firebase deploy --only hosting:prod
npm run build:android:dev    # EAS Android build (development profile, AAB)
npm run build:android:prod   # EAS Android build (production profile, AAB)
npm run update:dev           # EAS Update (OTA) → development channel
npm run update:prod          # EAS Update (OTA) → production channel
npm run setup:env            # Generate .env files from templates
npm run validate-env         # Check required env vars
npm run release              # Auto-bump version via conventional commits
```

## Environment Setup

```bash
npm run install-all
cp backend/.env.example backend/.env          # Add Firebase + Gemini credentials
cp apps/mobile/.env.example apps/mobile/.env.local
npm run dev:backend                            # backend (one shell)
npm run dev:mobile                             # Expo web at the printed URL (another shell)
```

Required credentials in `backend/.env`: Firebase service account, Gemini API key. See `backend/.env.example` for full list.
**E2E:** copy `apps/mobile/e2e/.env.e2e.example` → `.env.e2e` (test-account creds) to run `e2e:web`; `e2e:android` also needs an Android emulator + dev build.
**Web auth:** Google sign-in on a hosting domain requires adding that domain to Firebase Auth → Authorized domains.

## API Endpoints

All endpoints (except health) require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (public) |
| GET/POST | `/api/user/profile` | User profile CRUD |
| GET | `/api/exercises` | Search exercises (q, category, muscleGroup) |
| GET | `/api/plans/templates` | List plan templates |
| POST | `/api/plans/generate` | Generate AI-customized plan |
| GET | `/api/plans/active` | Get active plan |
| GET/PUT | `/api/plans/:id` | Plan CRUD |
| GET | `/api/workouts/today` | Today's planned workout |
| GET/POST | `/api/workouts` | List/create workouts |
| PUT/DELETE | `/api/workouts/:id` | Update/delete workout |
| POST | `/api/chat` | Chat with Gymli (rate limited: 10/min) |
| GET | `/api/chat/history` | Chat history |
| DELETE | `/api/chat/history` | Clear chat |
| GET | `/api/stats/exercises` | Logged exercises list |
| GET | `/api/stats/exercise/:id` | Exercise progress over time |
| GET | `/api/stats/volume` | Weekly volume stats |
| GET | `/api/stats/streak` | Streak + calendar heatmap |
| GET | `/api/stats/insights` | AI-generated insights |

## Conventions

### Code Style

- **Files**: kebab-case | **Components**: PascalCase | **Variables**: camelCase
- **Mobile**: Expo Router + NativeWind (Tailwind v3). React Context for global state. API via `@gymli/shared` (never raw fetch in components). Platform splits via `.web.ts`/`.native.ts` extensions.
- **Backend**: Controller-Service pattern. Pino logging via `req.log`.

### Git

- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`)
- **Branches:** `feature/<name>`, `fix/<name>`, `claude/<name>` (worktrees)
- **Branch flow:** `feature/*` → **`develop`** (default + integration branch; squash PR) → **`master`** (prod; **regular merge for releases — never squash to master**). Never PR a feature straight to `master`. Cut releases with `npm run release` (tags `v*` → `release-prod.yml` builds + submits). Merge via `/pr-merge`.
- **Always use `/commit-push`** instead of raw `git commit` - enforces lint + security checks
- **Never commit secrets** - run `/security-scan` when in doubt

### Implementation Plans

Plans live in `docs/plans/` (or `docs/superpowers/plans/`) with naming: `YYYY-MM-DD-<project>-<type>.md`

Include in every plan:
- Skill invocation notes at the top (which skills to use for which tasks)
- Task dependency graph at the bottom
- Specific file paths for creates/modifies per task

## Theme

Forge-inspired: warm amber primary (#d4872a), stone backgrounds (#fdf8f0 light / #0c0a09 dark). System fonts (no custom font loading). Dark/light mode toggle via ThemeContext.

## Gotchas

**Web divergence** (web is a real shipped target — these bite):
- **Tab bar:** react-navigation ignores `tabBarStyle.height` on web (forces a ~47px bar, clipping labels). Styled via a runtime `<style>` injection in `app/(tabs)/_layout.tsx`, scoped to the label only (don't touch the icon child — it collapses the svg).
- **Custom web CSS:** NativeWind does **not** bundle raw CSS appended to `global.css` on web (only Tailwind utilities). For web-only overrides of third-party DOM, inject a `<style>` at runtime — not via `global.css`.
- **Mobile frame:** web renders inside a centered max-width-430 `AppFrame` (`app/_layout.tsx`) so the phone-first UI doesn't stretch on desktop. Native is full-screen.
- **Firebase web cold-start auth race:** intermittent 401 on refresh-while-signed-in (token not rehydrated before a screen fetches). Fix-in-waiting: `await auth.authStateReady()` in `lib/api.ts`.
- Platform splits via `.web.ts` / `.native.ts` (e.g. `lib/auth.*`).

**EAS builds + OTA** (native builds are slow ~10-15min — don't rebuild per change):
- **Iterate with OTA:** after a native build is installed, ship JS/UI/logic changes via `npm run update:dev` / `update:prod` (`eas update`, seconds — no rebuild/resubmit). Only **native** changes (new native deps, config plugins, icons/splash, `app.config` native bits) need a rebuild.
- **Channel mapping** (`eas.json`): dev apps (`development` + `preview`, dev backend) → **`development`** channel; `production` (prod backend) → **`production`** channel. Scripts pin `--environment` so each OTA bundle bakes the right backend. So `update:dev` → dev apps; `update:prod` → prod app only — clean dev/prod separation on both axes (channel = which apps, env = which backend).
- Faster full builds: `eas build --local` (minibox has the Android SDK + JDK), or a paid EAS plan (priority queue). First build is the slow/cold one.

## Skill Workflows

### New Feature

```
/superpowers:brainstorming -> /superpowers:writing-plans -> /feature-start <name>
-> /superpowers:executing-plans (with /frontend-design:frontend-design for UI tasks)
-> /superpowers:verification-before-completion -> /commit-push -> /pr-flow
```

### Quick Fix

```
/superpowers:systematic-debugging -> fix -> /superpowers:verification-before-completion -> /commit-push
```

## Design Docs

| Doc | Path |
|-----|------|
| Design | `docs/plans/2026-02-07-gymli-design.md` |
| Implementation Plan | `docs/plans/2026-02-07-gymli-implementation-plan.md` |
