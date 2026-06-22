# Gymli - AI Gym Assistant

AI-powered gym assistant with dwarf/forge-themed UI, workout plan generation, guided sessions, progress tracking, and AI chat companion.

**Doc style:** Tables over prose, inline formats, no duplicate info, bullets not paragraphs.

## Architecture

**Expo monorepo (npm workspaces `apps/*`, `packages/*`):**
- **Mobile + Web**: Expo SDK 56 (React Native 0.85 + React 19) → Android + static web from one codebase (`apps/mobile`). Expo Router (typed routes), NativeWind 4 (Tailwind v3), Reanimated 4.
- **Shared logic**: `packages/shared` (`@gymli/shared`) — platform-agnostic TS (axios api client, domain utils, types); zero RN/DOM imports; consumed as source.
- **Backend**: Node.js 22 + Express 5 (unchanged by the migration).
- **Database**: Firebase Firestore | **Auth**: Firebase JS SDK (Google native via `@react-native-google-signin`, Google web via `signInWithPopup`, email/password) | **AI**: Gemini 2.5 Flash
- **Hosting**: Cloud Run (backend) + Firebase Hosting (Expo web export `apps/mobile/dist`). **Builds/OTA**: EAS Build + EAS Update. **Monitoring**: Sentry.
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
│       ├── lib/             # firebase.web.ts / firebase.native.ts, api, cn
│       ├── assets/          # Inter fonts, icons, splash
│       ├── e2e/             # E2E tests: playwright/ (web) + maestro/ (Android)
│       ├── app.config.ts    # dynamic Expo config (web static, updates, sentry plugin)
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
npm run dev:local            # Backend dev orchestration (multi-instance ports)
npm run dev:backend          # Backend only
npm run lint                 # ESLint apps/mobile + backend
npm run test                 # apps/mobile (jest-expo) + @gymli/shared (vitest)
npm run e2e:web              # Playwright E2E tests (web)
npm run e2e:android          # Maestro E2E tests (Android)
npm run e2e                  # All E2E tests
npm run build:web            # Expo static web export → apps/mobile/dist
npm run deploy:web:dev       # build:web + firebase deploy --only hosting:dev
npm run deploy:web:prod      # build:web + firebase deploy --only hosting:prod
npm run build:android:dev    # EAS Android build (development profile)
npm run build:android:prod   # EAS Android build (production profile)
npm run setup:env            # Generate .env files from templates
npm run validate-env         # Check required env vars
npm run release              # Auto-bump version via conventional commits
```

## Environment Setup

```bash
npm run install-all
cp backend/.env.example backend/.env          # Add Firebase + Gemini credentials
cp apps/mobile/.env.example apps/mobile/.env.local
npm run dev:local
```

Required credentials in `backend/.env`: Firebase service account, Gemini API key. See `backend/.env.example` for full list.

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
- **Branches:** `feature/<name>`, `fix/<name>`, `claude/<name>` for worktrees
- **Always use `/commit-push`** instead of raw `git commit` - enforces lint + security checks
- **Never commit secrets** - run `/security-scan` when in doubt

### Implementation Plans

Plans live in `docs/plans/` (or `docs/superpowers/plans/`) with naming: `YYYY-MM-DD-<project>-<type>.md`

Include in every plan:
- Skill invocation notes at the top (which skills to use for which tasks)
- Task dependency graph at the bottom
- Specific file paths for creates/modifies per task

## Theme

Forge-inspired: warm amber primary (#d4872a), stone backgrounds (#fdf8f0 light / #0c0a09 dark). Cinzel display font + Outfit body. Dark/light mode toggle via ThemeContext.

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
