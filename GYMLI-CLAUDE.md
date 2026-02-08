# Gymli - AI Gym Assistant

AI-powered gym assistant with dwarf/forge-themed UI, workout plan generation, guided sessions, progress tracking, and AI chat companion.

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
│   │   ├── api/             # Axios client and API services
│   │   └── utils/           # Helper functions
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
├── firebase.json            # Firebase config
├── firestore.rules          # Security rules
└── version.json             # Centralized version
```

## Local Development

```bash
npm run install-all
cp backend/.env.example backend/.env    # Add Firebase + Gemini credentials
cp frontend/.env.local.template frontend/.env.local
npm run dev:local                       # Frontend :4000, Backend :4001
```

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

## Coding Conventions

- **Files**: kebab-case. **React**: PascalCase. **Variables**: camelCase.
- **Frontend**: React Context for global state. Axios wrappers in `api/services.js`. Tailwind CSS with CSS variables for theming.
- **Backend**: Controller-Service pattern. Pino logging via `req.log`.
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`).

## Theme

Forge-inspired: warm amber primary (#d4872a), stone backgrounds (#fdf8f0 light / #0c0a09 dark). Cinzel display font + Outfit body. Dark/light mode toggle via ThemeContext.

