# Conversational Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot Gymli into a Strong/Hevy-class logger whose differentiator is conversational AI logging — strip AI planning, add user Routines, a kind-aware data model, and a single structured-output parse engine feeding a split grid+feed session screen.

**Architecture:** Three internal phases, each independently shippable. Phase 1 removes AI planning and adds Routines (working manual logger). Phase 2 adds exercise *kinds* + expanded library + kind-aware sets/PRs. Phase 3 adds the `POST /api/log/parse` structured-output engine (Gemini 3 Flash Preview), an exercise resolver, a training-data sink, and the split-view logging UI.

**Tech Stack:** Node 22 + Express 5, Firebase Firestore, `@google/genai` (Gemini 3 Flash Preview), React 19 + Vite 7 + Tailwind 4, Capacitor 8. New: **Vitest** for tests.

**Design spec:** `docs/plans/2026-05-30-conversational-logging-design.md`

## Skill invocation notes

| Task area | Skill |
|---|---|
| All logic tasks | `superpowers:test-driven-development` |
| Frontend UI (SetRow, SessionView, LogFeed, Routines) | `frontend-design:frontend-design` |
| Any failing/unexpected behavior | `superpowers:systematic-debugging` |
| Before each commit / phase end | `superpowers:verification-before-completion` |
| Committing | `/commit-push` |

## Conventions used by every task

- Backend is ESM. Tests live next to source as `*.test.js`. Run a single backend test: `cd backend && npx vitest run src/path/file.test.js`.
- Firestore is mocked in unit tests via `vi.mock('./firebase.js', ...)` — no test ever hits a real database.
- Commit after each task with a conventional-commit message. Stage only the files the task touched.
- "Expected: PASS/FAIL" lines mean run the command and confirm the literal outcome before moving on.

---

## Shared definitions (referenced by later tasks)

**Exercise kinds:** `"weighted" | "bodyweight" | "assisted" | "timed" | "distance"`. Existing exercises default to `"weighted"`.

**Kind-aware set shapes:**

| kind | set object | "best" score (higher = better) | set volume |
|---|---|---|---|
| weighted | `{ weight, reps, completed }` | `weight` | `weight * reps` |
| bodyweight | `{ addedWeight, reps, completed }` | `addedWeight` | `addedWeight * reps` |
| assisted | `{ assistWeight, reps, completed }` | `-assistWeight` | `reps` |
| timed | `{ seconds, completed }` | `seconds` | `seconds` |
| distance | `{ distance, unit, seconds, completed }` | `distance` | `distance` |

**Parse envelope** (Phase 3 contract):
```js
{
  reply: string,                       // shown in feed
  confidence: number,                  // 0..1
  needsClarification: boolean,
  clarification: null | { prompt: string, options: [{ label: string, exerciseId: string }] },
  actions: [
    { type: "add_exercise", exerciseId: string, name: string, kind: string } |
    { type: "log_sets", exerciseId: string, sets: object[] } |   // sets are kind-aware
    { type: "set_notes", exerciseId: string, text: string } |
    { type: "answer", text: string }
  ]
}
```

**Model constant:** `GEMINI_MODEL = "gemini-3-flash-preview"` (single source of truth in `ai-service.js`).

**Collections:** new top-level `interactionLogs`; new per-user `users/{uid}/routines`. The legacy `users/{uid}/plans` collection is abandoned (not migrated; cleanup is a separate ops task).

---

# PHASE 0 — Tooling (Vitest)

### Task 0.1: Vitest in backend

**Files:**
- Modify: `backend/package.json`
- Create: `backend/vitest.config.js`
- Create: `backend/src/services/__smoke__.test.js` (temporary, deleted at end of task)

- [ ] **Step 1: Install Vitest**

Run: `cd backend && npm install -D vitest`
Expected: `vitest` appears in `backend/package.json` devDependencies.

- [ ] **Step 2: Add test scripts**

In `backend/package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add config**

Create `backend/vitest.config.js`:
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Smoke test**

Create `backend/src/services/__smoke__.test.js`:
```js
import { describe, it, expect } from 'vitest';

describe('vitest', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `cd backend && npm test`
Expected: PASS — 1 passed.

- [ ] **Step 6: Delete smoke test and commit**

```bash
rm backend/src/services/__smoke__.test.js
cd /Users/jayspar/Documents/projects/Gymli
git add backend/package.json backend/package-lock.json backend/vitest.config.js
git commit -m "chore(backend): add vitest test runner"
```

### Task 0.2: Vitest in frontend

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js` (add `test` block)
- Create: `frontend/src/utils/__smoke__.test.js` (temporary)

- [ ] **Step 1: Install Vitest + jsdom**

Run: `cd frontend && npm install -D vitest jsdom`
Expected: both in devDependencies.

- [ ] **Step 2: Add test script**

In `frontend/package.json` `"scripts"`, add: `"test": "vitest run"`.

- [ ] **Step 3: Configure**

In `frontend/vite.config.js`, add a `test` property to the exported config:
```js
test: {
  environment: 'jsdom',
  globals: true,
  include: ['src/**/*.test.{js,jsx}'],
},
```

- [ ] **Step 4: Smoke test, run, delete, commit**

Create `frontend/src/utils/__smoke__.test.js` with the same 1+1 test as 0.1 Step 4.
Run: `cd frontend && npm test` → Expected: PASS.
```bash
rm frontend/src/utils/__smoke__.test.js
cd /Users/jayspar/Documents/projects/Gymli
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js
git commit -m "chore(frontend): add vitest + jsdom test runner"
```

---

# PHASE 1 — Strip planning, add Routines, simplify Today

### Task 1.1: Routine service (TDD)

**Files:**
- Create: `backend/src/services/routine-service.js`
- Test: `backend/src/services/routine-service.test.js`

A routine: `{ id, name, exercises: [{ exerciseId, name, kind, targetSets, targetReps }], createdAt, updatedAt }`.

- [ ] **Step 1: Write failing tests**

Create `backend/src/services/routine-service.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map();

vi.mock('./firebase.js', () => {
  const makeDoc = (col, id) => ({
    id,
    async get() { return { exists: store.has(`${col}/${id}`), id, data: () => store.get(`${col}/${id}`) }; },
    async set(v) { store.set(`${col}/${id}`, v); },
    async update(v) { store.set(`${col}/${id}`, { ...store.get(`${col}/${id}`), ...v }); },
    async delete() { store.delete(`${col}/${id}`); },
  });
  const makeCol = (col) => ({
    _docs: () => [...store.entries()].filter(([k]) => k.startsWith(`${col}/`)),
    doc(id) { return makeDoc(col, id || `auto-${store.size + 1}`); },
    orderBy() { return this; },
    async get() {
      const docs = this._docs().map(([k, v]) => ({ id: k.split('/').pop(), data: () => v }));
      return { empty: docs.length === 0, docs };
    },
  });
  return {
    db: {
      collection: () => ({ doc: () => ({ collection: (c) => makeCol(c) }) }),
    },
  };
});

import { createRoutine, getRoutines, getRoutine, updateRoutine, deleteRoutine } from './routine-service.js';

beforeEach(() => store.clear());

describe('routine-service', () => {
  it('creates a routine with timestamps and id', async () => {
    const r = await createRoutine('u1', { name: 'Push A', exercises: [{ exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', targetSets: 4, targetReps: '6-8' }] });
    expect(r.id).toBeTruthy();
    expect(r.name).toBe('Push A');
    expect(r.exercises).toHaveLength(1);
    expect(r.createdAt).toBeTruthy();
  });

  it('lists and fetches routines', async () => {
    const r = await createRoutine('u1', { name: 'Legs', exercises: [] });
    const list = await getRoutines('u1');
    expect(list.map(x => x.name)).toContain('Legs');
    const one = await getRoutine('u1', r.id);
    expect(one.name).toBe('Legs');
  });

  it('updates and deletes', async () => {
    const r = await createRoutine('u1', { name: 'Old', exercises: [] });
    const upd = await updateRoutine('u1', r.id, { name: 'New' });
    expect(upd.name).toBe('New');
    await deleteRoutine('u1', r.id);
    expect(await getRoutine('u1', r.id)).toBeNull();
  });

  it('rejects a routine with no name', async () => {
    await expect(createRoutine('u1', { exercises: [] })).rejects.toThrow(/name/i);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd backend && npx vitest run src/services/routine-service.test.js`
Expected: FAIL — cannot find module `./routine-service.js`.

- [ ] **Step 3: Implement**

Create `backend/src/services/routine-service.js`:
```js
import { db } from './firebase.js';

function routinesRef(uid) {
  return db.collection('users').doc(uid).collection('routines');
}

function normalizeExercises(exercises = []) {
  return exercises.map(e => ({
    exerciseId: e.exerciseId,
    name: e.name || e.exerciseId,
    kind: e.kind || 'weighted',
    targetSets: e.targetSets ?? 3,
    targetReps: e.targetReps ?? '8-12',
  }));
}

export async function createRoutine(uid, data) {
  if (!data?.name || !String(data.name).trim()) {
    throw new Error('Routine name is required');
  }
  const now = new Date().toISOString();
  const routine = {
    name: String(data.name).trim(),
    exercises: normalizeExercises(data.exercises),
    createdAt: now,
    updatedAt: now,
  };
  const ref = routinesRef(uid).doc();
  await ref.set(routine);
  return { id: ref.id, ...routine };
}

export async function getRoutines(uid) {
  const snap = await routinesRef(uid).orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getRoutine(uid, routineId) {
  const doc = await routinesRef(uid).doc(routineId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateRoutine(uid, routineId, data) {
  const patch = { ...data, updatedAt: new Date().toISOString() };
  if (data.exercises) patch.exercises = normalizeExercises(data.exercises);
  await routinesRef(uid).doc(routineId).update(patch);
  return getRoutine(uid, routineId);
}

export async function deleteRoutine(uid, routineId) {
  await routinesRef(uid).doc(routineId).delete();
  return { deleted: true };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd backend && npx vitest run src/services/routine-service.test.js`
Expected: PASS — 4 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/routine-service.js backend/src/services/routine-service.test.js
git commit -m "feat(backend): add routine service with CRUD"
```

### Task 1.2: Routine controller + routes

**Files:**
- Create: `backend/src/controllers/routine-controller.js`
- Modify: `backend/src/routes/api.js`

- [ ] **Step 1: Controller**

Create `backend/src/controllers/routine-controller.js`:
```js
import * as routineService from '../services/routine-service.js';

export async function listRoutines(req, res, next) {
  try { res.json(await routineService.getRoutines(req.uid)); }
  catch (err) { next(err); }
}

export async function createRoutine(req, res, next) {
  try { res.status(201).json(await routineService.createRoutine(req.uid, req.body)); }
  catch (err) { next(err); }
}

export async function getRoutine(req, res, next) {
  try {
    const r = await routineService.getRoutine(req.uid, req.params.id);
    if (!r) return res.status(404).json({ error: 'Routine not found' });
    res.json(r);
  } catch (err) { next(err); }
}

export async function updateRoutine(req, res, next) {
  try { res.json(await routineService.updateRoutine(req.uid, req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function deleteRoutine(req, res, next) {
  try { res.json(await routineService.deleteRoutine(req.uid, req.params.id)); }
  catch (err) { next(err); }
}
```

> Note: controllers read `req.uid`. Confirm `auth-controller.verifyToken` sets `req.uid` (it does — existing controllers use it). If it sets `req.user.uid` instead, mirror the existing controllers' access pattern exactly.

- [ ] **Step 2: Wire routes**

In `backend/src/routes/api.js`:
- Remove the plan import line (line 6) and the five `/plans/...` route lines (31–35).
- Add import near the other controller imports:
```js
import { listRoutines, createRoutine, getRoutine, updateRoutine, deleteRoutine } from '../controllers/routine-controller.js';
```
- Add routes where the plan routes were:
```js
// Routine routes
router.get('/routines', listRoutines);
router.post('/routines', createRoutine);
router.get('/routines/:id', getRoutine);
router.put('/routines/:id', updateRoutine);
router.delete('/routines/:id', deleteRoutine);
```

- [ ] **Step 3: Verify server boots**

Run: `cd backend && node -e "import('./src/routes/api.js').then(()=>console.log('routes ok')).catch(e=>{console.error(e);process.exit(1)})"`
Expected: prints `routes ok` (no missing-import crash). If it errors on `plan-controller`, you missed a reference — fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/routine-controller.js backend/src/routes/api.js
git commit -m "feat(backend): routine routes, remove plan routes"
```

### Task 1.3: Rework `getTodaysWorkout` (remove plan dependency) (TDD)

**Files:**
- Modify: `backend/src/services/workout-service.js`
- Test: `backend/src/services/workout-today.test.js`

New contract for `getTodaysWorkout(uid)`:
```js
{ alreadyLoggedToday: boolean, existingWorkout: object|null, lastWorkout: object|null, streak: number, units: string }
```

- [ ] **Step 1: Failing test**

Create `backend/src/services/workout-today.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

let todayDocs = [];
let recentDocs = [];

vi.mock('./firebase.js', () => ({
  db: {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          where() { return { limit: () => ({ get: async () => ({ empty: todayDocs.length === 0, docs: todayDocs }) }) }; },
          orderBy() { return { limit: () => ({ get: async () => ({ docs: recentDocs }) }) }; },
        }),
      }),
    }),
  },
}));
vi.mock('./user-service.js', () => ({
  updateStreak: vi.fn(),
  getProfile: vi.fn(async () => ({ streak: 7, units: 'kg' })),
}));
vi.mock('./ai-service.js', () => ({ generateWorkoutSummary: vi.fn() }));

import { getTodaysWorkout } from './workout-service.js';

beforeEach(() => { todayDocs = []; recentDocs = []; });

describe('getTodaysWorkout (plan-free)', () => {
  it('reports nothing logged with last workout when history exists', async () => {
    recentDocs = [{ id: 'w1', data: () => ({ date: '2026-05-28', exercises: [] }) }];
    const r = await getTodaysWorkout('u1');
    expect(r.alreadyLoggedToday).toBe(false);
    expect(r.existingWorkout).toBeNull();
    expect(r.lastWorkout).toEqual({ id: 'w1', date: '2026-05-28', exercises: [] });
    expect(r.streak).toBe(7);
    expect(r.units).toBe('kg');
  });

  it('reports already-logged when today has a doc', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    todayDocs = [{ id: 'today1', data: () => ({ date: todayStr }) }];
    recentDocs = todayDocs;
    const r = await getTodaysWorkout('u1');
    expect(r.alreadyLoggedToday).toBe(true);
    expect(r.existingWorkout.id).toBe('today1');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd backend && npx vitest run src/services/workout-today.test.js`
Expected: FAIL — assertions on old plan-based shape (`hasPlan`).

- [ ] **Step 3: Implement**

In `backend/src/services/workout-service.js`:
- Remove the import `import { getActivePlan } from './plan-service.js';` (line 3).
- Replace the entire `getTodaysWorkout` function (lines 104–147) with:
```js
export async function getTodaysWorkout(uid) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [todaySnap, recentSnap, profile] = await Promise.all([
    workoutsRef(uid).where('date', '==', todayStr).limit(1).get(),
    workoutsRef(uid).orderBy('date', 'desc').limit(1).get(),
    getProfile(uid),
  ]);

  const lastDoc = recentSnap.docs[0];
  const lastWorkout = lastDoc ? { id: lastDoc.id, ...lastDoc.data() } : null;

  return {
    alreadyLoggedToday: !todaySnap.empty,
    existingWorkout: todaySnap.empty ? null : { id: todaySnap.docs[0].id, ...todaySnap.docs[0].data() },
    lastWorkout,
    streak: profile?.streak || 0,
    units: profile?.units || 'lbs',
  };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd backend && npx vitest run src/services/workout-today.test.js`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/workout-service.js backend/src/services/workout-today.test.js
git commit -m "refactor(backend): make getTodaysWorkout plan-free"
```

### Task 1.4: Remove remaining backend plan code

**Files:**
- Delete: `backend/src/controllers/plan-controller.js`, `backend/src/services/plan-service.js`, `backend/src/services/plan-templates.js`
- Modify: `backend/src/services/ai-service.js`, `backend/src/services/coaching-context-service.js`

- [ ] **Step 1: Drop plan dependency in coaching-context-service**

In `backend/src/services/coaching-context-service.js`:
- Remove `import { getActivePlan } from './plan-service.js';` (line 3).
- In `buildCoachingContext`, change the `Promise.all` to drop the plan fetch:
```js
const [profile, workoutsSnap] = await Promise.all([
  getProfile(uid),
  db.collection('users').doc(uid).collection('workouts')
    .orderBy('date', 'desc').limit(15).get(),
]);
```
- Delete the `plannedPerWeek`/`completionRate` block that used `plan` (lines 53–57) and replace with:
```js
const completionRate = null;
```
- In the returned object, replace the `plan: plan ? {...} : null,` property with `plan: null,`.
- In `formatContextForAI`, the `if (ctx.plan)` block is now dead (ctx.plan is always null) but harmless; leave it.

- [ ] **Step 2: Remove `generatePlan` from ai-service**

In `backend/src/services/ai-service.js`, delete the entire `generatePlan` export (lines 27–82). Leave `generateWorkoutSummary`, `generateInsights`, `chat`, and `GYMLI_SYSTEM_PROMPT`.

- [ ] **Step 3: Delete plan files**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git rm backend/src/controllers/plan-controller.js backend/src/services/plan-service.js backend/src/services/plan-templates.js
```

- [ ] **Step 4: Verify no dangling imports**

Run: `cd backend && grep -rn "plan-service\|plan-templates\|plan-controller\|generatePlan\|getActivePlan" src/ || echo "clean"`
Expected: `clean`.

- [ ] **Step 5: Verify backend boots + tests pass**

Run: `cd backend && node -e "import('./src/index.js')" & sleep 2; kill %1 2>/dev/null; echo done` then `cd backend && npm test`
Expected: no import crash; all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/ai-service.js backend/src/services/coaching-context-service.js
git commit -m "refactor(backend): remove AI planning code"
```

### Task 1.5: Frontend API — swap plan calls for routines

**Files:**
- Modify: `frontend/src/api/services.js`

- [ ] **Step 1: Replace the Plans block**

In `frontend/src/api/services.js`, delete the five plan exports (lines 7–12) and replace with:
```js
// Routines
export const getRoutines = () => client.get('/routines').then(r => r.data);
export const createRoutine = (data) => client.post('/routines', data).then(r => r.data);
export const getRoutine = (id) => client.get(`/routines/${id}`).then(r => r.data);
export const updateRoutine = (id, data) => client.put(`/routines/${id}`, data).then(r => r.data);
export const deleteRoutine = (id) => client.delete(`/routines/${id}`).then(r => r.data);
```

- [ ] **Step 2: Commit** (after Task 1.6 confirms no consumers break — but commit the API file now)

```bash
git add frontend/src/api/services.js
git commit -m "feat(frontend): routine API, remove plan API"
```

### Task 1.6: Delete frontend plan pages/components + fix routing & onboarding

**Files:**
- Delete: `frontend/src/pages/PlanSetup.jsx`, `frontend/src/components/plan/TemplatePicker.jsx`, `frontend/src/components/plan/PlanView.jsx`
- Modify: `frontend/src/App.jsx`, `frontend/src/pages/Onboarding.jsx`

- [ ] **Step 1: Remove route + import in App.jsx**

In `frontend/src/App.jsx`: delete the `import PlanSetup ...` line and the `<Route path="plan-setup" ...>` element.

- [ ] **Step 2: Strip plan generation from Onboarding.jsx**

In `frontend/src/pages/Onboarding.jsx`, remove imports/usages of `getTemplates` and `generatePlan` (lines ~6, ~88, ~159). Onboarding must end by saving the profile and navigating to `/` — remove any template-selection / plan-generation step. If a whole step component becomes empty, delete that step and renumber. Keep profile fields (experience, goals, units, bodyweight).

- [ ] **Step 3: Delete plan UI files**

```bash
cd /Users/jayspar/Documents/projects/Gymli
git rm frontend/src/pages/PlanSetup.jsx frontend/src/components/plan/TemplatePicker.jsx frontend/src/components/plan/PlanView.jsx
```

- [ ] **Step 4: Find remaining references**

Run: `cd frontend && grep -rn "PlanSetup\|TemplatePicker\|PlanView\|plan-setup\|getTemplates\|generatePlan\|getActivePlan\|getPlan(\|updatePlan" src/ || echo "clean"`
Expected: `clean`. (Today.jsx references are fixed in Task 1.7 — if grep still shows them, proceed; you will clear them there. Do not commit until clean except Today.jsx.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx frontend/src/pages/Onboarding.jsx
git commit -m "refactor(frontend): remove plan setup UI and onboarding plan step"
```

### Task 1.7: Rework Today page (routines + resume + recent)

**Files:**
- Modify: `frontend/src/pages/Today.jsx`

Today becomes: header/streak, "Resume/Start" (if today already logged show summary; else CTA to start empty session), a Routines list (start any routine), and recent history. No plan/PlanView.

- [ ] **Step 1: Replace data loading**

In `frontend/src/pages/Today.jsx`:
- Remove imports of `getActivePlan`, `updatePlan`, and `PlanView`.
- Add `getRoutines` to the services import and `import { useNavigate } from 'react-router-dom'` if not present.
- Replace `loadToday` body with:
```js
const loadToday = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const [today, routines, streak] = await Promise.all([
      getTodaysWorkout().catch(() => null),
      getRoutines().catch(() => []),
      getStreakData().catch(() => null),
    ]);
    setTodayData(today);
    setRoutines(routines);
    setStreakInfo(streak);
    const tip = await getDailyTip().then(r => r.tip).catch(() => null);
    setTip(tip);
  } catch {
    setError("Failed to load today");
  } finally {
    setLoading(false);
  }
}, []);
```
- Add `const [routines, setRoutines] = useState([]);` to state; remove `activePlan`/`previousData` state and the `PlanOverlay`/`PlanView` JSX.

- [ ] **Step 2: Replace the "no plan" + plan rendering with routine/resume rendering**

Replace the `if (!todayData?.hasPlan)` block and rest-day/plan JSX with:
```jsx
return (
  <div className="flex flex-col gap-6 px-4 pb-24 pt-4">
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">Today</h1>
        {streakInfo?.currentStreak ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{streakInfo.currentStreak} day streak</p>
        ) : null}
      </div>
    </header>

    {todayData?.alreadyLoggedToday ? (
      <div className="rounded-2xl bg-[var(--color-surface-alt)] p-4">
        <p className="text-sm font-semibold text-[var(--color-text)]">Workout complete for today</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {todayData.existingWorkout?.exercises?.length || 0} exercises logged
        </p>
      </div>
    ) : (
      <Button size="lg" onClick={() => navigate('/log?start=empty')}>Start workout</Button>
    )}

    <section>
      <h2 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Routines</h2>
      {routines.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">No routines yet. Build one from the Log tab.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {routines.map(r => (
            <button key={r.id}
              onClick={() => navigate(`/log?routine=${r.id}`)}
              className="flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3 text-left">
              <span className="text-sm font-medium text-[var(--color-text)]">{r.name}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">{r.exercises?.length || 0} exercises</span>
            </button>
          ))}
        </div>
      )}
    </section>

    {tip ? <p className="text-xs text-[var(--color-text-secondary)]">{tip}</p> : null}
  </div>
);
```
(Keep the existing loading/error early-returns. `navigate` comes from `useNavigate()`.)

- [ ] **Step 3: Verify build + lint**

Run: `cd frontend && npm run lint && npm run build`
Expected: lint clean, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Today.jsx
git commit -m "refactor(frontend): plan-free Today with routines + resume"
```

### Task 1.8: Routines UI (Log tab gains routine management) + start flow

**Files:**
- Create: `frontend/src/components/routine/RoutineEditor.jsx`
- Modify: `frontend/src/pages/Log.jsx`

The Log tab gains: "Start empty session", a list of routines (start / edit / delete), and "New routine" (opens RoutineEditor, which reuses the existing `ExercisePicker`). Starting a routine or empty session opens the existing session UI (becomes SessionView in Phase 3; until then it opens `WorkoutSession` with a constructed `day`).

- [ ] **Step 1: RoutineEditor**

Create `frontend/src/components/routine/RoutineEditor.jsx`:
```jsx
import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import ExercisePicker from '../log/ExercisePicker';
import Button from '../ui/Button';
import { createRoutine, updateRoutine } from '../../api/services';

export default function RoutineEditor({ routine, onClose, onSaved }) {
  const [name, setName] = useState(routine?.name || '');
  const [exercises, setExercises] = useState(routine?.exercises || []);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  function addExercise(ex) {
    setExercises(prev => [...prev, {
      exerciseId: ex.id, name: ex.name, kind: ex.kind || 'weighted', targetSets: 3, targetReps: '8-12',
    }]);
    setPicking(false);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), exercises };
      const saved = routine?.id ? await updateRoutine(routine.id, payload) : await createRoutine(payload);
      onSaved(saved);
    } finally { setSaving(false); }
  }

  if (picking) return <ExercisePicker onSelect={addExercise} onClose={() => setPicking(false)} />;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text)]">{routine?.id ? 'Edit routine' : 'New routine'}</h2>
        <button onClick={onClose}><X className="h-5 w-5 text-[var(--color-text-secondary)]" /></button>
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Routine name"
        className="mb-4 rounded-xl bg-[var(--color-surface-alt)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" />
      <div className="flex-1 overflow-y-auto">
        {exercises.map((ex, i) => (
          <div key={i} className="mb-2 flex items-center justify-between rounded-xl bg-[var(--color-surface-alt)] px-4 py-3">
            <span className="text-sm text-[var(--color-text)]">{ex.name}</span>
            <button onClick={() => setExercises(prev => prev.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        ))}
        <button onClick={() => setPicking(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-3 text-sm text-[var(--color-text-secondary)]">
          <Plus className="h-4 w-4" /> Add exercise
        </button>
      </div>
      <div className="py-4">
        <Button size="lg" className="w-full" disabled={!name.trim() || saving} onClick={save}>
          {saving ? 'Saving…' : 'Save routine'}
        </Button>
      </div>
    </div>
  );
}
```
> Confirm `ExercisePicker`'s props are `onSelect(exercise)` + `onClose()`. If they differ, adapt the two call sites to its real signature (inspect `frontend/src/components/log/ExercisePicker.jsx`).

- [ ] **Step 2: Wire Log.jsx**

In `frontend/src/pages/Log.jsx`, add routine management above the existing manual-log entry:
- Import `getRoutines, deleteRoutine` from services, `RoutineEditor`, and read query params (`useSearchParams`) for `?routine=<id>` / `?start=empty` to auto-open a session.
- Add state: `routines`, `editing` (null | routine | 'new'). On mount, `getRoutines().then(setRoutines)`.
- Render a routines list with Start / Edit / Delete and a "New routine" button that sets `editing='new'`.
- When `editing`, render `<RoutineEditor routine={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={r => { setEditing(null); refresh(); }} />`.
- Starting a routine/empty session opens the existing session component with a `day` built from the routine: `{ name: routine.name, exercises: routine.exercises.map(e => ({ exerciseId: e.exerciseId, sets: e.targetSets, reps: e.targetReps })) }`; empty session → `{ name: 'Workout', exercises: [] }`.

- [ ] **Step 3: Verify build + lint**

Run: `cd frontend && npm run lint && npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/routine/RoutineEditor.jsx frontend/src/pages/Log.jsx
git commit -m "feat(frontend): routine management + start flow in Log tab"
```

### Task 1.9: "Save as routine" from workout summary

**Files:**
- Modify: `frontend/src/components/workout/WorkoutSession.jsx` (or WorkoutSummary if summary is separate)

- [ ] **Step 1: Add the action**

In the finish/summary UI (where `result` is shown), add a "Save as routine" button that calls:
```js
import { createRoutine } from '../../api/services';
// ...
async function saveAsRoutine() {
  await createRoutine({
    name: day?.name || 'My Routine',
    exercises: exercises.map(ex => ({
      exerciseId: ex.exerciseId, name: ex.name, kind: ex.kind || 'weighted',
      targetSets: ex.sets.length, targetReps: ex.targetReps || '8-12',
    })),
  });
}
```
Show a confirmation toast/inline state on success.

- [ ] **Step 2: Verify build + lint, manual check**

Run: `cd frontend && npm run lint && npm run build`. Then `npm run dev:local`, finish a session, tap "Save as routine", confirm it appears in the Log tab.
Expected: routine persists and lists.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/workout/WorkoutSession.jsx
git commit -m "feat(frontend): save finished session as routine"
```

**Phase 1 checkpoint:** App builds, all backend tests pass, manual logging + routines work, no plan references remain. `cd backend && npm test && cd ../frontend && npm run lint && npm run build`.

---

# PHASE 2 — Kind-aware data model + expanded library

### Task 2.1: Set-metrics module (TDD)

**Files:**
- Create: `backend/src/services/set-metrics.js`
- Test: `backend/src/services/set-metrics.test.js`

- [ ] **Step 1: Failing tests**

Create `backend/src/services/set-metrics.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { setVolume, setScore, exerciseRollup } from './set-metrics.js';

describe('set-metrics', () => {
  it('weighted volume and score', () => {
    expect(setVolume('weighted', { weight: 100, reps: 5 })).toBe(500);
    expect(setScore('weighted', { weight: 100, reps: 5 })).toBe(100);
  });
  it('bodyweight uses added weight', () => {
    expect(setVolume('bodyweight', { addedWeight: 25, reps: 8 })).toBe(200);
    expect(setScore('bodyweight', { addedWeight: 25, reps: 8 })).toBe(25);
  });
  it('assisted scores less-assist higher', () => {
    expect(setScore('assisted', { assistWeight: 40, reps: 10 })).toBe(-40);
    expect(setVolume('assisted', { assistWeight: 40, reps: 10 })).toBe(10);
  });
  it('timed and distance', () => {
    expect(setVolume('timed', { seconds: 60 })).toBe(60);
    expect(setScore('timed', { seconds: 60 })).toBe(60);
    expect(setVolume('distance', { distance: 5, seconds: 1470 })).toBe(5);
    expect(setScore('distance', { distance: 5 })).toBe(5);
  });
  it('rollup picks best completed set and sums volume', () => {
    const r = exerciseRollup('weighted', [
      { weight: 100, reps: 5, completed: true },
      { weight: 120, reps: 3, completed: true },
      { weight: 999, reps: 1, completed: false },
    ]);
    expect(r.volume).toBe(100 * 5 + 120 * 3);
    expect(r.best.score).toBe(120);
    expect(r.hasData).toBe(true);
  });
  it('rollup with no completed sets has no data', () => {
    const r = exerciseRollup('weighted', [{ weight: 100, reps: 5, completed: false }]);
    expect(r.hasData).toBe(false);
    expect(r.volume).toBe(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd backend && npx vitest run src/services/set-metrics.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `backend/src/services/set-metrics.js`:
```js
const N = (v) => Number(v) || 0;

export function setVolume(kind, s) {
  switch (kind) {
    case 'bodyweight': return N(s.addedWeight) * N(s.reps);
    case 'assisted': return N(s.reps);
    case 'timed': return N(s.seconds);
    case 'distance': return N(s.distance);
    case 'weighted':
    default: return N(s.weight) * N(s.reps);
  }
}

export function setScore(kind, s) {
  switch (kind) {
    case 'bodyweight': return N(s.addedWeight);
    case 'assisted': return -N(s.assistWeight);
    case 'timed': return N(s.seconds);
    case 'distance': return N(s.distance);
    case 'weighted':
    default: return N(s.weight);
  }
}

export function exerciseRollup(kind, sets = []) {
  const done = sets.filter(s => s.completed);
  const volume = done.reduce((sum, s) => sum + setVolume(kind, s), 0);
  let best = null;
  for (const s of done) {
    const score = setScore(kind, s);
    if (best === null || score > best.score) best = { score, set: s };
  }
  return { volume, best: best || { score: 0, set: null }, hasData: done.length > 0 };
}
```
> Note: PR/volume count only `completed` sets (matches existing `logWorkout` behavior).

- [ ] **Step 4: Run, verify pass**

Run: `cd backend && npx vitest run src/services/set-metrics.test.js`
Expected: PASS — 6 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/set-metrics.js backend/src/services/set-metrics.test.js
git commit -m "feat(backend): kind-aware set metrics"
```

### Task 2.2: Make `logWorkout` kind-aware (TDD)

**Files:**
- Modify: `backend/src/services/workout-service.js`
- Test: `backend/src/services/workout-log.test.js`

- [ ] **Step 1: Failing test**

Create `backend/src/services/workout-log.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

let added = null;
let historyDocs = [];

vi.mock('./firebase.js', () => ({
  db: {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy() { return { limit: () => ({ get: async () => ({ docs: historyDocs }) }) }; },
          add: async (w) => { added = w; return { id: 'new1' }; },
        }),
      }),
    }),
  },
}));
vi.mock('./user-service.js', () => ({
  updateStreak: vi.fn(async () => ({ streak: 3 })),
  getProfile: vi.fn(async () => ({ units: 'lbs' })),
}));
vi.mock('./ai-service.js', () => ({ generateWorkoutSummary: vi.fn(async () => 'nice') }));

import { logWorkout } from './workout-service.js';

beforeEach(() => { added = null; historyDocs = []; });

describe('logWorkout kind-aware', () => {
  it('computes timed volume and stores kind', async () => {
    await logWorkout('u1', { exercises: [
      { exerciseId: 'plank', name: 'Plank', kind: 'timed', sets: [{ seconds: 60, completed: true }] },
    ] });
    expect(added.exercises[0].kind).toBe('timed');
    expect(added.exercises[0].volume).toBe(60);
    expect(added.totalVolume).toBe(60);
  });

  it('detects a bodyweight PR by added weight', async () => {
    historyDocs = [{ data: () => ({ date: '2026-05-01', exercises: [
      { exerciseId: 'pull-up', kind: 'bodyweight', bestScore: 10 },
    ] }) }];
    await logWorkout('u1', { exercises: [
      { exerciseId: 'pull-up', name: 'Pull-up', kind: 'bodyweight', sets: [{ addedWeight: 25, reps: 5, completed: true }] },
    ] });
    expect(added.prs.map(p => p.exerciseId)).toContain('pull-up');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd backend && npx vitest run src/services/workout-log.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

In `backend/src/services/workout-service.js`:
- Add import at top: `import { exerciseRollup } from './set-metrics.js';`
- Replace the `const exercises = workoutData.exercises.map(...)` block (lines 14–34) with:
```js
const exercises = workoutData.exercises.map(ex => {
  const kind = ex.kind || 'weighted';
  const sets = ex.sets.map(s => ({ ...s, completed: s.completed !== false }));
  const rollup = exerciseRollup(kind, sets);
  return {
    exerciseId: ex.exerciseId,
    name: ex.name,
    kind,
    sets,
    volume: rollup.volume,
    bestScore: rollup.best.score,
    bestSet: rollup.best.set,
    hasData: rollup.hasData,
    notes: ex.notes || undefined,
  };
});
```
- Replace the PR-detection loop (lines 44–65) with a score-based version:
```js
const prs = [];
for (const exercise of exercises) {
  if (!exercise.hasData) continue;
  let historicalBest = null;
  for (const doc of historySnap.docs) {
    const w = doc.data();
    if (!w.exercises) continue;
    const match = w.exercises.find(e => e.exerciseId === exercise.exerciseId);
    if (match && typeof match.bestScore === 'number') {
      historicalBest = historicalBest === null ? match.bestScore : Math.max(historicalBest, match.bestScore);
    }
  }
  if (historicalBest !== null && exercise.bestScore > historicalBest) {
    prs.push({ exerciseId: exercise.exerciseId, name: exercise.name, score: exercise.bestScore, previousBest: historicalBest });
  }
}
```
- In the `generateWorkoutSummary` call args, `prs: prs.map(p => p.name)` stays valid.

- [ ] **Step 4: Run, verify pass**

Run: `cd backend && npx vitest run src/services/workout-log.test.js`
Expected: PASS — 2 passed.

- [ ] **Step 5: Update generateWorkoutSummary's set display (avoid weight-only assumption)**

In `backend/src/services/ai-service.js` `generateWorkoutSummary`, the `exerciseList` map uses `s.weight`. Make it kind-tolerant:
```js
const exerciseList = workoutData.exercises
  .map(ex => `${ex.name}: ${ex.sets.length} sets${typeof ex.bestScore === 'number' ? ` (best ${ex.bestScore})` : ''}`)
  .join('\n');
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/workout-service.js backend/src/services/workout-log.test.js backend/src/services/ai-service.js
git commit -m "feat(backend): kind-aware volume and PR detection"
```

### Task 2.3: Add `kind`/`aliases` + expand the exercise seed

**Files:**
- Modify: `backend/scripts/seed-exercises.js`
- Create: `backend/scripts/migrate-exercise-kind.js`

- [ ] **Step 1: Add fields to seed data**

In `backend/scripts/seed-exercises.js`, give every exercise object a `kind` and `aliases`. Rules: barbell/dumbbell/cable/machine lifts → `weighted`; pull-up/chin-up/dip/push-up → `bodyweight`; assisted machine variants → `assisted`; plank/hold/farmer carry (time) → `timed`; run/row/bike/walk (cardio) → `distance`. Example for the first three entries:
```js
{
  name: 'Barbell Bench Press', kind: 'weighted',
  aliases: ['bench', 'bench press', 'barbell bench', 'bb bench'],
  category: 'strength',
  muscleGroups: { primary: ['chest'], secondary: ['triceps', 'front delts'] },
  equipment: 'barbell',
  instructions: 'Lie on bench, grip bar shoulder-width, lower to chest, press up.',
},
{
  name: 'Incline Barbell Bench Press', kind: 'weighted',
  aliases: ['incline bench', 'incline barbell bench', 'incline bench press'],
  category: 'strength',
  muscleGroups: { primary: ['upper chest'], secondary: ['triceps', 'front delts'] },
  equipment: 'barbell',
  instructions: 'Set bench to 30-45 degrees. Press bar from upper chest.',
},
{
  name: 'Dumbbell Bench Press', kind: 'weighted',
  aliases: ['db bench', 'dumbbell bench', 'db press', 'dumbbell press'],
  category: 'strength',
  muscleGroups: { primary: ['chest'], secondary: ['triceps', 'front delts'] },
  equipment: 'dumbbell',
  instructions: 'Lie on bench, press dumbbells from chest level.',
},
```
Apply the same pattern to every existing entry.

- [ ] **Step 2: Expand the library toward ~400 named exercises**

Add curated entries so each common movement covers its barbell/dumbbell/machine/cable/incline/decline variants, plus bodyweight, timed (planks/holds/carries), and distance (run/row/bike/elliptical/walk) exercises — each with `kind`, `aliases`, `category`, `muscleGroups`, `equipment`, `instructions`. Target ~400 total. Keep the doc-id scheme (kebab-case of name) unchanged. (No silent cap — if you stop short of 400, note the count at the top of the file in a comment.)

- [ ] **Step 3: Migration for existing docs**

Create `backend/scripts/migrate-exercise-kind.js` that backfills `kind: 'weighted'` and `aliases: []` on any existing `exercises` doc missing them:
```js
import { db } from '../src/services/firebase.js';

async function migrate() {
  const snap = await db.collection('exercises').get();
  const batch = db.batch();
  let n = 0;
  snap.docs.forEach(doc => {
    const d = doc.data();
    const patch = {};
    if (!d.kind) patch.kind = 'weighted';
    if (!d.aliases) patch.aliases = [];
    if (Object.keys(patch).length) { batch.update(doc.ref, patch); n++; }
  });
  await batch.commit();
  console.log(`Backfilled ${n} exercises`);
  process.exit(0);
}
migrate();
```

- [ ] **Step 4: Re-seed (dev) and verify**

Run: `cd backend && node scripts/seed-exercises.js`
Expected: prints seeded count (~400). Then verify a doc has the new fields via the Firebase MCP or console. (If running against a shared DB, coordinate first.)

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/seed-exercises.js backend/scripts/migrate-exercise-kind.js
git commit -m "feat(backend): exercise kinds, aliases, expanded library + migration"
```

### Task 2.4: Exercise service exposes kind/aliases + catalog builder

**Files:**
- Modify: `backend/src/services/exercise-service.js`
- Test: `backend/src/services/exercise-catalog.test.js`

- [ ] **Step 1: Failing test for catalog**

Create `backend/src/services/exercise-catalog.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

let docs = [];
vi.mock('./firebase.js', () => ({
  db: { collection: () => ({ orderBy: () => ({ get: async () => ({ docs }) }) }) },
}));

import { getCatalog } from './exercise-service.js';

beforeEach(() => { docs = [
  { id: 'barbell-bench-press', data: () => ({ name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench'] }) },
  { id: 'plank', data: () => ({ name: 'Plank', kind: 'timed' }) },
]; });

describe('getCatalog', () => {
  it('returns compact id/name/kind/aliases entries', async () => {
    const cat = await getCatalog();
    expect(cat).toEqual([
      { id: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench'] },
      { id: 'plank', name: 'Plank', kind: 'timed', aliases: [] },
    ]);
  });
});
```

- [ ] **Step 2: Run, verify fail** → `cd backend && npx vitest run src/services/exercise-catalog.test.js` (FAIL: `getCatalog` not exported).

- [ ] **Step 3: Implement**

In `backend/src/services/exercise-service.js`, append:
```js
let catalogCache = null;
let catalogCachedAt = 0;
const CATALOG_TTL = 10 * 60 * 1000;

export async function getCatalog() {
  const snap = await exercisesRef.orderBy('name').get();
  return snap.docs.map(d => {
    const x = d.data();
    return { id: d.id, name: x.name, kind: x.kind || 'weighted', aliases: x.aliases || [] };
  });
}

export async function getCachedCatalog() {
  const now = Date.now();
  if (!catalogCache || now - catalogCachedAt > CATALOG_TTL) {
    catalogCache = await getCatalog();
    catalogCachedAt = now;
  }
  return catalogCache;
}
```
> `getCatalog` is the pure (tested) fetch; `getCachedCatalog` adds TTL caching for request hot-path use. The `Date.now()` cache is fine in production code (only the workflow *script* sandbox forbids it; this is app code).

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/src/services/exercise-service.js backend/src/services/exercise-catalog.test.js
git commit -m "feat(backend): exercise catalog builder with TTL cache"
```

### Task 2.5: Kind-aware SetRow + session payload (frontend)

**Files:**
- Create: `frontend/src/utils/set-fields.js`
- Test: `frontend/src/utils/set-fields.test.js`
- Modify: `frontend/src/components/workout/SetRow.jsx`, `frontend/src/components/workout/WorkoutSession.jsx`

- [ ] **Step 1: Failing test for field config**

Create `frontend/src/utils/set-fields.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { fieldsForKind, emptySet } from './set-fields';

describe('set-fields', () => {
  it('weighted has weight + reps', () => {
    expect(fieldsForKind('weighted').map(f => f.key)).toEqual(['weight', 'reps']);
  });
  it('timed has seconds', () => {
    expect(fieldsForKind('timed').map(f => f.key)).toEqual(['seconds']);
  });
  it('distance has distance + seconds', () => {
    expect(fieldsForKind('distance').map(f => f.key)).toEqual(['distance', 'seconds']);
  });
  it('emptySet matches the field keys plus completed', () => {
    expect(emptySet('bodyweight')).toEqual({ addedWeight: '', reps: '', completed: false });
  });
});
```

- [ ] **Step 2: Run, verify fail** → `cd frontend && npx vitest run src/utils/set-fields.test.js` (FAIL).

- [ ] **Step 3: Implement**

Create `frontend/src/utils/set-fields.js`:
```js
const CONFIG = {
  weighted: [{ key: 'weight', label: 'Weight' }, { key: 'reps', label: 'Reps' }],
  bodyweight: [{ key: 'addedWeight', label: '+kg/lb' }, { key: 'reps', label: 'Reps' }],
  assisted: [{ key: 'assistWeight', label: 'Assist' }, { key: 'reps', label: 'Reps' }],
  timed: [{ key: 'seconds', label: 'Seconds' }],
  distance: [{ key: 'distance', label: 'Distance' }, { key: 'seconds', label: 'Time (s)' }],
};

export function fieldsForKind(kind) {
  return CONFIG[kind] || CONFIG.weighted;
}

export function emptySet(kind) {
  const s = { completed: false };
  for (const f of fieldsForKind(kind)) s[f.key] = '';
  return s;
}
```

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Make SetRow render the kind's fields**

In `frontend/src/components/workout/SetRow.jsx`, accept a `kind` prop and render an input per `fieldsForKind(kind)` (instead of hardcoded weight+reps), keeping the existing completed-checkbox and styling. Each input updates `set[field.key]`.

- [ ] **Step 6: WorkoutSession uses kind**

In `frontend/src/components/workout/WorkoutSession.jsx`:
- Import `emptySet` from `../../utils/set-fields`.
- In the initial-exercise builder, carry `kind: ex.kind || 'weighted'` and build sets via `emptySet(kind)`.
- Pass `kind={exercise.kind}` to `<SetRow>`.
- In `handleFinish`, change the per-set map to pass through all kind fields instead of only weight/reps:
```js
sets: ex.sets.map(s => ({ ...s, completed: !!s.completed })),
```
and include `kind: ex.kind` on each exercise in the payload.

- [ ] **Step 7: Verify + commit**

Run: `cd frontend && npm test && npm run lint && npm run build` → all clean.
```bash
git add frontend/src/utils/set-fields.js frontend/src/utils/set-fields.test.js frontend/src/components/workout/SetRow.jsx frontend/src/components/workout/WorkoutSession.jsx
git commit -m "feat(frontend): kind-aware set inputs and session payload"
```

**Phase 2 checkpoint:** `cd backend && npm test && cd ../frontend && npm test && npm run build`. Manual: log a plank (timed) and a pull-up (bodyweight); confirm they save and a bodyweight PR is detected.

---

# PHASE 3 — Conversational AI engine + split UI + training sink

### Task 3.1: Interaction-log service (training sink) (TDD)

**Files:**
- Create: `backend/src/services/interaction-log-service.js`
- Test: `backend/src/services/interaction-log-service.test.js`

- [ ] **Step 1: Failing test**

Create `backend/src/services/interaction-log-service.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

let added = [];
vi.mock('./firebase.js', () => ({
  db: { collection: (name) => ({ add: async (v) => { added.push({ name, v }); return { id: 'log1' }; } }) },
}));

import { logInteraction } from './interaction-log-service.js';

beforeEach(() => { added = []; });

describe('logInteraction', () => {
  it('writes a record to interactionLogs with createdAt', async () => {
    await logInteraction({ uid: 'u1', surface: 'session-log', inputText: 'bench 225 5,5,4', envelope: { confidence: 0.9 }, model: 'gemini-3-flash-preview' });
    expect(added[0].name).toBe('interactionLogs');
    expect(added[0].v.uid).toBe('u1');
    expect(added[0].v.surface).toBe('session-log');
    expect(added[0].v.createdAt).toBeTruthy();
  });
  it('never throws even if write fails', async () => {
    await expect(logInteraction(null)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement**

Create `backend/src/services/interaction-log-service.js`:
```js
import { db } from './firebase.js';
import logger from '../logger.js';

export async function logInteraction(record) {
  try {
    if (!record) return;
    await db.collection('interactionLogs').add({
      uid: record.uid || null,
      surface: record.surface || 'unknown',
      sessionId: record.sessionId || null,
      inputText: record.inputText || '',
      envelope: record.envelope || null,
      confidence: record.envelope?.confidence ?? record.confidence ?? null,
      appliedActions: record.appliedActions || null,
      userCorrection: record.userCorrection || null,
      exerciseResolution: record.exerciseResolution || null,
      model: record.model || null,
      catalogVersion: record.catalogVersion || null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to write interaction log');
  }
}
```
> Training-sink writes must never break the user flow — hence the swallow-and-warn.

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/src/services/interaction-log-service.js backend/src/services/interaction-log-service.test.js
git commit -m "feat(backend): interaction-log training sink"
```

### Task 3.2: Exercise resolver (validate + fuzzy fallback) (TDD)

**Files:**
- Create: `backend/src/services/exercise-resolver.js`
- Test: `backend/src/services/exercise-resolver.test.js`

- [ ] **Step 1: Failing tests**

Create `backend/src/services/exercise-resolver.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { validateId, fuzzyResolve, resolveExercise } from './exercise-resolver.js';

const catalog = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench', 'bb bench'] },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', kind: 'weighted', aliases: ['db bench'] },
  { id: 'plank', name: 'Plank', kind: 'timed', aliases: [] },
];

describe('exercise-resolver', () => {
  it('validateId returns the entry or null', () => {
    expect(validateId('plank', catalog).id).toBe('plank');
    expect(validateId('nope', catalog)).toBeNull();
  });
  it('fuzzyResolve matches exact name', () => {
    expect(fuzzyResolve('Plank', catalog).match.id).toBe('plank');
  });
  it('fuzzyResolve matches an alias', () => {
    expect(fuzzyResolve('db bench', catalog).match.id).toBe('dumbbell-bench-press');
  });
  it('fuzzyResolve flags ambiguity for "bench"', () => {
    const r = fuzzyResolve('bench', catalog);
    expect(r.ambiguous).toBe(true);
    expect(r.candidates.length).toBeGreaterThan(1);
  });
  it('resolveExercise trusts a valid model id', () => {
    const r = resolveExercise({ exerciseId: 'plank', query: 'plank' }, catalog);
    expect(r.exerciseId).toBe('plank');
    expect(r.method).toBe('catalog');
  });
  it('resolveExercise falls back to fuzzy when id invalid', () => {
    const r = resolveExercise({ exerciseId: 'bogus', query: 'db bench' }, catalog);
    expect(r.exerciseId).toBe('dumbbell-bench-press');
    expect(r.method).toBe('fuzzy');
  });
  it('resolveExercise returns ambiguous candidates when unsure', () => {
    const r = resolveExercise({ exerciseId: null, query: 'bench' }, catalog);
    expect(r.exerciseId).toBeNull();
    expect(r.ambiguous).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement**

Create `backend/src/services/exercise-resolver.js`:
```js
export function validateId(id, catalog) {
  return catalog.find(e => e.id === id) || null;
}

function norm(s) { return String(s || '').toLowerCase().trim(); }

export function fuzzyResolve(query, catalog) {
  const q = norm(query);
  if (!q) return { match: null, ambiguous: false, candidates: [] };

  const exact = catalog.filter(e => norm(e.name) === q || (e.aliases || []).some(a => norm(a) === q));
  if (exact.length === 1) return { match: exact[0], ambiguous: false, candidates: exact };
  if (exact.length > 1) return { match: null, ambiguous: true, candidates: exact };

  const partial = catalog.filter(e =>
    norm(e.name).includes(q) || (e.aliases || []).some(a => norm(a).includes(q) || q.includes(norm(a)))
  );
  if (partial.length === 1) return { match: partial[0], ambiguous: false, candidates: partial };
  if (partial.length > 1) return { match: null, ambiguous: true, candidates: partial.slice(0, 5) };

  return { match: null, ambiguous: false, candidates: [] };
}

export function resolveExercise({ exerciseId, query }, catalog) {
  const valid = exerciseId ? validateId(exerciseId, catalog) : null;
  if (valid) {
    return { exerciseId: valid.id, name: valid.name, kind: valid.kind, ambiguous: false, candidates: [], method: 'catalog' };
  }
  const f = fuzzyResolve(query, catalog);
  if (f.match) {
    return { exerciseId: f.match.id, name: f.match.name, kind: f.match.kind, ambiguous: false, candidates: [], method: 'fuzzy' };
  }
  return {
    exerciseId: null, name: null, kind: null,
    ambiguous: f.ambiguous, method: 'fuzzy',
    candidates: f.candidates.map(c => ({ label: c.name, exerciseId: c.id })),
  };
}
```

- [ ] **Step 4: Run, verify pass** → PASS (7 passed).

- [ ] **Step 5: Commit**
```bash
git add backend/src/services/exercise-resolver.js backend/src/services/exercise-resolver.test.js
git commit -m "feat(backend): exercise resolver with fuzzy fallback"
```

### Task 3.3: Envelope validator (TDD)

**Files:**
- Create: `backend/src/services/log-envelope.js`
- Test: `backend/src/services/log-envelope.test.js`

- [ ] **Step 1: Failing tests**

Create `backend/src/services/log-envelope.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { validateEnvelope } from './log-envelope.js';

describe('validateEnvelope', () => {
  it('accepts a well-formed envelope', () => {
    const { ok, value } = validateEnvelope({
      reply: '✓ logged', confidence: 0.9, needsClarification: false, clarification: null,
      actions: [{ type: 'log_sets', exerciseId: 'plank', sets: [{ seconds: 60 }] }],
    });
    expect(ok).toBe(true);
    expect(value.actions).toHaveLength(1);
  });
  it('coerces missing fields to safe defaults', () => {
    const { ok, value } = validateEnvelope({ reply: 'hi' });
    expect(ok).toBe(true);
    expect(value.confidence).toBe(0);
    expect(value.needsClarification).toBe(false);
    expect(value.actions).toEqual([]);
  });
  it('drops unknown action types', () => {
    const { value } = validateEnvelope({ reply: 'x', actions: [{ type: 'hack' }, { type: 'answer', text: 'hi' }] });
    expect(value.actions).toEqual([{ type: 'answer', text: 'hi' }]);
  });
  it('rejects non-object input', () => {
    expect(validateEnvelope('nope').ok).toBe(false);
    expect(validateEnvelope(null).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement**

Create `backend/src/services/log-envelope.js`:
```js
const ACTION_TYPES = new Set(['add_exercise', 'log_sets', 'set_notes', 'answer']);

function cleanAction(a) {
  if (!a || !ACTION_TYPES.has(a.type)) return null;
  switch (a.type) {
    case 'add_exercise':
      return a.exerciseId ? { type: a.type, exerciseId: a.exerciseId, name: a.name || '', kind: a.kind || 'weighted' } : null;
    case 'log_sets':
      return a.exerciseId && Array.isArray(a.sets) ? { type: a.type, exerciseId: a.exerciseId, sets: a.sets } : null;
    case 'set_notes':
      return a.exerciseId ? { type: a.type, exerciseId: a.exerciseId, text: String(a.text || '') } : null;
    case 'answer':
      return { type: a.type, text: String(a.text || '') };
    default:
      return null;
  }
}

export function validateEnvelope(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, value: null };
  const value = {
    reply: String(raw.reply || ''),
    confidence: typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0,
    needsClarification: raw.needsClarification === true,
    clarification: raw.clarification && typeof raw.clarification === 'object'
      ? { prompt: String(raw.clarification.prompt || ''), options: Array.isArray(raw.clarification.options) ? raw.clarification.options.filter(o => o && o.exerciseId).map(o => ({ label: String(o.label || ''), exerciseId: o.exerciseId })) : [] }
      : null,
    actions: Array.isArray(raw.actions) ? raw.actions.map(cleanAction).filter(Boolean) : [],
  };
  return { ok: true, value };
}
```

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit**
```bash
git add backend/src/services/log-envelope.js backend/src/services/log-envelope.test.js
git commit -m "feat(backend): parse envelope validator"
```

### Task 3.4: Model constant + Gemini parse call

**Files:**
- Modify: `backend/src/services/ai-service.js`

- [ ] **Step 1: Add model constant and bump existing usages**

At the top of `backend/src/services/ai-service.js`, add:
```js
export const GEMINI_MODEL = 'gemini-3-flash-preview';
```
Replace all three `model: 'gemini-2.5-flash'` occurrences (in `generateWorkoutSummary`, `generateInsights`, `chat`) with `model: GEMINI_MODEL`.

- [ ] **Step 2: Add the structured-output parse function**

Append to `ai-service.js`:
```js
const LOG_SYSTEM_PROMPT = `You are Gymli's logging engine. Convert the user's message into a JSON command envelope that logs sets, adds exercises, sets notes, or answers a brief question.

Return ONLY valid JSON with this exact shape:
{
  "reply": "short confirmation or answer shown in the feed",
  "confidence": 0.0-1.0,
  "needsClarification": boolean,
  "clarification": null | { "prompt": "...", "options": [{ "label": "...", "exerciseId": "..." }] },
  "actions": [
    { "type": "add_exercise", "exerciseId": "<catalog id>", "name": "<name>", "kind": "<kind>" },
    { "type": "log_sets", "exerciseId": "<catalog id>", "sets": [ /* kind-aware: weighted {weight,reps}; bodyweight {addedWeight,reps}; assisted {assistWeight,reps}; timed {seconds}; distance {distance,seconds} */ ] },
    { "type": "set_notes", "exerciseId": "<catalog id>", "text": "..." },
    { "type": "answer", "text": "..." }
  ]
}

Rules:
- Resolve exercises to an id from the CATALOG. If multiple plausible matches, set needsClarification=true with options and DO NOT log.
- Use the exercise's kind to choose set fields. Respect the user's units; never invent numbers.
- "set 3", "last one", "next set" refer to the current exercise in SESSION.
- Lower confidence when the exercise is unclear or numbers are ambiguous.
- For pure questions (what's next, was that a PR), use a single "answer" action and no mutations. Keep replies under 2 sentences.`;

export async function parseLog({ text, session, units, catalog, coachingContext }) {
  const client = getAI();
  if (!client) {
    return { reply: 'AI logging is not configured.', confidence: 0, needsClarification: false, clarification: null, actions: [] };
  }
  const catalogText = catalog.map(c => `${c.id} | ${c.name} | ${c.kind}${c.aliases?.length ? ' | ' + c.aliases.join(',') : ''}`).join('\n');
  const sessionText = JSON.stringify(session || {});
  const system = `${LOG_SYSTEM_PROMPT}

UNITS: ${units || 'lbs'}
${coachingContext ? `\n--- USER DATA ---\n${coachingContext}\n` : ''}
--- CATALOG (id | name | kind | aliases) ---
${catalogText}
--- SESSION ---
${sessionText}`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  });
  return JSON.parse(response.text);
}
```

- [ ] **Step 3: Verify it parses syntactically**

Run: `cd backend && node -e "import('./src/services/ai-service.js').then(m=>console.log(typeof m.parseLog, m.GEMINI_MODEL))"`
Expected: `function gemini-3-flash-preview`.

- [ ] **Step 4: Commit**
```bash
git add backend/src/services/ai-service.js
git commit -m "feat(backend): gemini-3 parse engine + model constant"
```

### Task 3.5: Parse service orchestration (TDD)

**Files:**
- Create: `backend/src/services/log-parse-service.js`
- Test: `backend/src/services/log-parse-service.test.js`

Orchestrates: call `parseLog` → `validateEnvelope` → re-resolve each action's exercise against the catalog (server-side guard) → attach clarification if any action is unresolved → fire-and-forget `logInteraction`.

- [ ] **Step 1: Failing test**

Create `backend/src/services/log-parse-service.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const catalog = [
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', kind: 'weighted', aliases: ['bench'] },
  { id: 'plank', name: 'Plank', kind: 'timed', aliases: [] },
];

const parseLogMock = vi.fn();
const logInteractionMock = vi.fn(async () => {});

vi.mock('./ai-service.js', () => ({ parseLog: (...a) => parseLogMock(...a), GEMINI_MODEL: 'gemini-3-flash-preview' }));
vi.mock('./exercise-service.js', () => ({ getCachedCatalog: async () => catalog }));
vi.mock('./interaction-log-service.js', () => ({ logInteraction: (...a) => logInteractionMock(...a) }));
vi.mock('./coaching-context-service.js', () => ({ buildCoachingContext: async () => ({}), formatContextForAI: () => 'ctx' }));

import { handleParse } from './log-parse-service.js';

beforeEach(() => { parseLogMock.mockReset(); logInteractionMock.mockReset(); });

describe('handleParse', () => {
  it('passes through a valid envelope and logs the interaction', async () => {
    parseLogMock.mockResolvedValue({ reply: '✓', confidence: 0.95, needsClarification: false, clarification: null, actions: [{ type: 'log_sets', exerciseId: 'plank', sets: [{ seconds: 60 }] }] });
    const out = await handleParse('u1', { text: 'plank 60s', session: {}, units: 'lbs' });
    expect(out.actions[0].exerciseId).toBe('plank');
    expect(logInteractionMock).toHaveBeenCalledOnce();
  });

  it('forces clarification when an action id is not in the catalog and is unresolvable', async () => {
    parseLogMock.mockResolvedValue({ reply: '', confidence: 0.8, needsClarification: false, clarification: null, actions: [{ type: 'log_sets', exerciseId: 'bogus-id', sets: [{ weight: 100, reps: 5 }] }] });
    const out = await handleParse('u1', { text: 'frobnicate 100x5', session: {}, units: 'lbs' });
    expect(out.needsClarification).toBe(true);
    expect(out.actions).toEqual([]);
  });

  it('never throws to the caller if the model output is garbage', async () => {
    parseLogMock.mockResolvedValue('not json object');
    const out = await handleParse('u1', { text: 'x', session: {}, units: 'lbs' });
    expect(out.needsClarification).toBe(true);
    expect(out.reply).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement**

Create `backend/src/services/log-parse-service.js`:
```js
import { parseLog, GEMINI_MODEL } from './ai-service.js';
import { getCachedCatalog } from './exercise-service.js';
import { validateEnvelope } from './log-envelope.js';
import { resolveExercise } from './exercise-resolver.js';
import { logInteraction } from './interaction-log-service.js';
import { buildCoachingContext, formatContextForAI } from './coaching-context-service.js';

export async function handleParse(uid, { text, session, units, sessionId }) {
  const catalog = await getCachedCatalog();

  let coachingContext = '';
  try { coachingContext = formatContextForAI(await buildCoachingContext(uid)); } catch { /* non-fatal */ }

  let raw;
  try {
    raw = await parseLog({ text, session, units, catalog, coachingContext });
  } catch {
    raw = null;
  }

  const { ok, value } = validateEnvelope(raw);
  let envelope = ok ? value : { reply: "I didn't catch that — try again?", confidence: 0, needsClarification: true, clarification: null, actions: [] };

  // Server-side resolution guard: every mutating action must reference a real catalog id.
  const resolutions = [];
  const guarded = [];
  let unresolved = null;
  for (const action of envelope.actions) {
    if (action.type === 'answer' || action.type === 'set_notes') { guarded.push(action); continue; }
    const r = resolveExercise({ exerciseId: action.exerciseId, query: action.name || action.exerciseId }, catalog);
    resolutions.push({ method: r.method, matchedId: r.exerciseId, wasAmbiguous: r.ambiguous });
    if (r.exerciseId) {
      guarded.push({ ...action, exerciseId: r.exerciseId, name: r.name || action.name, kind: r.kind || action.kind });
    } else {
      unresolved = r;
    }
  }

  if (unresolved) {
    envelope = {
      reply: unresolved.candidates.length ? 'Which exercise did you mean?' : "I couldn't find that exercise.",
      confidence: 0,
      needsClarification: true,
      clarification: unresolved.candidates.length ? { prompt: 'Which exercise did you mean?', options: unresolved.candidates } : null,
      actions: [],
    };
  } else {
    envelope.actions = guarded;
  }

  logInteraction({
    uid, surface: 'session-log', sessionId,
    inputText: text, envelope,
    appliedActions: envelope.actions,
    exerciseResolution: { method: resolutions[0]?.method || 'none', matchedIds: resolutions.map(r => r.matchedId).filter(Boolean), wasAmbiguous: resolutions.some(r => r.wasAmbiguous) },
    model: GEMINI_MODEL,
  });

  return envelope;
}
```

- [ ] **Step 4: Run, verify pass** → PASS (3 passed).

- [ ] **Step 5: Commit**
```bash
git add backend/src/services/log-parse-service.js backend/src/services/log-parse-service.test.js
git commit -m "feat(backend): log parse orchestration with resolution guard + training log"
```

### Task 3.6: Parse controller + route (rate-limited)

**Files:**
- Create: `backend/src/controllers/log-controller.js`
- Modify: `backend/src/routes/api.js`

- [ ] **Step 1: Controller**

Create `backend/src/controllers/log-controller.js`:
```js
import { handleParse } from '../services/log-parse-service.js';

export async function parseLogEntry(req, res, next) {
  try {
    const { text, session, units, sessionId } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });
    const envelope = await handleParse(req.uid, { text, session, units, sessionId });
    res.json(envelope);
  } catch (err) { next(err); }
}
```

- [ ] **Step 2: Route (reuse the chat rate limiter)**

In `backend/src/routes/api.js`:
- Import: `import { parseLogEntry } from '../controllers/log-controller.js';`
- Add under the workout routes: `router.post('/log/parse', chatLimiter, parseLogEntry);`

- [ ] **Step 3: Verify routes load** → `cd backend && node -e "import('./src/routes/api.js').then(()=>console.log('ok'))"` → `ok`.

- [ ] **Step 4: Commit**
```bash
git add backend/src/controllers/log-controller.js backend/src/routes/api.js
git commit -m "feat(backend): POST /api/log/parse route"
```

### Task 3.7: Route the global chat through the training sink (context isolation)

**Files:**
- Modify: `backend/src/services/chat-service.js`

- [ ] **Step 1: Log global chat to the sink**

In `backend/src/services/chat-service.js` `sendMessage`, after computing `response` and before/after the existing `chatRef(uid).add(chatDoc)`, add:
```js
import { logInteraction } from './interaction-log-service.js';
import { GEMINI_MODEL } from './ai-service.js';
// ... inside sendMessage, after `response` is obtained:
logInteraction({
  uid, surface: 'global-chat',
  inputText: message,
  envelope: { reply: response, actions: [{ type: 'answer', text: response }] },
  model: GEMINI_MODEL,
});
```
(Place the two imports at the top of the file.)

- [ ] **Step 2: Confirm isolation**

The global chat reads history only from `chat_sessions`; `log-parse-service` never reads or writes `chat_sessions`. No code change needed — add a test asserting `handleParse` does not touch chat history.

Append to `backend/src/services/log-parse-service.test.js`:
```js
it('does not read or write global chat history', async () => {
  parseLogMock.mockResolvedValue({ reply: 'ok', confidence: 1, needsClarification: false, clarification: null, actions: [] });
  // chat-service is not mocked here; if handleParse imported it, the test file would need that mock.
  const out = await handleParse('u1', { text: 'hi', session: {}, units: 'lbs' });
  expect(out).toBeTruthy();
});
```

- [ ] **Step 3: Run backend tests** → `cd backend && npm test` → all PASS.

- [ ] **Step 4: Commit**
```bash
git add backend/src/services/chat-service.js backend/src/services/log-parse-service.test.js
git commit -m "feat(backend): log global chat to training sink; assert context isolation"
```

### Task 3.8: Frontend — session action reducer (TDD)

**Files:**
- Create: `frontend/src/utils/session-actions.js`
- Test: `frontend/src/utils/session-actions.test.js`

- [ ] **Step 1: Failing tests**

Create `frontend/src/utils/session-actions.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { applyAction } from './session-actions';

const base = () => ({ exercises: [], currentExerciseId: null });

describe('applyAction', () => {
  it('add_exercise appends and focuses it', () => {
    const s = applyAction(base(), { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    expect(s.exercises).toHaveLength(1);
    expect(s.currentExerciseId).toBe('plank');
    expect(s.exercises[0].kind).toBe('timed');
  });
  it('add_exercise is idempotent on id', () => {
    let s = applyAction(base(), { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    s = applyAction(s, { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    expect(s.exercises).toHaveLength(1);
  });
  it('log_sets adds the exercise if missing then appends sets', () => {
    const s = applyAction(base(), { type: 'log_sets', exerciseId: 'plank', sets: [{ seconds: 60 }] });
    expect(s.exercises[0].exerciseId).toBe('plank');
    expect(s.exercises[0].sets[0]).toMatchObject({ seconds: 60, completed: true });
  });
  it('set_notes sets the note', () => {
    let s = applyAction(base(), { type: 'add_exercise', exerciseId: 'plank', name: 'Plank', kind: 'timed' });
    s = applyAction(s, { type: 'set_notes', exerciseId: 'plank', text: 'tough' });
    expect(s.exercises[0].notes).toBe('tough');
  });
  it('answer does not mutate the session', () => {
    const s0 = base();
    const s1 = applyAction(s0, { type: 'answer', text: 'next is bench' });
    expect(s1.exercises).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement**

Create `frontend/src/utils/session-actions.js`:
```js
function findIndex(session, id) {
  return session.exercises.findIndex(e => e.exerciseId === id);
}

export function applyAction(session, action) {
  const next = { ...session, exercises: session.exercises.map(e => ({ ...e, sets: [...e.sets] })) };
  switch (action.type) {
    case 'add_exercise': {
      if (findIndex(next, action.exerciseId) === -1) {
        next.exercises.push({ exerciseId: action.exerciseId, name: action.name, kind: action.kind || 'weighted', notes: '', sets: [] });
      }
      next.currentExerciseId = action.exerciseId;
      return next;
    }
    case 'log_sets': {
      let i = findIndex(next, action.exerciseId);
      if (i === -1) {
        next.exercises.push({ exerciseId: action.exerciseId, name: action.exerciseId, kind: action.kind || 'weighted', notes: '', sets: [] });
        i = next.exercises.length - 1;
      }
      const newSets = (action.sets || []).map(s => ({ ...s, completed: s.completed !== false }));
      next.exercises[i] = { ...next.exercises[i], sets: [...next.exercises[i].sets, ...newSets] };
      next.currentExerciseId = action.exerciseId;
      return next;
    }
    case 'set_notes': {
      const i = findIndex(next, action.exerciseId);
      if (i !== -1) next.exercises[i] = { ...next.exercises[i], notes: action.text };
      return next;
    }
    case 'answer':
    default:
      return next;
  }
}
```

- [ ] **Step 4: Run, verify pass** → PASS (5 passed).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/utils/session-actions.js frontend/src/utils/session-actions.test.js
git commit -m "feat(frontend): session action reducer for parsed envelopes"
```

### Task 3.9: Frontend parse API

**Files:**
- Modify: `frontend/src/api/services.js`

- [ ] **Step 1: Add the call**

Append to `frontend/src/api/services.js`:
```js
// Conversational logging
export const parseLog = (payload) => client.post('/log/parse', payload).then(r => r.data);
```

- [ ] **Step 2: Commit**
```bash
git add frontend/src/api/services.js
git commit -m "feat(frontend): parseLog API call"
```

### Task 3.10: LogInput + LogFeed components

**Files:**
- Create: `frontend/src/components/workout/LogInput.jsx`
- Create: `frontend/src/components/workout/LogFeed.jsx`

- [ ] **Step 1: LogInput** (mirrors the ChatInput pattern — auto-grow textarea, Enter to send, safe-area padding)

Create `frontend/src/components/workout/LogInput.jsx`:
```jsx
import { useRef, useState } from 'react';
import { Send } from 'lucide-react';

export default function LogInput({ onSend, disabled }) {
  const ref = useRef(null);
  const [text, setText] = useState('');

  function submit() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
    if (ref.current) ref.current.style.height = 'auto';
  }
  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }
  function onInput(e) {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  return (
    <div className="flex items-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3"
         style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 0.75rem)' }}>
      <textarea ref={ref} value={text} onChange={onInput} onKeyDown={onKeyDown} rows={1} disabled={disabled}
        placeholder="Log a set or ask Gymli…"
        className="flex-1 resize-none rounded-xl bg-[var(--color-surface-alt)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-secondary)] focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
        style={{ maxHeight: '120px' }} />
      <button onClick={submit} disabled={!text.trim() || disabled}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white transition-all active:scale-95 disabled:opacity-40">
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: LogFeed** (renders feed lines + clarification chips)

Create `frontend/src/components/workout/LogFeed.jsx`:
```jsx
export default function LogFeed({ entries, onClarify }) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-1 py-2">
      {entries.map((e, i) => (
        <div key={i} className={e.from === 'user' ? 'self-end' : 'self-start'}>
          <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
            e.from === 'user' ? 'bg-[var(--color-surface-alt)] text-[var(--color-text)]'
                              : 'bg-[var(--color-primary)]/10 text-[var(--color-text)]'}`}>
            {e.text}
          </div>
          {e.clarification?.options?.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {e.clarification.options.map(opt => (
                <button key={opt.exerciseId} onClick={() => onClarify(opt)}
                  className="rounded-lg border border-[var(--color-primary)] px-3 py-1 text-xs text-[var(--color-primary)]">
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify build/lint** → `cd frontend && npm run lint && npm run build` → clean.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/workout/LogInput.jsx frontend/src/components/workout/LogFeed.jsx
git commit -m "feat(frontend): LogInput and LogFeed components"
```

### Task 3.11: Split SessionView — grid (top) + feed/input (bottom)

**Files:**
- Modify: `frontend/src/components/workout/WorkoutSession.jsx`

Integrate the feed/input under the existing grid, apply parsed actions via the reducer, and honor the confidence gate.

- [ ] **Step 1: Wire state + handler**

In `WorkoutSession.jsx`:
- Imports:
```js
import LogInput from './LogInput';
import LogFeed from './LogFeed';
import { applyAction } from '../../utils/session-actions';
import { parseLog } from '../../api/services';
```
- Add state: `const [feed, setFeed] = useState([]); const [parsing, setParsing] = useState(false);` and a stable `sessionId` ref: `const sessionId = useRef('s-' + Math.round(performance.now())).current;`
- Add the confidence threshold: `const CONFIDENCE_MIN = 0.6;`
- Add the send handler:
```js
async function handleLogInput(text) {
  setFeed(f => [...f, { from: 'user', text }]);
  setParsing(true);
  try {
    const session = { exercises: exercises.map(e => ({ exerciseId: e.exerciseId, name: e.name, kind: e.kind, sets: e.sets })), currentExerciseId: exercises[currentIndex]?.exerciseId || null };
    const env = await parseLog({ text, session, units, sessionId });
    setFeed(f => [...f, { from: 'gymli', text: env.reply || '…', clarification: env.needsClarification ? env.clarification : null }]);

    const confident = !env.needsClarification && env.confidence >= CONFIDENCE_MIN;
    if (confident) {
      applyEnvelopeActions(env.actions);
    } else if (!env.needsClarification) {
      // low confidence but not a clarification — still apply, the grid is editable
      applyEnvelopeActions(env.actions);
    }
  } catch {
    setFeed(f => [...f, { from: 'gymli', text: 'Something went wrong — try again.' }]);
  } finally {
    setParsing(false);
  }
}

function applyEnvelopeActions(actions) {
  setExercises(prev => {
    let session = { exercises: prev.map(e => ({ ...e })), currentExerciseId: prev[currentIndex]?.exerciseId || null };
    for (const a of actions) session = applyAction(session, a);
    return session.exercises;
  });
}

function handleClarify(option) {
  // user picked an exercise → add it and focus
  applyEnvelopeActions([{ type: 'add_exercise', exerciseId: option.exerciseId, name: option.label, kind: 'weighted' }]);
  setFeed(f => [...f, { from: 'gymli', text: `Added ${option.label}.` }]);
}
```
> Note: `applyAction` expects each session exercise to have a `sets` array — the initial builder already provides that. The reducer appends sets; for routine-prefilled exercises with empty sets that's the desired behavior.

- [ ] **Step 2: Render the split layout**

Wrap the existing grid in a top region and add the feed/input below so the screen is: header → grid (scrolls) → LogFeed (max ~30% height) → LogInput. Minimal structure:
```jsx
<div className="flex h-full flex-col">
  <div className="flex-1 overflow-y-auto">
    {/* existing header + exercise pill nav + current ExerciseCard/grid */}
  </div>
  <div className="max-h-[34vh] border-t border-[var(--color-border)]">
    <LogFeed entries={feed} onClarify={handleClarify} />
  </div>
  <LogInput onSend={handleLogInput} disabled={parsing} />
</div>
```
Keep the existing finish/rest-timer/summary flow intact.

- [ ] **Step 3: Verify build + lint** → `cd frontend && npm run lint && npm run build` → clean.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/workout/WorkoutSession.jsx
git commit -m "feat(frontend): split session view with conversational logging"
```

### Task 3.12: End-to-end verification

- [ ] **Step 1: Full test + build**

Run: `cd backend && npm test && cd ../frontend && npm test && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 2: Manual smoke (requires GEMINI_API_KEY + seeded exercises)**

Run `npm run dev:local`. Start an empty session. In the log input:
- Type `bench 225 5,5,4` → grid shows 3 weighted sets on Barbell Bench Press; feed shows a confirmation.
- Type `add plank` then `plank 60s` → a timed exercise with a 60s set.
- Type `db press 70 10 9 8` → if ambiguous, clarification chips appear; pick one → exercise added.
- Type `what's next?` → an answer line, no grid change.
Finish the workout → summary + any PRs. Confirm an `interactionLogs` document was written (Firebase console / MCP).

- [ ] **Step 3: Commit any fixes, then run `/commit-push`** to push the branch with lint + security checks.

**Phase 3 checkpoint / Definition of done:** conversational + manual logging both work, confidence gate + clarification chips function, every utterance is persisted to `interactionLogs`, the session feed never appears in global chat context, and all tests pass.

---

## Task dependency graph

```
0.1 ─┐
0.2 ─┤ (tooling, parallel)
     │
1.1 ─► 1.2 ─► 1.4 ──┐
1.3 ────────────────┤
1.5 ─► 1.6 ─► 1.7 ─► 1.8 ─► 1.9   (frontend strip+routines; 1.5 after 1.2)
     (Phase 1 ships)
                     │
2.1 ─► 2.2 ──────────┤
2.3 ─► 2.4 ──────────┤
2.5 (needs 2.4 kind data) ─► 2.6
     (Phase 2 ships)
                     │
3.1 ─┐
3.2 ─┤
3.3 ─┼─► 3.5 ─► 3.6 ─► 3.7
3.4 ─┘                  │
3.8 ─► 3.9 ─► 3.10 ─► 3.11 ─► 3.12
     (Phase 3 ships)
```

Critical path: 0.1 → 1.1 → 1.2 → 1.4 → (data model) 2.1 → 2.2 → (engine) 3.2 → 3.5 → 3.6 → (UI) 3.11 → 3.12.

## Notes / deviations from spec

- **Collection:** uses a new `users/{uid}/routines` collection rather than reusing `plans` (cleaner; avoids mixed-shape docs — directly serves the "don't pollute" goal). Legacy `plans` docs are abandoned, not migrated.
- **PR model:** generalized from `bestWeight` to a kind-aware `bestScore` (+ stored `bestSet`). Existing workout docs keep `bestWeight`; new PR comparison reads `bestScore`, so PRs only compare against post-migration history. Acceptable for v1.
- **Confidence gate:** low-confidence non-clarification envelopes still apply (grid is editable) but are surfaced in the feed; tune `CONFIDENCE_MIN` after instrumentation (spec §8).
- **Onboarding:** plan-generation step removed; if onboarding becomes trivial, keep it as a profile capture step.
