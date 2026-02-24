# Gymli - AI Gym Assistant

AI-powered gym assistant with dwarf/forge-themed UI, workout plan generation, guided sessions, progress tracking, and AI chat companion.

**Doc style:** Tables over prose, inline formats, no duplicate info, bullets not paragraphs.

## Architecture

**Full-stack monorepo:**
- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4 + Capacitor 8
- **Backend**: Node.js 22 + Express 5
- **Database**: Firebase Firestore | **Auth**: Firebase Auth | **AI**: Gemini 2.5 Flash
- **Hosting**: Cloud Run (backend) + Firebase Hosting (frontend)

## Project Structure

```
Gymli/
├── frontend/                 # React + Vite web app
│   ├── src/
│   │   ├── pages/           # Today, Log, Progress, Profile, Login, PlanSetup
│   │   ├── components/      # UI components
│   │   │   ├── layout/      # Layout, TopBar, BottomNav, ProfileMenu, MobileContainer
│   │   │   ├── workout/     # WorkoutSession, ExerciseCard, SetRow, RestTimer, WorkoutSummary
│   │   │   ├── plan/        # TemplatePicker, PlanView
│   │   │   ├── log/         # ExercisePicker, ManualLogForm, WorkoutHistory*
│   │   │   ├── chat/        # ChatFAB, ChatOverlay, ChatMessage, ChatInput
│   │   │   └── progress/    # ExerciseChart, VolumeChart, StreakCalendar, GymliInsights
│   │   ├── contexts/        # AuthContext, UserProfileContext, ThemeContext
│   │   ├── api/             # Axios client (client.js), Firebase (firebase.js), API services (services.js)
│   │   └── utils/           # Helper functions (cn.js)
│   ├── scripts/             # Android build script
│   └── capacitor.config.json
├── backend/                  # Express API server
│   ├── src/
│   │   ├── index.js         # Server entry point
│   │   ├── logger.js        # Pino logger
│   │   ├── routes/api.js    # Route definitions
│   │   ├── controllers/     # auth, user, exercise, plan, workout, chat, stats
│   │   └── services/        # firebase, ai, user, exercise, plan-templates, plan, workout, chat, stats
│   ├── scripts/             # seed-exercises.js
│   └── Dockerfile
├── scripts/                  # Dev tooling (dev-with-ports, setup-env, validate-env, bump-version, etc.)
├── docs/plans/              # Design docs and implementation plans
├── firebase.json            # Firebase config
├── firestore.rules          # Security rules
└── version.json             # Centralized version
```

## Commands

```bash
npm run install-all          # Install root + frontend + backend deps
npm run dev:local            # Start both frontend (:4000) and backend (:4001)
npm run dev:frontend         # Frontend only
npm run dev:backend          # Backend only
npm run lint                 # ESLint frontend + backend
npm run build                # Install all + frontend production build
npm run android              # Build Android APK (prod)
npm run android:dev          # Build Android APK (dev)
npm run android:local        # Build Android APK (local)
npm run setup:env            # Generate .env files from templates
npm run validate-env         # Check required env vars are set
npm run release              # Auto-bump version via conventional commits
```

## Environment Setup

```bash
npm run install-all
cp backend/.env.example backend/.env          # Add Firebase + Gemini credentials
cp frontend/.env.local.template frontend/.env.local
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
- **Frontend**: React Context for global state. Axios wrappers in `api/services.js`. Tailwind CSS with CSS variables for theming. Never raw fetch in components.
- **Backend**: Controller-Service pattern. Pino logging via `req.log`.

### Git

- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`)
- **Branches:** `feature/<name>`, `fix/<name>`, `claude/<name>` for worktrees
- **Always use `/commit-push`** instead of raw `git commit` - enforces lint + security checks
- **Never commit secrets** - run `/security-scan` when in doubt

### Implementation Plans

Plans live in `docs/plans/` with naming: `YYYY-MM-DD-<project>-<type>.md`

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
