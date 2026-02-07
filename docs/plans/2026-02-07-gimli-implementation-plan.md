# Gimli - AI Gym Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILLS:
> - Use superpowers:executing-plans to implement this plan task-by-task.
> - Use frontend-design:frontend-design for ALL frontend UI tasks (Tasks 5, 6, 10, 12, 13, 15, 17, 19). This skill creates distinctive, production-grade interfaces. Invoke it before writing any JSX/CSS.

**Goal:** Build a chat-first AI gym assistant with structured workout tracking, plan generation, and progress visualization.

**Architecture:** Monorepo with React + Vite + Tailwind CSS + Capacitor frontend and Node.js + Express backend. Firebase Firestore for data, Firebase Auth for authentication, Gemini 3.0 for AI. Deployed to Cloud Run (backend) and Firebase Hosting (frontend).

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, Capacitor 8, Express 5, Firebase Admin, Gemini 3.0, Pino logging, Recharts

**Reference:** This project mirrors the Sammy architecture. See `docs/plans/2026-02-07-gimli-design.md` for full design.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `.versionrc.json`
- Create: `version.json`
- Create: `commitlint.config.js`
- Create: `scripts/dev-with-ports.js`

**Step 1: Create root package.json**

```json
{
  "name": "gimli",
  "version": "0.1.0",
  "description": "AI-powered gym assistant",
  "scripts": {
    "install-all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "build": "npm run install-all && cd frontend && npm run build",
    "lint": "npm run lint --prefix frontend && npm run lint --prefix backend",
    "dev:local": "node scripts/dev-with-ports.js",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "release": "standard-version",
    "release:patch": "standard-version --release-as patch",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "prepare": "husky"
  },
  "dependencies": {
    "concurrently": "^8.2.2",
    "dotenv": "^16.6.1"
  },
  "devDependencies": {
    "@commitlint/cli": "^20.3.1",
    "@commitlint/config-conventional": "^20.3.1",
    "husky": "^9.1.7",
    "standard-version": "^9.5.0"
  }
}
```

**Step 2: Create .gitignore**

Standard Node.js ignores: `node_modules/`, `.env*` (except `.env.example` and `.env.template`), `dist/`, `android/`, `ios/`, `.firebase/`, IDE configs.

**Step 3: Create version.json, .versionrc.json, commitlint.config.js**

Mirror Sammy's setup: version bumps in root, frontend, and backend package.json files. Conventional commits enforced via husky + commitlint.

**Step 4: Create scripts/dev-with-ports.js**

Dev server launcher that spawns frontend (Vite on port 4000) and backend (nodemon on port 4001) concurrently with prefixed output.

**Step 5: Run npm install and set up husky**

```bash
npm install
npx husky init
echo 'npx --no -- commitlint --edit $1' > .husky/commit-msg
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: project scaffolding with monorepo setup"
```

---

## Task 2: Backend Foundation

**Files:**
- Create: `backend/package.json`
- Create: `backend/src/index.js`
- Create: `backend/src/logger.js`
- Create: `backend/src/routes/api.js`
- Create: `backend/src/controllers/auth-controller.js`
- Create: `backend/src/services/firebase.js`
- Create: `backend/.env.example`
- Create: `backend/Dockerfile`
- Create: `backend/eslint.config.js`

**Step 1: Create backend/package.json**

```json
{
  "name": "gimli-backend",
  "version": "0.1.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "lint": "eslint ."
  },
  "dependencies": {
    "@google/genai": "^1.35.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "express-rate-limit": "^8.2.1",
    "firebase-admin": "^13.6.0",
    "helmet": "^8.1.0",
    "pino": "^10.1.0",
    "pino-http": "^11.0.0"
  },
  "devDependencies": {
    "eslint": "^9.39.2",
    "nodemon": "^3.1.11",
    "pino-pretty": "^13.1.3"
  }
}
```

**Step 2: Create Express server with middleware**

`src/index.js`: Express app with helmet, CORS, rate limiting, pino-http logging, health endpoint. Mirror Sammy's index.js structure.

**Step 3: Create Firebase Admin service**

`src/services/firebase.js`: Initialize Firebase Admin SDK from `FIREBASE_SERVICE_ACCOUNT` env var. Export `admin`, `db`, `auth`.

**Step 4: Create auth middleware**

`src/controllers/auth-controller.js`: `verifyToken` middleware that extracts Bearer token, verifies with Firebase Admin, attaches `req.user`.

**Step 5: Create route skeleton**

`src/routes/api.js`: Health endpoint (public), then `verifyToken` middleware, then placeholder routes for user, plans, workouts, stats, chat, exercises.

**Step 6: Create supporting files**

- `src/logger.js`: Pino logger with pino-pretty for local dev
- `backend/.env.example`: PORT, FIREBASE_SERVICE_ACCOUNT, GEMINI_API_KEY, NODE_ENV, ALLOWED_ORIGINS
- `backend/Dockerfile`: Node 22-slim, port 8080
- `backend/eslint.config.js`: ESLint flat config for Node.js

**Step 7: Install deps and verify**

```bash
cd backend && npm install
npm run dev  # Should start on port 4001
# GET http://localhost:4001/api/health → { status: "ok", version: "0.1.0" }
```

**Step 8: Commit**

```bash
git add backend/
git commit -m "feat: backend foundation with express, firebase, auth middleware"
```

---

## Task 3: Frontend Foundation

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/eslint.config.js`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/utils/cn.js`
- Create: `frontend/.env.local.template`

**Step 1: Create frontend/package.json**

```json
{
  "name": "gimli-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint ."
  },
  "dependencies": {
    "axios": "^1.13.2",
    "date-fns": "^4.1.0",
    "firebase": "^12.7.0",
    "lucide-react": "^0.562.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^7.11.0",
    "recharts": "^3.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.2.0",
    "@eslint/js": "^9.39.1",
    "tailwindcss": "^4.1.18",
    "vite": "^7.3.0"
  }
}
```

**Step 2: Create Vite config**

`vite.config.js`: React plugin, define `__APP_VERSION__` and `__BUILD_TIMESTAMP__`, dev server on port 4000 with proxy `/api` to `localhost:4001`.

**Step 3: Create Tailwind + PostCSS config**

- `postcss.config.js`: `@tailwindcss/postcss` + autoprefixer
- `tailwind.config.js`: Content paths, custom colors (Gimli theme - earthy/forge colors), Outfit font

**Step 4: Create index.html and entry point**

- `index.html`: Standard Vite template, viewport meta for mobile, title "Gimli"
- `src/main.jsx`: StrictMode + BrowserRouter + App
- `src/index.css`: Tailwind imports, CSS custom properties for theming, safe area insets, base styles

**Step 5: Create App.jsx with router skeleton**

```jsx
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Gimli - Coming Soon</div>} />
    </Routes>
  )
}

export default App
```

**Step 6: Create utility files**

- `src/utils/cn.js`: Class name merge utility
- `frontend/.env.local.template`: VITE_API_URL, VITE_FIREBASE_CONFIG
- `frontend/eslint.config.js`: Flat config with react-hooks and react-refresh plugins

**Step 7: Install deps and verify**

```bash
cd frontend && npm install
npm run dev  # Should open on http://localhost:4000
```

**Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: frontend foundation with react, vite, tailwind"
```

---

## Task 4: Firebase Setup

**Files:**
- Create: `.firebaserc`
- Create: `firebase.json`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`

**Step 1: Create Firebase project config**

`.firebaserc`: Project ID and hosting targets (dev, prod).

`firebase.json`: Hosting config (serve from `frontend/dist`, SPA rewrites, cache headers), Firestore rules and indexes references.

**Step 2: Create Firestore security rules**

`firestore.rules`:
- Users can only read/write their own document at `/users/{userId}`
- Subcollections (plans, workouts, chat_sessions) inherit user isolation
- Global `exercises` collection is read-only for authenticated users
- All access requires authentication
- Field validation for required fields

**Step 3: Create Firestore indexes**

`firestore.indexes.json`: Composite indexes for:
- `workouts` ordered by date (for listing)
- `exercises` searchable by name, category, muscle group

**Step 4: Commit**

```bash
git add .firebaserc firebase.json firestore.rules firestore.indexes.json
git commit -m "feat: firebase config with firestore rules and indexes"
```

---

## Task 5: Authentication

**Files:**
- Create: `frontend/src/contexts/AuthContext.jsx`
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/api/firebase.js`
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create Firebase client config**

`src/api/firebase.js`: Initialize Firebase app from `VITE_FIREBASE_CONFIG` env var. Export `auth` instance.

**Step 2: Create AuthContext**

`src/contexts/AuthContext.jsx`: React context wrapping Firebase `onAuthStateChanged`. Provides `user`, `loading`, `signIn`, `signUp`, `signOut`. Use Google sign-in as primary method + email/password.

**Step 3: Create API client**

`src/api/client.js`: Axios instance with baseURL from env. Request interceptor that auto-attaches Firebase ID token as Bearer header.

**Step 4: Create Login page**

`src/pages/Login.jsx`: Gimli-themed login page with Google sign-in button and email/password form. Redirect to home on success.

**Step 5: Create ProtectedRoute**

`src/components/ProtectedRoute.jsx`: Wrapper that redirects to `/login` if not authenticated, shows loading spinner while checking.

**Step 6: Update App.jsx**

Wrap routes in AuthProvider. Add Login route (public) and ProtectedRoute wrapper for all other routes.

**Step 7: Test auth flow**

```bash
# Start both servers
npm run dev:local
# Navigate to http://localhost:4000
# Should redirect to /login
# Sign in → should redirect to /
# API calls should include Bearer token
```

**Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: authentication with firebase auth and protected routes"
```

---

## Task 6: App Layout & Navigation

**Files:**
- Create: `frontend/src/components/layout/Layout.jsx`
- Create: `frontend/src/components/layout/TopBar.jsx`
- Create: `frontend/src/components/layout/BottomNav.jsx`
- Create: `frontend/src/components/layout/MobileContainer.jsx`
- Create: `frontend/src/components/layout/ProfileMenu.jsx`
- Create: `frontend/src/pages/Today.jsx` (placeholder)
- Create: `frontend/src/pages/Log.jsx` (placeholder)
- Create: `frontend/src/pages/Progress.jsx` (placeholder)
- Create: `frontend/src/pages/Profile.jsx` (placeholder)
- Modify: `frontend/src/App.jsx`

**Step 1: Create MobileContainer**

Full-height container with safe area padding for Capacitor. Handles mobile viewport quirks.

**Step 2: Create TopBar**

App title "Gimli" on the left. Profile pic / menu button on the right. ProfileMenu component opens as a dropdown with links to profile/settings and sign out.

**Step 3: Create BottomNav**

Three tabs: Today (home icon), Log (dumbbell icon), Progress (chart icon). Uses react-router-dom NavLink for active state. Fixed to bottom with safe area padding.

**Step 4: Create Layout**

Combines MobileContainer + TopBar + Outlet (for page content) + BottomNav. Uses `<Outlet />` from react-router-dom for nested routes.

**Step 5: Create placeholder pages**

Today, Log, Progress, Profile - each with a simple header and placeholder content so navigation works.

**Step 6: Update App.jsx routes**

```jsx
<Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route index element={<Today />} />
  <Route path="log" element={<Log />} />
  <Route path="progress" element={<Progress />} />
  <Route path="profile" element={<Profile />} />
</Route>
```

**Step 7: Verify navigation**

```bash
npm run dev:local
# All three tabs navigate correctly
# Profile menu opens from top-right
# Active tab is highlighted
```

**Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: app layout with bottom nav, top bar, and profile menu"
```

---

## Task 7: User Profile Backend + Frontend

**Files:**
- Create: `backend/src/controllers/user-controller.js`
- Create: `backend/src/services/user-service.js`
- Create: `frontend/src/api/services.js`
- Create: `frontend/src/contexts/UserProfileContext.jsx`
- Modify: `backend/src/routes/api.js`
- Modify: `frontend/src/pages/Profile.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create user service (backend)**

`services/user-service.js`: Functions to create/update user profile in Firestore `users` collection, get user profile. On first create, set default values for streak, preferences.

**Step 2: Create user controller (backend)**

`controllers/user-controller.js`:
- `POST /api/user/profile` - Create or update profile (goals, experience level, available days, bodyweight, units)
- `GET /api/user/profile` - Get profile with streak info

**Step 3: Wire up routes**

Add user routes to `api.js`.

**Step 4: Create API services (frontend)**

`src/api/services.js`: Wrapper functions using the Axios client for all API calls. Start with `getProfile()`, `updateProfile()`.

**Step 5: Create UserProfileContext**

Loads user profile on auth, provides profile data and update function to all components.

**Step 6: Build Profile page**

Form with: display name, experience level (beginner/intermediate/advanced dropdown), goals (text), available training days (day picker), bodyweight, units toggle (lbs/kg), notification preferences.

**Step 7: Add onboarding check**

If user has no profile on first login, redirect to Profile page with a "Welcome, warrior! Tell me about yourself" Gimli-flavored onboarding prompt.

**Step 8: Test**

```bash
npm run dev:local
# Sign in → if new user, redirected to profile setup
# Fill in profile → saved to Firestore
# Navigate away and back → profile loads correctly
```

**Step 9: Commit**

```bash
git add backend/src/ frontend/src/
git commit -m "feat: user profile CRUD with onboarding flow"
```

---

## Task 8: Exercise Library

**Files:**
- Create: `backend/src/controllers/exercise-controller.js`
- Create: `backend/src/services/exercise-service.js`
- Create: `backend/scripts/seed-exercises.js`
- Modify: `backend/src/routes/api.js`

**Step 1: Create exercise service (backend)**

`services/exercise-service.js`: Query exercises from Firestore `exercises` collection. Support search by name, filter by category, muscle group, equipment.

**Step 2: Create exercise controller**

`controllers/exercise-controller.js`:
- `GET /api/exercises` - List/search exercises. Query params: `q` (search), `category`, `muscleGroup`, `equipment`

**Step 3: Create seed script**

`scripts/seed-exercises.js`: Populates Firestore with ~50-60 common exercises covering:
- Compound lifts: bench press, squat, deadlift, overhead press, barbell row, pull-up
- Isolation: bicep curl, tricep extension, lateral raise, leg curl, leg extension, etc.
- Cardio: running, cycling, rowing, elliptical
- Each with: name, category, muscleGroups (primary/secondary), equipment, youtubeLinks (1-2 curated links each)

**Step 4: Wire up routes and seed data**

```bash
node backend/scripts/seed-exercises.js
# GET http://localhost:4001/api/exercises?q=bench → returns bench press, incline bench, etc.
```

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat: exercise library with search and seed data"
```

---

## Task 9: Workout Plans - Backend

**Files:**
- Create: `backend/src/controllers/plan-controller.js`
- Create: `backend/src/services/plan-service.js`
- Create: `backend/src/services/plan-templates.js`
- Create: `backend/src/services/ai-service.js`
- Modify: `backend/src/routes/api.js`

**Step 1: Create plan templates**

`services/plan-templates.js`: Define 4-5 proven templates as structured data:
- **PPL (Push/Pull/Legs)**: 6 days/week
- **Upper/Lower**: 4 days/week
- **Full Body**: 3 days/week
- **5/3/1**: 4 days/week
- **Bro Split**: 5 days/week

Each template defines: days with exercise slots (exercise name, target sets, target reps, progression type). These are the starting point that Gimli customizes.

**Step 2: Create AI service**

`services/ai-service.js`: Initialize Gemini 3.0 client. Core function: `generatePlan(template, userProfile)` - sends template + user profile (experience, goals, available days) to Gemini with system prompt instructing it to customize the template. Returns structured plan JSON.

Also: `generateWorkoutSummary(workoutData)`, `generateInsights(recentWorkouts)`, `chat(messages, context)` - all Gimli-personality functions. System prompt defines Gimli's character.

**Step 3: Create plan service**

`services/plan-service.js`: CRUD for plans in Firestore `users/{uid}/plans` subcollection. `generatePlan()` calls AI service, saves result. `getActivePlan()`, `updatePlan()`.

**Step 4: Create plan controller**

`controllers/plan-controller.js`:
- `POST /api/plans/generate` - Body: `{ templateId, customizations }` → Gimli generates personalized plan
- `GET /api/plans/active` - Get active plan
- `GET /api/plans/:id` - Get specific plan
- `PUT /api/plans/:id` - Update plan

**Step 5: Wire up routes and test**

```bash
# POST /api/plans/generate { templateId: "ppl" }
# → Returns full personalized plan with Gimli flavor
```

**Step 6: Commit**

```bash
git add backend/src/
git commit -m "feat: workout plan generation with templates and gimli AI"
```

---

## Task 10: Workout Plans - Frontend

**Files:**
- Create: `frontend/src/pages/PlanSetup.jsx`
- Create: `frontend/src/components/plan/TemplatePicker.jsx`
- Create: `frontend/src/components/plan/PlanView.jsx`
- Modify: `frontend/src/api/services.js`
- Modify: `frontend/src/App.jsx`

**Step 1: Add plan API services**

Add to `services.js`: `generatePlan()`, `getActivePlan()`, `getPlan()`, `updatePlan()`.

**Step 2: Create TemplatePicker component**

Card-based selection of templates. Each card shows: name, days/week, description, who it's for. Gimli's recommendation based on user profile highlighted.

**Step 3: Create PlanSetup page**

Flow: TemplatePicker → Gimli generates plan (loading with Gimli quote) → PlanView showing the full weekly schedule → Confirm to activate.

**Step 4: Create PlanView component**

Displays plan as a weekly schedule. Each day shows exercises with sets x reps x weight targets. Collapsible day sections.

**Step 5: Add plan setup to onboarding**

After profile setup, if no active plan, prompt user to create one. "Now let's forge your battle plan!"

**Step 6: Test full flow**

```bash
npm run dev:local
# New user → Profile setup → Plan setup → Select template → Gimli generates → Activate
```

**Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: workout plan selection and generation UI"
```

---

## Task 11: Workout Logging - Backend

**Files:**
- Create: `backend/src/controllers/workout-controller.js`
- Create: `backend/src/services/workout-service.js`
- Modify: `backend/src/routes/api.js`
- Modify: `backend/src/services/ai-service.js`

**Step 1: Create workout service**

`services/workout-service.js`:
- `logWorkout(uid, workoutData)` - Save workout to `users/{uid}/workouts`. Calculate volume, detect PRs, update streak.
- `getWorkouts(uid, options)` - List workouts with pagination and date filtering.
- `getTodaysWorkout(uid)` - Get today's planned workout from active plan. Cross-reference with plan schedule and current day.
- `updateWorkout(uid, workoutId, data)` - Update existing workout.
- `deleteWorkout(uid, workoutId)` - Delete workout, recalculate streak if needed.

**Step 2: Add PR detection**

Compare each exercise's weight/reps to historical best. Flag as PR in the workout record.

**Step 3: Add streak logic**

On workout save: check if previous workout date is yesterday or today (maintaining streak). Update user's streak count and last workout date.

**Step 4: Add Gimli workout summary**

After saving workout, call AI service to generate a Gimli-flavored summary. Include PRs, total volume, comparison to last session.

**Step 5: Create workout controller**

Wire up all endpoints:
- `POST /api/workouts`
- `PUT /api/workouts/:id`
- `DELETE /api/workouts/:id`
- `GET /api/workouts`
- `GET /api/workouts/today`

**Step 6: Test**

```bash
# POST /api/workouts with exercise data → saves, detects PRs, updates streak
# GET /api/workouts/today → returns planned exercises for today
```

**Step 7: Commit**

```bash
git add backend/src/
git commit -m "feat: workout logging with PR detection and streak tracking"
```

---

## Task 12: Today Screen + Workout Session

**Files:**
- Create: `frontend/src/components/workout/WorkoutSession.jsx`
- Create: `frontend/src/components/workout/ExerciseCard.jsx`
- Create: `frontend/src/components/workout/SetRow.jsx`
- Create: `frontend/src/components/workout/RestTimer.jsx`
- Create: `frontend/src/components/workout/WorkoutSummary.jsx`
- Modify: `frontend/src/pages/Today.jsx`
- Modify: `frontend/src/api/services.js`

**Step 1: Add workout API services**

Add to `services.js`: `getTodaysWorkout()`, `logWorkout()`, `updateWorkout()`, `deleteWorkout()`, `getWorkouts()`.

**Step 2: Build Today page**

- Gimli's daily greeting (based on streak, day of week)
- Today's planned workout preview (exercises with target sets/reps/weight)
- "Start Workout" button
- Current streak display
- If rest day: Gimli tells you to rest ("Even dwarves need rest between battles")

**Step 3: Build WorkoutSession**

Full-screen workout mode:
- Running timer at the top
- Current exercise with ExerciseCard
- Previous performance shown for comparison
- Navigation between exercises (next/prev/skip)
- "Finish Workout" button

**Step 4: Build ExerciseCard + SetRow**

ExerciseCard: Exercise name, target sets/reps, muscle groups. SetRow: Individual set with reps input, weight input, complete checkbox. Pre-filled from plan, editable.

**Step 5: Build RestTimer**

Countdown timer that auto-starts after completing a set. Configurable duration (default 90s). Can be dismissed.

**Step 6: Build WorkoutSummary**

Post-workout overlay: total duration, total volume, PRs hit (highlighted), Gimli's AI summary. "Save Workout" button.

**Step 7: Test full workout flow**

```bash
npm run dev:local
# Today tab → shows planned workout → Start → complete sets → rest timer → finish → summary → saved
```

**Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: today screen with guided workout session flow"
```

---

## Task 13: Manual Workout Logging (Log Tab)

**Files:**
- Create: `frontend/src/components/log/ExercisePicker.jsx`
- Create: `frontend/src/components/log/ManualLogForm.jsx`
- Create: `frontend/src/components/log/WorkoutHistoryList.jsx`
- Create: `frontend/src/components/log/WorkoutHistoryItem.jsx`
- Modify: `frontend/src/pages/Log.jsx`
- Modify: `frontend/src/api/services.js`

**Step 1: Add exercise API services**

Add to `services.js`: `searchExercises(query, filters)`.

**Step 2: Build ExercisePicker**

Searchable exercise list with filters (category, muscle group, equipment). Returns selected exercise to parent.

**Step 3: Build ManualLogForm**

Date picker, add exercises via ExercisePicker, enter sets/reps/weight for each. Add cardio entries (type, duration, distance). Notes field. Save button.

**Step 4: Build WorkoutHistoryList**

Paginated list of past workouts sorted by date (newest first). Each WorkoutHistoryItem shows: date, day name, exercise count, total volume, PRs, Gimli summary snippet. Tap to expand full detail.

**Step 5: Build Log page**

Two sections: "Log Workout" button at top → opens ManualLogForm. Below: WorkoutHistoryList showing past workouts.

**Step 6: Test**

```bash
npm run dev:local
# Log tab → tap Log Workout → search exercises → add sets → save
# Workout appears in history list
```

**Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: manual workout logging and workout history"
```

---

## Task 14: Chat with Gimli - Backend

**Files:**
- Create: `backend/src/controllers/chat-controller.js`
- Create: `backend/src/services/chat-service.js`
- Modify: `backend/src/services/ai-service.js`
- Modify: `backend/src/routes/api.js`

**Step 1: Define Gimli's system prompt**

In `ai-service.js`, create the master system prompt:
- Character: Gimli, dwarf-inspired gym companion. Committed but not cartoonish.
- Knowledge: Experienced strength coach with real training knowledge.
- Tone: Enthusiastic, loyal, no-nonsense. Dwarf flavor is natural ("forge," "iron," "battle").
- Context awareness: System prompt includes user profile, active plan, recent workouts, current streak.
- Capabilities: Can answer training questions, suggest plan modifications, provide exercise instructions, motivate.

**Step 2: Create chat service**

`services/chat-service.js`:
- `sendMessage(uid, message)` - Build context (profile, plan, recent workouts), prepend system prompt, send to Gemini, save to Firestore `users/{uid}/chat_sessions`.
- `getHistory(uid, limit)` - Retrieve chat history.
- `clearHistory(uid)` - Delete chat history.

**Step 3: Add conversational logging**

Parse user messages for workout logging intent ("I did 3x8 bench at 185"). Use Gemini function calling to detect exercise logging and create structured workout data. Confirm with user before saving.

**Step 4: Create chat controller**

- `POST /api/chat` - Body: `{ message, context: { screen } }` → Returns Gimli's response
- `GET /api/chat/history` - Query param: `limit`
- `DELETE /api/chat/history` - Clear all

**Step 5: Wire up routes with rate limiting**

Chat endpoint gets stricter rate limit (10 req/minute) to manage AI costs.

**Step 6: Test**

```bash
# POST /api/chat { message: "What should I do today?" }
# → Gimli responds with today's plan in character
```

**Step 7: Commit**

```bash
git add backend/src/
git commit -m "feat: gimli chat backend with context-aware AI responses"
```

---

## Task 15: Chat with Gimli - Frontend

**Files:**
- Create: `frontend/src/components/chat/ChatOverlay.jsx`
- Create: `frontend/src/components/chat/ChatMessage.jsx`
- Create: `frontend/src/components/chat/ChatInput.jsx`
- Create: `frontend/src/components/chat/ChatFAB.jsx`
- Modify: `frontend/src/components/layout/Layout.jsx`
- Modify: `frontend/src/api/services.js`

**Step 1: Add chat API services**

Add to `services.js`: `sendChat(message, context)`, `getChatHistory(limit)`, `clearChatHistory()`.

**Step 2: Build ChatFAB**

Floating action button (bottom-right, above bottom nav). Axe or speech bubble icon. Tap to open ChatOverlay.

**Step 3: Build ChatOverlay**

Full-screen or slide-up drawer over current page. Header with "Gimli" title and close button. Scrollable message list. Input at bottom with safe area padding.

**Step 4: Build ChatMessage**

Gimli messages on left with dwarf avatar. User messages on right. Markdown rendering for Gimli's responses. Timestamp display.

**Step 5: Build ChatInput**

Text input with send button. Expands for multi-line. Send on Enter (or button tap on mobile).

**Step 6: Add context awareness**

Pass current screen name to chat API so Gimli knows where you are. "I see you're looking at your progress..." etc.

**Step 7: Add to Layout**

ChatFAB rendered in Layout, available on all screens. ChatOverlay manages its own open/close state.

**Step 8: Test**

```bash
npm run dev:local
# Tap chat FAB from any screen → chat opens → send message → Gimli responds in character
# Close → FAB still visible → reopen → history preserved
```

**Step 9: Commit**

```bash
git add frontend/src/
git commit -m "feat: gimli chat UI with floating action button and overlay"
```

---

## Task 16: Progress & Stats - Backend

**Files:**
- Create: `backend/src/controllers/stats-controller.js`
- Create: `backend/src/services/stats-service.js`
- Modify: `backend/src/services/ai-service.js`
- Modify: `backend/src/routes/api.js`

**Step 1: Create stats service**

`services/stats-service.js`:
- `getExerciseProgress(uid, exerciseId)` - Query workouts containing this exercise, return `[{ date, maxWeight, maxReps, totalVolume }]` sorted by date.
- `getVolumeStats(uid, period)` - Weekly/monthly total volume. Optional muscle group filter.
- `getStreakData(uid)` - Current streak, longest streak, workout calendar data (dates with workout count).

**Step 2: Add Gimli insights generation**

In `ai-service.js`: `generateInsights(recentWorkouts, profile)` - Analyze last 2-4 weeks of data, identify trends, PRs, gaps. Return 2-3 Gimli-flavored insight strings.

**Step 3: Create stats controller**

- `GET /api/stats/exercise/:id` - Exercise progress data
- `GET /api/stats/volume` - Query params: `period` (week/month), `muscleGroup`
- `GET /api/stats/streak` - Streak and calendar data
- `GET /api/stats/insights` - Gimli-generated insights (cached, regenerated daily or on demand)

**Step 4: Wire up routes and test**

```bash
# GET /api/stats/exercise/bench-press → weight over time data
# GET /api/stats/insights → ["Your bench has climbed 20lbs...", ...]
```

**Step 5: Commit**

```bash
git add backend/src/
git commit -m "feat: progress stats and gimli insights API"
```

---

## Task 17: Progress & Stats - Frontend

**Files:**
- Create: `frontend/src/components/progress/ExerciseChart.jsx`
- Create: `frontend/src/components/progress/VolumeChart.jsx`
- Create: `frontend/src/components/progress/StreakCalendar.jsx`
- Create: `frontend/src/components/progress/GimliInsights.jsx`
- Create: `frontend/src/components/progress/ExerciseSelector.jsx`
- Modify: `frontend/src/pages/Progress.jsx`
- Modify: `frontend/src/api/services.js`

**Step 1: Add stats API services**

Add to `services.js`: `getExerciseProgress(exerciseId)`, `getVolumeStats(period, muscleGroup)`, `getStreakData()`, `getInsights()`.

**Step 2: Build ExerciseChart**

Recharts line chart showing weight over time for selected exercise. ExerciseSelector dropdown above it (only exercises the user has logged).

**Step 3: Build VolumeChart**

Recharts bar chart showing weekly total volume. Toggle for muscle group filter.

**Step 4: Build StreakCalendar**

GitHub-style heatmap calendar. Darker = more volume that day. Current streak count displayed prominently above.

**Step 5: Build GimliInsights**

Card component at top of Progress page showing 2-3 AI-generated insights. Gimli avatar with speech bubble style. Refresh button to regenerate.

**Step 6: Assemble Progress page**

Layout: GimliInsights at top → StreakCalendar → ExerciseChart → VolumeChart. Scrollable.

**Step 7: Test**

```bash
npm run dev:local
# Log a few workouts → Progress tab shows charts with data
# Gimli insights appear with relevant commentary
```

**Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: progress charts with exercise tracking, volume, streaks, and gimli insights"
```

---

## Task 18: Capacitor + Android Setup

**Files:**
- Create: `frontend/capacitor.config.json`
- Create: `frontend/scripts/android-build.js`
- Modify: `frontend/package.json` (add android scripts)
- Modify: root `package.json` (add android/apk scripts)

**Step 1: Create Capacitor config**

```json
{
  "appId": "io.gimli.app.dev",
  "webDir": "dist",
  "appName": "Gimli (Dev)",
  "server": { "androidScheme": "https" },
  "plugins": {
    "Keyboard": { "resizeOnFullScreen": true, "style": "dark", "resize": "native" },
    "StatusBar": { "overlay": true }
  }
}
```

**Step 2: Install Capacitor dependencies**

```bash
cd frontend
npm install @capacitor/android @capacitor/app @capacitor/core @capacitor/keyboard @capacitor/status-bar
```

**Step 3: Create android build script**

`scripts/android-build.js`: Takes flavor arg (local/dev/prod), modifies capacitor.config.json with correct appId, appName, and server URL, runs build + cap sync.

**Step 4: Add npm scripts**

Frontend: `android`, `android:dev`, `android:local`
Root: Mirror scripts that cd into frontend

**Step 5: Initialize Android project**

```bash
cd frontend
npm run build
npx cap add android
npx cap sync android
npx cap open android  # Opens Android Studio
```

**Step 6: Update main.jsx for Capacitor**

Add StatusBar configuration for native platform (overlay, style based on theme).

**Step 7: Commit**

```bash
git add frontend/capacitor.config.json frontend/scripts/ frontend/package.json package.json frontend/src/main.jsx
git commit -m "feat: capacitor android setup with build flavors"
```

---

## Task 19: Theme & Polish

**Files:**
- Create: `frontend/src/contexts/ThemeContext.jsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/layout/TopBar.jsx`
- Modify: various components for dark mode

**Step 1: Create ThemeContext**

Dark mode toggle. Persists preference to localStorage. Adds/removes `dark` class on document. Syncs with Capacitor StatusBar style.

**Step 2: Define Gimli color palette**

Earthy, forge-inspired theme:
- Primary: warm amber/gold (forge fire)
- Background: stone grey (light mode), dark slate (dark mode)
- Accent: deep red/copper
- Success: emerald green
- Text: warm neutrals

**Step 3: Update index.css**

CSS custom properties for both light and dark themes. Smooth transitions.

**Step 4: Add theme toggle to ProfileMenu**

Dark/light mode switch in the profile dropdown.

**Step 5: Polish all components**

Ensure consistent styling, dark mode support, loading states, error states, empty states across all pages and components.

**Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: dark mode theme with gimli-inspired color palette"
```

---

## Task 20: Final Integration & Testing

**Step 1: End-to-end flow test**

Full flow: Sign up → Onboard (profile) → Pick plan template → Gimli generates plan → Start today's workout → Complete sets → Finish → View progress → Chat with Gimli.

**Step 2: Fix any integration issues**

Address any bugs found during E2E testing.

**Step 3: Add health endpoint version info**

Ensure `/api/health` returns version, build timestamp, status.

**Step 4: Create CLAUDE.md**

Project documentation following Sammy's format: architecture, structure, environments, local dev setup, API endpoints, commands, conventions.

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final integration testing and project documentation"
```

---

## Execution Notes

- **Tasks 1-6** are foundational and must be sequential
- **Tasks 7-8** (profile + exercises) must come before tasks 9-10 (plans)
- **Tasks 9-10** (plans) must come before tasks 11-12 (workouts/today)
- **Tasks 14-15** (chat) can run in parallel with tasks 11-13 (workout logging)
- **Tasks 16-17** (progress) depend on tasks 11-13 (need workout data)
- **Task 18** (Capacitor) can happen anytime after task 6
- **Tasks 19-20** are final polish

**Dependency graph:**
```
1 → 2 → 3 → 4 → 5 → 6
                       ↓
                  7 → 8 → 9 → 10 → 11 → 12 → 13 → 16 → 17
                                    ↓                       ↓
                               14 → 15                     20
                       ↓
                      18 → (after 6, anytime)
                       ↓
                      19 → (after 6, anytime)
```
