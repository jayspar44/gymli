# Gimli - AI Gym Assistant Design

## Core Concept

Gimli is a chat-first workout companion with a structured tracker backbone. The app has two main surfaces: a **chat interface** where Gimli (your dwarf-flavored AI trainer) lives, and a **tracker UI** for logging, plans, and progress. Gimli's personality is committed but not over-the-top - enthusiastic dwarf gym bro who genuinely cares about your progress.

### Launch Scope (v1.0)

- Workout tracking (weightlifting + basic cardio)
- AI chat companion with Gimli personality
- Workout plans from proven templates, personalized by AI
- Progress charts with AI commentary
- Gimli as accountability partner (streaks, check-ins, motivation)

### Deferred

- Video/photo form checks (future roadmap)
- Social/buddy features (future roadmap)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS + Capacitor (Android primary) |
| Backend | Node.js + Express on Cloud Run |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| AI | Gemini 3.0 |
| Hosting | Cloud Run (backend) + Firebase Hosting (frontend) |

---

## App Structure & Navigation

**Bottom tabs (3):**
- **Today** - Current workout plan for today, quick-start button, streak counter, Gimli's daily greeting
- **Log** - Manual workout logging, exercise picker, set/rep/weight entry, workout history list
- **Progress** - Per-exercise charts (weight over time), volume trends, streak calendar, Gimli's periodic insights

**Profile (top-right menu):**
- Accessed via hamburger/3-dot/profile pic menu in the top bar
- User settings, goals, experience level, available training days, notification preferences

**Chat (floating action button):**
- Available from any screen via a persistent FAB in the bottom-right
- Opens as a full-screen overlay or slides up as a drawer
- Context-aware: if you open chat from the Today screen, Gimli knows you're looking at today's workout. From Progress, he can discuss your trends.
- This is where you ask Gimli to adjust plans, log ad-hoc exercises, ask training questions, or just chat

---

## Data Model (Firestore)

### `users` collection

| Field | Description |
|-------|-------------|
| `uid` | Firebase Auth UID |
| `displayName`, `email`, `photoURL` | Basic identity |
| `profile` | Goals, experience level (beginner/intermediate/advanced), available days, bodyweight, units preference (lbs/kg) |
| `currentPlanId` | Reference to active workout plan |
| `streak` | Current streak count, last workout date |
| `createdAt`, `updatedAt` | Timestamps |

### `plans` subcollection (under user)

| Field | Description |
|-------|-------------|
| `planId`, `name` | Identity |
| `templateBase` | Source template (PPL, Upper/Lower, 5/3/1, etc.) |
| `schedule` | Array of workout days, each containing ordered exercise list with target sets/reps/weight |
| `progressionScheme` | How weights increase (linear, percentage, RPE-based) |
| `startDate`, `status` | Active/completed/paused |
| `createdBy` | "gimli" or "user" |

### `workouts` subcollection (under user)

| Field | Description |
|-------|-------------|
| `workoutId`, `date` | Identity |
| `planId`, `dayName` | Plan reference (e.g., "Push Day A") |
| `exercises` | Array of `{ exerciseId, name, sets: [{ reps, weight, completed, rpe }] }` |
| `cardio` | Array of `{ type, duration, distance }` |
| `duration`, `notes` | Session metadata |
| `gimliSummary` | AI-generated workout recap |

### `exercises` collection (global, shared)

| Field | Description |
|-------|-------------|
| `exerciseId`, `name` | Identity |
| `category` | Compound/isolation/cardio |
| `muscleGroups` | Primary and secondary |
| `equipment` | Barbell/dumbbell/machine/bodyweight/cardio |
| `youtubeLinks` | Curated instruction video URLs |

### `chat_sessions` subcollection (under user)

Message history with role/content/timestamp (same pattern as Sammy).

---

## API Endpoints

All endpoints (except health) require Firebase Auth token in `Authorization: Bearer <token>` header.

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/profile` | Create/update user profile |
| GET | `/api/user/profile` | Get user profile + streak info |

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plans/generate` | Gimli generates a plan from template + user profile |
| GET | `/api/plans/active` | Get current active plan |
| GET | `/api/plans/:id` | Get specific plan |
| PUT | `/api/plans/:id` | Update plan (manual edits or Gimli adjustments) |

### Workouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workouts` | Log a completed workout |
| PUT | `/api/workouts/:id` | Update a workout |
| DELETE | `/api/workouts/:id` | Delete a workout |
| GET | `/api/workouts` | List workouts (paginated, date filtered) |
| GET | `/api/workouts/today` | Get today's planned workout from active plan |

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/exercise/:id` | Weight-over-time data for a specific exercise |
| GET | `/api/stats/volume` | Volume trends (weekly/monthly) |
| GET | `/api/stats/streak` | Streak and calendar data |
| GET | `/api/stats/insights` | Gimli-generated progress commentary |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to Gimli |
| GET | `/api/chat/history` | Get chat history |
| DELETE | `/api/chat/history` | Clear chat history |

### Exercises

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exercises` | Search/list exercise library |

---

## Gimli's AI Personality & Behavior

### Personality Guidelines

- Enthusiastic, loyal, no-nonsense training partner
- Dwarf references feel natural, not forced ("forge," "iron," "battle," "fellowship")
- Knows when to push and when to back off - missed a workout? Encouraging, not guilt-tripping
- Genuinely knowledgeable about training - the character is the wrapper, the advice is real
- Short, punchy responses during workouts. Longer and more thoughtful for plan discussions or progress reviews

### Context-Aware Behavior

| Context | Gimli's behavior |
|---------|-----------------|
| Start of day | Greeting + today's workout preview. Tone adjusts based on streak |
| During workout | Brief confirmations, form cues, motivation. Doesn't ramble between sets |
| Post-workout | Summary, highlights (PRs, volume milestones), what's coming next |
| Missed workout | Check-in next app open. Supportive, not passive-aggressive |
| Progress milestones | Celebrates PRs, streak milestones, consistency |

### Chat Capabilities

- Log exercises conversationally ("I did 5x5 squats at 225")
- Adjust today's plan ("Swap bench for dumbbell press")
- Ask training questions ("How wide should my squat stance be?")
- Request plan changes ("Add a third leg day")
- Get exercise instructions (text explanation + YouTube link from exercise library)

---

## Workout Session Flow

### Starting a Workout

1. Open app -> Today screen shows planned workout with Gimli's greeting
2. Tap "Start Workout" -> timer begins, first exercise displayed
3. Each exercise shows: name, target sets/reps/weight (pre-filled from plan), previous performance for comparison

### During a Workout

1. Complete a set -> tap to confirm, adjust reps/weight if different from plan
2. Rest timer starts automatically between sets (configurable duration)
3. Move to next exercise when all sets done, or skip/reorder as needed
4. Can add unplanned exercises on the fly
5. Chat FAB available for quick questions or swaps

### Finishing a Workout

1. Tap "Finish Workout" -> total duration logged
2. Gimli gives a session summary: total volume, any PRs hit, comparison to last time
3. Workout saved to Firestore, streak updated, progress charts refreshed

### Manual Logging

1. Go to Log tab -> tap "Log Workout"
2. Pick date, search/select exercises from library
3. Enter sets/reps/weight manually
4. Save -> same post-workout flow minus the live Gimli commentary

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| App closes mid-workout | Session saved locally, resumed on reopen |
| Skip an exercise | Marked as skipped, Gimli might ask why in post-workout |
| Partial workout | Still counts for streak, Gimli acknowledges ("Some iron is better than no iron") |

---

## Progress & Insights

### Charts (Progress tab)

- **Exercise progress**: Line chart per exercise showing weight over time. Tap to select exercise from ones you've performed
- **Volume trends**: Bar chart showing total weekly volume (sets x reps x weight). Filterable by muscle group
- **Streak calendar**: GitHub-style heatmap grid showing workout days. Current streak prominently displayed

### Gimli's Insights

Triggered when opening the Progress tab or after workouts accumulate. Generated server-side by passing recent workout data to Gemini with an insights prompt.

Examples:
- "Your bench has jumped 15lbs in the last month. The forge is hot!"
- "You've been skipping hamstring work, lad. Your legs need balance."
- "Three weeks straight without missing a day. That's dwarf-level stubbornness. I respect it."

### Notifications & Accountability

| Notification | Timing |
|-------------|--------|
| Workout reminder | Push notification on scheduled training days (configurable time) |
| Streak at risk | Evening notification if training day and no workout logged |
| Weekly recap | End of week summary via push notification |

All notifications written in Gimli's voice. Tone/frequency configurable in profile settings.
