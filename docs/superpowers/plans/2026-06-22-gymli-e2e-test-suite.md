# Gymli E2E Smoke Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an on-demand E2E regression smoke suite for the Expo app covering 4 asserted critical-path flows plus a login precondition, mirrored across Playwright (web export) and Maestro (Android native), running locally against the existing dev backend with self-cleaning test data.

**Architecture:** A single shared `testID` registry (`apps/mobile/lib/test-ids.ts`) is the source of truth for selectors; both suites live under `apps/mobile/e2e/` and reference the same constant strings (Playwright via `getByTestId`, Maestro via `id:`). Each test logs in through the real UI (precondition helper), seeds its own uniquely-suffixed data via the authenticated REST API, drives the UI, asserts on app state, and tears its data down failure-safely. AI flows (conversational log) assert on resulting app state only, never on AI reply wording.

**Tech Stack:** Expo SDK 56 (RN 0.85, React 19.2, New Arch, Hermes), TypeScript; Playwright (Chromium, web-first auto-retrying assertions); Maestro (YAML flows, Android); `@gymli/shared` axios client; Firebase Auth REST (`signInWithPassword`) for Node-side teardown auth.

## Global Constraints

- **Expo SDK 56 has changed significantly.** `apps/mobile/AGENTS.md` mandates: read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any app or test code that touches Expo APIs (especially `expo export`, `expo-constants`, routing).
- **Selectors are one shared vocabulary.** Every selector used by either suite MUST be a constant defined in `apps/mobile/lib/test-ids.ts`. Never inline a raw selector string in a spec or YAML flow — reference the registry value. React Native forwards `testID` → `data-testid` (web DOM) and the native accessibility id (Android): one prop, both platforms, identical string.
- **No new infra.** Use the existing **dev** Cloud Run backend + dev Firestore. No mocks, no emulator backend, no seeded test DB.
- **Auth is email/password only** (no Google). Test user is a permanently-onboarded dev account so flows skip onboarding. Creds come from gitignored `apps/mobile/e2e/.env.e2e` (`E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`); a `.env.e2e.example` is committed. The `.env.e2e` also carries `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_FIREBASE_CONFIG` (a JSON string; the test-data helper parses out `apiKey`).
- **Self-cleaning test data.** Each test creates uniquely-suffixed entities (e.g. `E2E Routine <timestamp>`) and deletes them via the authenticated API in failure-safe teardown. The dev DB must show zero leftover E2E data after a run.
- **AI flows assert on app STATE, never exact AI reply wording.** Use generous timeouts for flows making real Gemini calls.
- **Test-level retry = 1.** Genuine failures must surface rather than be masked.
- **CI-ready, not CI-wired.** Structure must be env-driven so GitHub Actions / EAS Workflows can be added later with zero rework, but add NO CI config in this build.
- **No iOS.** Android (Maestro) + web (Playwright) only.
- **Naming:** files kebab-case, components PascalCase, variables camelCase, conventional commits.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/mobile/lib/test-ids.ts` | Single source of truth: `TestIds` registry of selector constants + helpers for per-item IDs. |
| `apps/mobile/components/ui/SegmentedControl.tsx` (modify) | Forward `testID` + emit per-option `${testID}-${value}`. |
| `apps/mobile/components/ui/Stat.tsx` (modify) | Forward `testID` to its root `View`. |
| (verify) `Button.tsx`, `Chip.tsx`, `Card.tsx`, `Input.tsx` | Already spread props to their primitive; confirm `testID` passes through. |
| ~12 screen/component files (modify) | Apply `testID={TestIds.X}` to the elements the flows touch. |
| `apps/mobile/e2e/.env.e2e.example` | Committed template of required env vars. |
| `apps/mobile/e2e/.gitignore` | Ignores real `.env.e2e`. |
| `apps/mobile/e2e/README.md` | Emulator + dev-APK setup, env, how to run. |
| `apps/mobile/e2e/playwright/playwright.config.ts` | webServer builds+serves web export; Chromium project; retry=1. |
| `apps/mobile/e2e/playwright/fixtures/env.ts` | Loads `.env.e2e`, exposes typed config. |
| `apps/mobile/e2e/playwright/fixtures/auth.ts` | UI login helper fixture (drives real login UI). |
| `apps/mobile/e2e/playwright/fixtures/test-data.ts` | REST `signInWithPassword` → authenticated `@gymli/shared` client for setup/teardown. |
| `apps/mobile/e2e/playwright/fixtures/test.ts` | Composed Playwright `test` extending auth + test-data fixtures. |
| `apps/mobile/e2e/playwright/flows/*.spec.ts` | One spec per asserted flow (+ smoke). |
| `apps/mobile/e2e/maestro/config.yaml` | appId `com.getgymli.dev`, flow includes, env. |
| `apps/mobile/e2e/maestro/helpers/login.yaml` | Login subflow driving real login UI with env creds. |
| `apps/mobile/e2e/maestro/flows/*.yaml` | One flow per asserted flow, mirroring the Playwright specs. |
| root `package.json` + `apps/mobile/package.json` (modify) | `e2e:web`, `e2e:android`, `e2e` scripts. |

---

## Task 1: testID foundation — registry + component fixes + element tagging

**Files:**
- Create: `apps/mobile/lib/test-ids.ts`
- Modify: `apps/mobile/components/ui/SegmentedControl.tsx`
- Modify: `apps/mobile/components/ui/Stat.tsx`
- Verify (modify only if needed): `apps/mobile/components/ui/Button.tsx`, `Chip.tsx`, `Card.tsx`, `Input.tsx`
- Modify: `apps/mobile/app/login.tsx`, `apps/mobile/app/(tabs)/log.tsx`, `apps/mobile/components/routine/RoutineEditor.tsx`, `apps/mobile/components/log/ExercisePicker.tsx`, `apps/mobile/app/session.tsx`, `apps/mobile/components/workout/SetRow.tsx`, `apps/mobile/components/workout/ExerciseCard.tsx`, `apps/mobile/components/workout/WorkoutSummary.tsx`, `apps/mobile/components/workout/LogInput.tsx`, `apps/mobile/components/workout/LogFeed.tsx`, `apps/mobile/app/(tabs)/progress.tsx`, `apps/mobile/components/progress/ExerciseChart.tsx`, `apps/mobile/app/(tabs)/profile.tsx`

**Interfaces:**
- Produces: `TestIds` (object of string constants) and helpers `exerciseResultId(i: number)`, `setRowWeightId(i: number)`, `setRowRepsId(setIndex: number, fieldIndex: number)`, `setRowCompleteId(i: number)`, `routineRowId(name: string)`, `strengthChipId(exerciseId: string)`, `progressTabId(value: string)`. Every spec (Tasks 3–7) and Maestro flow (Tasks 9–13) reference these string values.

- [ ] **Step 1: Read the Expo SDK 56 docs for any API touched here**

Per Global Constraints, before editing app code skim https://docs.expo.dev/versions/v56.0.0/ for `testID` / accessibility forwarding behavior on RN 0.85 + New Arch. No API change is expected (this task only adds props), but confirm `testID` still maps to `data-testid` on `react-native-web` 0.21. Note findings in the commit body.

- [ ] **Step 2: Create the testID registry**

Create `apps/mobile/lib/test-ids.ts`:

```ts
// Single source of truth for E2E selector IDs.
// React Native forwards `testID` -> `data-testid` (web) and the native
// accessibility id (Android). Playwright uses getByTestId(value); Maestro
// uses `id: value`. Both reference the SAME string from this file.

export const TestIds = {
  // login
  LOGIN_EMAIL: 'login-email',
  LOGIN_PASSWORD: 'login-password',
  LOGIN_SUBMIT: 'login-submit',

  // log tab
  NEW_ROUTINE_BTN: 'new-routine-btn',

  // routine editor
  ROUTINE_NAME_INPUT: 'routine-name-input',
  ROUTINE_ADD_EXERCISE_BTN: 'routine-add-exercise-btn',
  ROUTINE_SAVE_BTN: 'routine-save-btn',

  // exercise picker
  EXERCISE_SEARCH_INPUT: 'exercise-search-input',

  // session
  SESSION_ADD_EXERCISE_BTN: 'session-add-exercise-btn',
  SESSION_END_BTN: 'session-end-btn',
  ADD_SET_BTN: 'add-set-btn',

  // workout summary
  SUMMARY_VOLUME: 'summary-volume',
  SUMMARY_SETS: 'summary-sets',
  SUMMARY_DONE_BTN: 'summary-done-btn',

  // conversational log
  LOG_INPUT: 'log-input',
  LOG_SEND_BTN: 'log-send-btn',

  // progress
  PROGRESS_TAB: 'progress-tab',
  STREAK_CALENDAR: 'streak-calendar',
  WEEK_STATS_CARD: 'week-stats-card',
  EXERCISE_CHART: 'exercise-chart',

  // profile
  PROFILE_DISPLAY_NAME_INPUT: 'profile-display-name-input',
  PROFILE_SAVED_INDICATOR: 'profile-saved-indicator',
} as const;

// Per-item ID helpers (lists / loops).
export const exerciseResultId = (i: number) => `exercise-result-${i}`;
export const routineRowId = (name: string) => `routine-row-${name}`;
export const setRowWeightId = (i: number) => `set-row-weight-${i}`;
export const setRowRepsId = (setIndex: number, fieldIndex: number) =>
  `set-row-reps-${setIndex}-${fieldIndex}`;
export const setRowCompleteId = (i: number) => `set-row-complete-${i}`;
export const strengthChipId = (exerciseId: string) => `strength-chip-${exerciseId}`;
// SegmentedControl emits per-option `${testID}-${value}`.
export const progressTabId = (value: string) => `${TestIds.PROGRESS_TAB}-${value}`;
```

- [ ] **Step 3: Make SegmentedControl forward testID (per-option)**

Modify `apps/mobile/components/ui/SegmentedControl.tsx`. Add `testID` to the prop type and emit a per-option testID on each `Pressable`:

```tsx
export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  testID,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      className={cn(
        'flex-row p-1 rounded-xl bg-surface-alt dark:bg-surface-dark',
        className
      )}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          testID={testID ? `${testID}-${option.value}` : undefined}
          onPress={() => onChange(option.value)}
```

(Leave the rest of the `Pressable`/`Text` body unchanged.)

- [ ] **Step 4: Make Stat forward testID**

Modify `apps/mobile/components/ui/Stat.tsx`. Add `testID` to the prop type and pass it to the root `View`:

```tsx
export function Stat({
  value,
  label,
  trend,
  icon: Icon,
  className,
  testID,
}: {
  value: React.ReactNode;
  label: string;
  trend?: Trend;
  icon?: ComponentType<IconProps>;
  className?: string;
  testID?: string;
}) {
  const TrendIcon = trend ? trendIcons[trend] : null;
  return (
    <View testID={testID} className={cn('flex flex-col', className)}>
```

(Leave the body unchanged.)

- [ ] **Step 5: Verify Button / Chip / Card / Input already forward testID**

These spread their remaining props to the underlying primitive, so `testID` passes through with no change required. Confirm by inspection:
- `Button.tsx` — `<Pressable ... {...rest}>` (rest includes `testID` via `PressableProps`). No change.
- `Chip.tsx` — `<Pressable ... {...rest}>`. No change.
- `Card.tsx` — `<View ... {...props}>` (props includes `testID` via `ViewProps`). No change.
- `Input.tsx` — `<TextInput ... {...props}>` (props includes `testID` via `TextInputProps`). No change.

If any no longer spreads to its primitive, add `testID` explicitly. Document the verification in the commit body.

- [ ] **Step 6: Tag login screen elements**

Modify `apps/mobile/app/login.tsx`. Add the import and `testID`s on the two `TextInput`s and the sign-in `Pressable`:

```tsx
import { TestIds } from '../lib/test-ids';
```

Email input:
```tsx
        <TextInput
          testID={TestIds.LOGIN_EMAIL}
          className="rounded-xl bg-surface-alt px-4 min-h-12 text-base dark:bg-surface-dark dark:text-zinc-50"
          placeholder="Email"
```
Password input:
```tsx
        <TextInput
          testID={TestIds.LOGIN_PASSWORD}
          className="rounded-xl bg-surface-alt px-4 min-h-12 text-base dark:bg-surface-dark dark:text-zinc-50"
          placeholder="Password"
```
Sign-in Pressable (the first one, with `onPress={() => run(...)}`):
```tsx
        <Pressable
          testID={TestIds.LOGIN_SUBMIT}
          className="rounded-xl bg-primary min-h-14 items-center justify-center"
```

- [ ] **Step 7: Tag the Log tab — New routine button + routine rows**

Modify `apps/mobile/app/(tabs)/log.tsx`. Import the registry and helper, tag the "New routine" `<Button>` and each routine row `<View>`:

```tsx
import { TestIds, routineRowId } from '../../lib/test-ids';
```
"New routine" button (~L120):
```tsx
        <Button testID={TestIds.NEW_ROUTINE_BTN} ...existing props>
```
Each routine row `<View>` (~L142) — derive the row id from the routine name so a spec can locate a specifically-named routine:
```tsx
        <View testID={routineRowId(routine.name)} ...existing props>
```
(Use the actual variable in scope for the row item — if it is not `routine`, substitute the real name, e.g. `item.name`.)

- [ ] **Step 8: Tag RoutineEditor**

Modify `apps/mobile/components/routine/RoutineEditor.tsx`:
```tsx
import { TestIds } from '../../lib/test-ids';
```
Name `<TextInput>` (~L102):
```tsx
        <TextInput testID={TestIds.ROUTINE_NAME_INPUT} ...existing props>
```
"Add exercise" `<Pressable>` (~L141):
```tsx
        <Pressable testID={TestIds.ROUTINE_ADD_EXERCISE_BTN} ...existing props>
```
"Save routine" `<Button>` (~L152):
```tsx
        <Button testID={TestIds.ROUTINE_SAVE_BTN} ...existing props>
```

- [ ] **Step 9: Tag ExercisePicker — search + result rows**

Modify `apps/mobile/components/log/ExercisePicker.tsx`:
```tsx
import { TestIds, exerciseResultId } from '../../lib/test-ids';
```
Search `<TextInput>` (~L128):
```tsx
        <TextInput testID={TestIds.EXERCISE_SEARCH_INPUT} ...existing props>
```
Each exercise result `<Pressable onPress={() => onSelect(ex)}>` (~L96). Tag by render index so a spec can pick the first result deterministically. If the `.map` callback does not already expose an index, add it (`(ex, i) =>`):
```tsx
          <Pressable testID={exerciseResultId(i)} onPress={() => onSelect(ex)} ...existing props>
```

- [ ] **Step 10: Tag session screen**

Modify `apps/mobile/app/session.tsx`:
```tsx
import { TestIds } from '../lib/test-ids';
```
"Add exercise" `<Pressable>` (~L647):
```tsx
        <Pressable testID={TestIds.SESSION_ADD_EXERCISE_BTN} ...existing props>
```
"End Workout" `<Button>` (~L705):
```tsx
        <Button testID={TestIds.SESSION_END_BTN} ...existing props>
```

- [ ] **Step 11: Tag SetRow — weight, reps, completion**

Modify `apps/mobile/components/workout/SetRow.tsx`:
```tsx
import { setRowWeightId, setRowRepsId, setRowCompleteId } from '../../lib/test-ids';
```
This row renders one set. Use the set's index prop (the component receives an index — if it is named differently, substitute it; if absent, add an `index: number` prop and pass it from `ExerciseCard`). Weight `<TextInput>` (~L48):
```tsx
        <TextInput testID={setRowWeightId(index)} ...existing props>
```
Reps `<TextInput>` inside the field loop (~L64), keyed by `field.key` with loop index `fieldIndex`:
```tsx
          <TextInput testID={setRowRepsId(index, fieldIndex)} ...existing props>
```
(If the loop callback lacks an index, add it: `fields.map((field, fieldIndex) => ...)`.)
Completion `<Pressable onPress={() => handleChange('completed', ...)}>` (~L80):
```tsx
        <Pressable testID={setRowCompleteId(index)} ...existing props>
```

- [ ] **Step 12: Tag ExerciseCard — Add Set + pass index to SetRow**

Modify `apps/mobile/components/workout/ExerciseCard.tsx`:
```tsx
import { TestIds } from '../../lib/test-ids';
```
"Add Set" `<Pressable>` (~L148):
```tsx
        <Pressable testID={TestIds.ADD_SET_BTN} ...existing props>
```
Where this component renders `<SetRow .../>` in a loop, ensure it passes the set's `index` so SetRow's testIDs (Step 11) resolve:
```tsx
        {sets.map((set, index) => (
          <SetRow key={set.id} index={index} ...existing props />
        ))}
```
(Substitute the real list variable / key if different.)

- [ ] **Step 13: Tag WorkoutSummary — volume, sets, Done**

Modify `apps/mobile/components/workout/WorkoutSummary.tsx`:
```tsx
import { TestIds } from '../../lib/test-ids';
```
Volume `<Stat>` (~L95):
```tsx
        <Stat testID={TestIds.SUMMARY_VOLUME} value={...} label="Volume" />
```
Sets `<Stat>` (~L98):
```tsx
        <Stat testID={TestIds.SUMMARY_SETS} value={...} label="Sets" />
```
"Done" `<Button>` (~L141):
```tsx
        <Button testID={TestIds.SUMMARY_DONE_BTN} ...existing props>
```

- [ ] **Step 14: Tag LogInput — text + send**

Modify `apps/mobile/components/workout/LogInput.tsx`:
```tsx
import { TestIds } from '../../lib/test-ids';
```
Text `<TextInput>` (~L39):
```tsx
        <TextInput testID={TestIds.LOG_INPUT} ...existing props>
```
Send `<Pressable onPress={submit}>` (~L53):
```tsx
        <Pressable testID={TestIds.LOG_SEND_BTN} onPress={submit} ...existing props>
```

- [ ] **Step 15: Tag progress tab**

Modify `apps/mobile/app/(tabs)/progress.tsx`:
```tsx
import { TestIds, strengthChipId } from '../../lib/test-ids';
```
Main `<SegmentedControl value={tab}>` (~L295):
```tsx
        <SegmentedControl testID={TestIds.PROGRESS_TAB} value={tab} ...existing props />
```
`<StreakCalendar/>` (~L69) — wrap it in a `View` carrying the testID (so the suite can assert it rendered) **or** forward `testID` if `StreakCalendar` already spreads props; simplest is a wrapper:
```tsx
        <View testID={TestIds.STREAK_CALENDAR}>
          <StreakCalendar ...existing props />
        </View>
```
Week-stats `<Card>` (~L81):
```tsx
        <Card testID={TestIds.WEEK_STATS_CARD} ...existing props>
```
Each Strength-tab `<Chip onPress={() => setSelectedId(ex.id)}>` (~L221):
```tsx
          <Chip testID={strengthChipId(ex.id)} onPress={() => setSelectedId(ex.id)} ...existing props>
```

- [ ] **Step 16: Tag ExerciseChart container**

Modify `apps/mobile/components/progress/ExerciseChart.tsx`:
```tsx
import { TestIds } from '../../lib/test-ids';
```
Chart container `<Card padding="none">` (~L45):
```tsx
      <Card testID={TestIds.EXERCISE_CHART} padding="none" ...existing props>
```

- [ ] **Step 17: Tag profile — display name + Saved indicator**

Modify `apps/mobile/app/(tabs)/profile.tsx`:
```tsx
import { TestIds } from '../../lib/test-ids';
```
Display Name `<Input>` (~L171):
```tsx
        <Input testID={TestIds.PROFILE_DISPLAY_NAME_INPUT} ...existing props>
```
"Saved" indicator `<View>` (~L157, rendered only when saved):
```tsx
          <View testID={TestIds.PROFILE_SAVED_INDICATOR} ...existing props>
```

- [ ] **Step 18: Typecheck the app**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: clean exit (no errors). Fix any prop-type mismatches (e.g. a component that still needs a `testID` prop added to its type).

- [ ] **Step 19: Grep-confirm testID coverage**

Run: `cd apps/mobile && grep -rn "testID=" app components lib/test-ids.ts | grep -E "TestIds\.|ResultId|RowId|ChipId|setRow|progressTab|routineRow" | wc -l`
Expected: a count of at least 24 (the registry usages applied across screens). Spot-check a couple of files with `grep -n testID app/login.tsx components/workout/SetRow.tsx`.

- [ ] **Step 20: Commit**

```bash
git add apps/mobile/lib/test-ids.ts apps/mobile/components apps/mobile/app
git commit -m "test(mobile): add shared testID registry and tag e2e flow elements"
```

---

## Task 2: Playwright scaffolding + smoke spec

**Files:**
- Create: `apps/mobile/e2e/.gitignore`
- Create: `apps/mobile/e2e/.env.e2e.example`
- Create: `apps/mobile/e2e/playwright/playwright.config.ts`
- Create: `apps/mobile/e2e/playwright/fixtures/env.ts`
- Create: `apps/mobile/e2e/playwright/fixtures/auth.ts`
- Create: `apps/mobile/e2e/playwright/fixtures/test-data.ts`
- Create: `apps/mobile/e2e/playwright/fixtures/test.ts`
- Create: `apps/mobile/e2e/playwright/flows/smoke.spec.ts`
- Modify: `apps/mobile/package.json` (add `e2e:web` script + devDeps)
- Modify: root `package.json` (add `e2e:web` passthrough)

**Interfaces:**
- Consumes: `TestIds`, `exerciseResultId`, `routineRowId`, etc. from Task 1.
- Produces:
  - `env` object `{ apiUrl: string; email: string; password: string; firebaseApiKey: string }` (from `fixtures/env.ts`).
  - `test` (extended Playwright test) exposing fixtures `login: (page) => Promise<void>` and `dataClient: ReturnType<typeof createServices>` plus `track: (cleanup: () => Promise<void>) => void` (from `fixtures/test.ts`). Specs in Tasks 3–7 import `{ test, expect }` from `../fixtures/test`.

- [ ] **Step 1: Read Expo SDK 56 web-export docs**

Per Global Constraints, confirm the exact `expo export` web command and output directory for SDK 56 at https://docs.expo.dev/versions/v56.0.0/. The app config uses `web.bundler: 'metro'` and `web.output: 'static'`, so `npx expo export -p web` emits a static site to `dist/`. Confirm the flag/output and note it in the commit body.

- [ ] **Step 2: Install Playwright + dotenv in the mobile workspace**

Run: `npm install -D -w apps/mobile @playwright/test dotenv`
Then install the Chromium browser binary:
Run: `npx -w apps/mobile playwright install chromium`
Expected: both succeed; `apps/mobile/package.json` devDependencies now list `@playwright/test` and `dotenv`.

- [ ] **Step 3: Create the e2e gitignore + env example**

Create `apps/mobile/e2e/.gitignore`:
```gitignore
.env.e2e
playwright/.cache/
playwright-report/
test-results/
dist/
```

Create `apps/mobile/e2e/.env.e2e.example`:
```bash
# Copy to .env.e2e (gitignored) and fill in.
# Dedicated, permanently-onboarded dev test account (email/password, NOT Google).
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=

# Same values the dev app uses.
EXPO_PUBLIC_API_URL=https://<dev-cloud-run-url>/api
# JSON string of the Firebase web config; the test-data helper parses out apiKey.
EXPO_PUBLIC_FIREBASE_CONFIG={"apiKey":"","authDomain":"","projectId":"","appId":""}
```

- [ ] **Step 4: Create the env fixture**

Create `apps/mobile/e2e/playwright/fixtures/env.ts`:
```ts
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// e2e/.env.e2e (two dirs up from fixtures/)
loadEnv({ path: resolve(__dirname, '../../.env.e2e') });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}. Copy e2e/.env.e2e.example to e2e/.env.e2e and fill it in.`);
  return v;
}

const firebaseConfig = JSON.parse(required('EXPO_PUBLIC_FIREBASE_CONFIG')) as { apiKey: string };

export const env = {
  apiUrl: required('EXPO_PUBLIC_API_URL'),
  email: required('E2E_TEST_EMAIL'),
  password: required('E2E_TEST_PASSWORD'),
  firebaseApiKey: firebaseConfig.apiKey,
};
```

- [ ] **Step 5: Create the test-data fixture (Node-side auth + cleanup client)**

Create `apps/mobile/e2e/playwright/fixtures/test-data.ts`:
```ts
import { createApiClient, createServices } from '@gymli/shared';
import { env } from './env';

// Exchange email/password for a Firebase ID token via the Auth REST API.
async function signInWithPassword(): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.email, password: env.password, returnSecureToken: true }),
    }
  );
  if (!res.ok) {
    throw new Error(`signInWithPassword failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { idToken: string };
  return json.idToken;
}

// Build an authenticated @gymli/shared services client for setup/teardown.
export async function createDataClient() {
  const idToken = await signInWithPassword();
  const client = createApiClient({
    baseURL: env.apiUrl,
    getToken: async () => idToken,
  });
  return createServices(client);
}

export type DataClient = Awaited<ReturnType<typeof createDataClient>>;

// Unique suffix so reruns/parallel never collide.
export const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
```

- [ ] **Step 6: Create the auth (login) fixture**

Create `apps/mobile/e2e/playwright/fixtures/auth.ts`:
```ts
import type { Page } from '@playwright/test';
import { TestIds } from '../../../lib/test-ids';
import { env } from './env';

// Drives the real login UI with env creds. Login is a precondition, NOT asserted.
export async function loginViaUi(page: Page): Promise<void> {
  await page.goto('/');
  const email = page.getByTestId(TestIds.LOGIN_EMAIL);
  await email.waitFor({ state: 'visible', timeout: 30_000 });
  await email.fill(env.email);
  await page.getByTestId(TestIds.LOGIN_PASSWORD).fill(env.password);
  await page.getByTestId(TestIds.LOGIN_SUBMIT).click();
  // Login succeeded once the login form is gone (tab UI present).
  await email.waitFor({ state: 'hidden', timeout: 30_000 });
}
```

- [ ] **Step 7: Create the composed test fixture**

Create `apps/mobile/e2e/playwright/fixtures/test.ts`:
```ts
import { test as base, expect } from '@playwright/test';
import { loginViaUi } from './auth';
import { createDataClient, type DataClient } from './test-data';

type Fixtures = {
  login: () => Promise<void>;
  dataClient: DataClient;
  track: (cleanup: () => Promise<void>) => void;
};

export const test = base.extend<Fixtures>({
  login: async ({ page }, use) => {
    await use(() => loginViaUi(page));
  },
  dataClient: async ({}, use) => {
    const client = await createDataClient();
    await use(client);
  },
  // Failure-safe teardown: registered cleanups run after the test regardless of outcome.
  track: async ({}, use) => {
    const cleanups: Array<() => Promise<void>> = [];
    await use((c) => { cleanups.push(c); });
    for (const c of cleanups.reverse()) {
      try { await c(); } catch (e) { console.warn('teardown cleanup failed:', e); }
    }
  },
});

export { expect };
```

- [ ] **Step 8: Create the Playwright config**

Create `apps/mobile/e2e/playwright/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// App root = apps/mobile (two dirs up from this config's dir: e2e/playwright/).
const APP_ROOT = resolve(__dirname, '../..');
const PORT = 4173;

export default defineConfig({
  testDir: './flows',
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build the static web export, then serve dist/ on PORT.
    command: `npx expo export -p web --output-dir dist && npx serve -s dist -l ${PORT}`,
    cwd: APP_ROOT,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 9: Add the `serve` dev dependency**

The webServer command uses `serve` to host the static export.
Run: `npm install -D -w apps/mobile serve`
Expected: success; `serve` appears in `apps/mobile/package.json` devDependencies.

- [ ] **Step 10: Write the smoke spec**

Create `apps/mobile/e2e/playwright/flows/smoke.spec.ts`:
```ts
import { test, expect } from '../fixtures/test';
import { TestIds } from '../../../lib/test-ids';

test('app boots and shows the login screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId(TestIds.LOGIN_EMAIL)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId(TestIds.LOGIN_SUBMIT)).toBeVisible();
});
```

- [ ] **Step 11: Add the `e2e:web` script to the mobile package**

Modify `apps/mobile/package.json` `scripts`:
```json
    "e2e:web": "playwright test --config e2e/playwright/playwright.config.ts"
```

- [ ] **Step 12: Add the root passthrough script**

Modify root `package.json` `scripts`:
```json
    "e2e:web": "npm run e2e:web -w apps/mobile"
```

- [ ] **Step 13: Run the smoke spec**

Ensure `apps/mobile/e2e/.env.e2e` exists (copied from the example, real values filled).
Run: `npm run e2e:web -- smoke.spec.ts`
Expected: webServer builds the export (first run is slow), Chromium loads the app, and `1 passed`. If the login screen never appears, the export served wrong content — verify `dist/index.html` exists after `npx expo export -p web`.

- [ ] **Step 14: Commit**

```bash
git add apps/mobile/e2e apps/mobile/package.json package.json
git commit -m "test(mobile): scaffold playwright e2e suite with smoke spec"
```

---

## Task 3: Playwright flow — Create routine

**Files:**
- Create: `apps/mobile/e2e/playwright/flows/create-routine.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect` (Task 2); `TestIds`, `exerciseResultId`, `routineRowId` (Task 1); `dataClient`, `track` fixtures; `api.searchExercises`, `api.getRoutines`, `api.deleteRoutine` (`@gymli/shared`).

- [ ] **Step 1: Write the flow spec**

Create `apps/mobile/e2e/playwright/flows/create-routine.spec.ts`:
```ts
import { test, expect } from '../fixtures/test';
import { TestIds, exerciseResultId, routineRowId } from '../../../lib/test-ids';

test('create a routine and see it in the Log list with correct name + exercise count', async ({
  page, login, dataClient, track,
}) => {
  const routineName = `E2E Routine ${Date.now()}`;

  // Failure-safe teardown: delete any routine matching our unique name.
  track(async () => {
    const routines = await dataClient.getRoutines();
    for (const r of routines.filter((x) => x.name === routineName)) {
      await dataClient.deleteRoutine(r.id);
    }
  });

  await login();

  // Open Log tab -> New routine.
  await page.getByTestId(TestIds.NEW_ROUTINE_BTN).click();

  // Name the routine.
  await page.getByTestId(TestIds.ROUTINE_NAME_INPUT).fill(routineName);

  // Add one exercise via the picker.
  await page.getByTestId(TestIds.ROUTINE_ADD_EXERCISE_BTN).click();
  await page.getByTestId(TestIds.EXERCISE_SEARCH_INPUT).fill('bench');
  await page.getByTestId(exerciseResultId(0)).click({ timeout: 15_000 });

  // Save.
  await page.getByTestId(TestIds.ROUTINE_SAVE_BTN).click();

  // Assert: routine row appears with the name and an exercise count of 1.
  const row = page.getByTestId(routineRowId(routineName));
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toContainText(routineName);
  await expect(row).toContainText('1 exercise');
});
```

- [ ] **Step 2: Run the flow**

Run: `npm run e2e:web -- create-routine.spec.ts`
Expected: `1 passed`. The teardown deletes the created routine. If the count text differs (e.g. "1 exercises"), adjust the `toContainText` to match the real copy rendered by `log.tsx`.

- [ ] **Step 3: Prove the assertion bites**

Temporarily change the assertion to expect a wrong name (`toContainText('NONEXISTENT')`), run the spec, confirm it FAILS, then revert.
Run: `npm run e2e:web -- create-routine.spec.ts`
Expected: with the wrong text the spec fails; reverted, it passes.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/e2e/playwright/flows/create-routine.spec.ts
git commit -m "test(mobile): playwright create-routine flow"
```

---

## Task 4: Playwright flow — Guided session + log sets

**Files:**
- Create: `apps/mobile/e2e/playwright/flows/session-log-sets.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`; `TestIds`, `exerciseResultId`, `setRowWeightId`, `setRowRepsId`, `setRowCompleteId` (Task 1); `dataClient`, `track`; `api.getWorkouts`, `api.deleteWorkout`.

- [ ] **Step 1: Write the flow spec**

Create `apps/mobile/e2e/playwright/flows/session-log-sets.spec.ts`:
```ts
import { test, expect } from '../fixtures/test';
import {
  TestIds, exerciseResultId, setRowWeightId, setRowRepsId, setRowCompleteId,
} from '../../../lib/test-ids';

test('run a guided session, log a set, finish, see volume + set count in summary', async ({
  page, login, dataClient, track,
}) => {
  const before = new Set<string>();

  // Capture pre-existing workout ids so teardown only deletes the one we create.
  track(async () => {
    const after = await dataClient.getWorkouts({});
    for (const w of after) {
      if (!before.has(w.id)) await dataClient.deleteWorkout(w.id);
    }
  });

  await login();
  (await dataClient.getWorkouts({})).forEach((w) => before.add(w.id));

  // Start a session and add an exercise.
  await page.getByTestId(TestIds.SESSION_ADD_EXERCISE_BTN).click();
  await page.getByTestId(TestIds.EXERCISE_SEARCH_INPUT).fill('bench');
  await page.getByTestId(exerciseResultId(0)).click({ timeout: 15_000 });

  // Log the first set: weight + reps, then mark complete.
  await page.getByTestId(setRowWeightId(0)).fill('100');
  await page.getByTestId(setRowRepsId(0, 0)).fill('5');
  await page.getByTestId(setRowCompleteId(0)).click();

  // Finish the workout.
  await page.getByTestId(TestIds.SESSION_END_BTN).click();

  // Assert summary state: volume = 100*5 = 500 present, sets count = 1.
  await expect(page.getByTestId(TestIds.SUMMARY_VOLUME)).toContainText('500', { timeout: 20_000 });
  await expect(page.getByTestId(TestIds.SUMMARY_SETS)).toContainText('1');

  await page.getByTestId(TestIds.SUMMARY_DONE_BTN).click();
});
```

- [ ] **Step 2: Run the flow**

Run: `npm run e2e:web -- session-log-sets.spec.ts`
Expected: `1 passed`. If the volume cell renders a formatted value (e.g. `500 kg` or `0.5k`), relax to `toContainText('500')` or assert the exact rendered token from `WorkoutSummary.tsx`. Confirm teardown deleted the workout (`getWorkouts` count returns to baseline).

- [ ] **Step 3: Prove the assertion bites**

Temporarily set the weight to `1`, run, confirm the volume assertion FAILS (volume becomes 5, not 500), then revert.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/e2e/playwright/flows/session-log-sets.spec.ts
git commit -m "test(mobile): playwright guided-session log-sets flow"
```

---

## Task 5: Playwright flow — Conversational log (AI, state-only)

**Files:**
- Create: `apps/mobile/e2e/playwright/flows/conversational-log.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`; `TestIds`, `setRowWeightId`, `setRowRepsId` (Task 1); `dataClient`, `track`; `api.getWorkouts`, `api.deleteWorkout`.

- [ ] **Step 1: Write the flow spec**

Create `apps/mobile/e2e/playwright/flows/conversational-log.spec.ts`:
```ts
import { test, expect } from '../fixtures/test';
import { TestIds, setRowWeightId, setRowRepsId } from '../../../lib/test-ids';

// AI flow: real Gemini call. Assert on resulting app STATE only; ignore reply wording.
test('conversational log "bench 225 5,5,4" produces a set row with weight 225 and reps 5/5/4', async ({
  page, login, dataClient, track,
}) => {
  const before = new Set<string>();
  track(async () => {
    const after = await dataClient.getWorkouts({});
    for (const w of after) {
      if (!before.has(w.id)) await dataClient.deleteWorkout(w.id);
    }
  });

  await login();
  (await dataClient.getWorkouts({})).forEach((w) => before.add(w.id));

  // Open the conversational log input on the session screen and submit.
  await page.getByTestId(TestIds.LOG_INPUT).fill('bench 225 5,5,4');
  await page.getByTestId(TestIds.LOG_SEND_BTN).click();

  // Generous timeout for the real Gemini parse. Assert STATE, not AI text.
  await expect(page.getByTestId(setRowWeightId(0))).toHaveValue('225', { timeout: 45_000 });
  await expect(page.getByTestId(setRowRepsId(0, 0))).toHaveValue('5');
  await expect(page.getByTestId(setRowRepsId(0, 1))).toHaveValue('5');
  await expect(page.getByTestId(setRowRepsId(0, 2))).toHaveValue('4');
});
```

- [ ] **Step 2: Run the flow**

Run: `npm run e2e:web -- conversational-log.spec.ts`
Expected: `1 passed`. Real Gemini latency makes this the slowest spec. If the parsed reps land on multiple rows (one set per rep group) rather than three fields on row 0, adjust to `setRowWeightId(0..2)` / `setRowRepsId(0,0)` per the actual `parseLog` → SetRow mapping. Never assert on any text emitted by `LogFeed`.

- [ ] **Step 3: Prove the assertion bites**

Temporarily change the typed text to `bench 100 5,5,4`, run, confirm the `toHaveValue('225')` assertion FAILS, then revert.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/e2e/playwright/flows/conversational-log.spec.ts
git commit -m "test(mobile): playwright conversational-log flow (state-only)"
```

---

## Task 6: Playwright flow — View progress

**Files:**
- Create: `apps/mobile/e2e/playwright/flows/view-progress.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`; `TestIds`, `strengthChipId`, `progressTabId` (Task 1); `dataClient`, `track`; `api.logWorkout`, `api.getWorkouts`, `api.getLoggedExercises`, `api.searchExercises`, `api.deleteWorkout`.

- [ ] **Step 1: Write the flow spec**

Create `apps/mobile/e2e/playwright/flows/view-progress.spec.ts`. Seed one logged workout via API so the Strength tab has an exercise with progress data, then assert renders:
```ts
import { test, expect } from '../fixtures/test';
import { TestIds, strengthChipId, progressTabId } from '../../../lib/test-ids';

test('progress overview shows streak + week stats; strength tab chart renders for an exercise', async ({
  page, login, dataClient, track,
}) => {
  // Seed a logged workout so progress has data. Find a real exercise first.
  const [exercise] = await dataClient.searchExercises({ q: 'bench' });
  expect(exercise, 'expected at least one exercise match for "bench"').toBeTruthy();

  const logged = await dataClient.logWorkout({
    name: `E2E Progress ${Date.now()}`,
    exercises: [
      {
        exerciseId: exercise.id,
        sets: [{ weight: 100, reps: 5, completed: true }],
      },
    ],
  });
  track(async () => { await dataClient.deleteWorkout(logged.id); });

  await login();

  // Go to Progress tab (bottom nav route).
  await page.goto('/progress');

  // Overview: streak calendar + week-stats card render.
  await expect(page.getByTestId(TestIds.STREAK_CALENDAR)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(TestIds.WEEK_STATS_CARD)).toBeVisible();

  // Switch to the Strength tab.
  await page.getByTestId(progressTabId('strength')).click();

  // Select our seeded exercise's chip; the chart renders.
  await page.getByTestId(strengthChipId(exercise.id)).click({ timeout: 15_000 });
  await expect(page.getByTestId(TestIds.EXERCISE_CHART)).toBeVisible({ timeout: 15_000 });
});
```

- [ ] **Step 2: Run the flow**

Run: `npm run e2e:web -- view-progress.spec.ts`
Expected: `1 passed`. Adjust two things to the real shapes if needed: the Strength tab option `value` (confirm it is `'strength'` in `progress.tsx`'s SegmentedControl options) and the `logWorkout` payload shape (match `api.logWorkout`'s actual `data` type from `@gymli/shared`). The `/progress` route comes from `app/(tabs)/progress.tsx`.

- [ ] **Step 3: Prove the assertion bites**

Temporarily assert `getByTestId('does-not-exist')` is visible, run, confirm FAIL, revert.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/e2e/playwright/flows/view-progress.spec.ts
git commit -m "test(mobile): playwright view-progress flow"
```

---

## Task 7: Playwright flow — Edit profile (debounced Saved)

**Files:**
- Create: `apps/mobile/e2e/playwright/flows/edit-profile.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`; `TestIds` (Task 1); `dataClient`, `track`; `api.getProfile`, `api.updateProfile`.

- [ ] **Step 1: Write the flow spec**

Create `apps/mobile/e2e/playwright/flows/edit-profile.spec.ts`. Restore the original display name in teardown so the dev account is left unchanged:
```ts
import { test, expect } from '../fixtures/test';
import { TestIds } from '../../../lib/test-ids';

test('editing the display name shows a debounced "Saved" indicator (no sign-out)', async ({
  page, login, dataClient, track,
}) => {
  // Remember the original name; restore it in teardown.
  const original = await dataClient.getProfile();
  const originalName = original.displayName ?? '';
  track(async () => { await dataClient.updateProfile({ displayName: originalName }); });

  const newName = `E2E ${Date.now()}`;

  await login();
  await page.goto('/profile');

  const input = page.getByTestId(TestIds.PROFILE_DISPLAY_NAME_INPUT);
  await input.fill(newName);

  // Debounced autosave -> "Saved" indicator appears. No sign-out.
  await expect(page.getByTestId(TestIds.PROFILE_SAVED_INDICATOR)).toBeVisible({ timeout: 15_000 });
  // Still on profile (not bounced to login).
  await expect(input).toBeVisible();
});
```

- [ ] **Step 2: Run the flow**

Run: `npm run e2e:web -- edit-profile.spec.ts`
Expected: `1 passed`. Confirm the profile field is named `displayName` in `api.getProfile`/`updateProfile`; substitute the real field if different. The `/profile` route comes from `app/(tabs)/profile.tsx`.

- [ ] **Step 3: Prove the assertion bites**

Temporarily lower the Saved-indicator timeout to `10` ms (faster than the debounce), run, confirm it FAILS, then restore `15_000`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/e2e/playwright/flows/edit-profile.spec.ts
git commit -m "test(mobile): playwright edit-profile flow"
```

---

## Task 8: Maestro scaffolding + login helper

**Files:**
- Create: `apps/mobile/e2e/maestro/config.yaml`
- Create: `apps/mobile/e2e/maestro/helpers/login.yaml`
- Create: `apps/mobile/e2e/maestro/flows/smoke.yaml`
- Create: `apps/mobile/e2e/README.md`
- Modify: `apps/mobile/package.json` (add `e2e:android`)
- Modify: root `package.json` (add `e2e:android` passthrough)

**Interfaces:**
- Consumes: `TestIds` string VALUES from Task 1 (referenced as literal `id:` selectors — Maestro cannot import TS, so the README pins the rule "keep these strings in sync with `lib/test-ids.ts`").
- Produces: `helpers/login.yaml` runnable subflow used by Tasks 9–13.

- [ ] **Step 1: Read Expo SDK 56 dev-build docs**

Confirm at https://docs.expo.dev/versions/v56.0.0/ how to produce/install a development build (dev APK, appId `com.getgymli.dev`) for Android. Maestro drives that installed dev build. Note the build command in the README.

- [ ] **Step 2: Create the Maestro config**

Create `apps/mobile/e2e/maestro/config.yaml`:
```yaml
appId: com.getgymli.dev
# Env vars are passed at run time via: maestro test -e KEY=VALUE ...
# (sourced from .env.e2e by the npm script). Flows reference them as ${E2E_TEST_EMAIL}.
flows:
  - flows/*.yaml
```

- [ ] **Step 3: Create the login helper subflow**

Create `apps/mobile/e2e/maestro/helpers/login.yaml`. Selector strings MUST equal the `TestIds` values from Task 1:
```yaml
appId: com.getgymli.dev
---
# Reusable login precondition. NOT asserted — just establishes a session.
- launchApp:
    clearState: false
- runFlow:
    when:
      visible:
        id: "login-email"
    commands:
      - tapOn:
          id: "login-email"
      - inputText: ${E2E_TEST_EMAIL}
      - tapOn:
          id: "login-password"
      - inputText: ${E2E_TEST_PASSWORD}
      - tapOn:
          id: "login-submit"
      - extendedWaitUntil:
          notVisible:
            id: "login-email"
          timeout: 30000
```

- [ ] **Step 4: Create the Maestro smoke flow**

Create `apps/mobile/e2e/maestro/flows/smoke.yaml`:
```yaml
appId: com.getgymli.dev
---
- launchApp:
    clearState: true
- assertVisible:
    id: "login-email"
- assertVisible:
    id: "login-submit"
```

- [ ] **Step 5: Add the `e2e:android` script (mobile package)**

The script sources `.env.e2e` and passes creds to Maestro. Modify `apps/mobile/package.json` `scripts`:
```json
    "e2e:android": "set -a && . ./e2e/.env.e2e && set +a && maestro test e2e/maestro/flows -e E2E_TEST_EMAIL=$E2E_TEST_EMAIL -e E2E_TEST_PASSWORD=$E2E_TEST_PASSWORD"
```

- [ ] **Step 6: Add the root passthrough script**

Modify root `package.json` `scripts`:
```json
    "e2e:android": "npm run e2e:android -w apps/mobile"
```

- [ ] **Step 7: Write the e2e README**

Create `apps/mobile/e2e/README.md`:
```markdown
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
```

- [ ] **Step 8: Run the Maestro smoke flow**

With an emulator running and the dev build installed:
Run: `cd apps/mobile && maestro test e2e/maestro/flows/smoke.yaml`
Expected: flow passes — both `assertVisible` checks on the login screen succeed. If the app id is wrong, Maestro errors that the app is not installed — confirm `com.getgymli.dev` is installed (`adb shell pm list packages | grep getgymli`).

- [ ] **Step 9: Run the login helper against the dev build**

Create a temporary flow that includes the helper, or run it directly:
Run: `cd apps/mobile && set -a && . ./e2e/.env.e2e && set +a && maestro test e2e/maestro/helpers/login.yaml -e E2E_TEST_EMAIL=$E2E_TEST_EMAIL -e E2E_TEST_PASSWORD=$E2E_TEST_PASSWORD`
Expected: launches, fills creds, submits, and the login email field disappears (logged in). This validates the precondition helper.

- [ ] **Step 10: Commit**

```bash
git add apps/mobile/e2e/maestro apps/mobile/e2e/README.md apps/mobile/package.json package.json
git commit -m "test(mobile): scaffold maestro e2e suite + login helper + README"
```

---

## Task 9: Maestro flow — Create routine

**Files:**
- Create: `apps/mobile/e2e/maestro/flows/create-routine.yaml`

**Interfaces:**
- Consumes: `helpers/login.yaml` (Task 8); selector strings mirroring `TestIds` (Task 1).

> **Note on teardown:** Maestro flows cannot run the Node `@gymli/shared` teardown directly. Mirrored Maestro flows leave their created entities for the **Playwright** teardown (same dev account) OR are run ad hoc; the README's selector-sync rule plus unique names keep reruns collision-free. Use a unique routine name via Maestro's timestamp output.

- [ ] **Step 1: Write the mirrored flow**

Create `apps/mobile/e2e/maestro/flows/create-routine.yaml`:
```yaml
appId: com.getgymli.dev
---
- runFlow: ../helpers/login.yaml
- evalScript: ${output.routineName = 'E2E Routine ' + Date.now()}
- tapOn:
    id: "new-routine-btn"
- tapOn:
    id: "routine-name-input"
- inputText: ${output.routineName}
- tapOn:
    id: "routine-add-exercise-btn"
- tapOn:
    id: "exercise-search-input"
- inputText: "bench"
- tapOn:
    id: "exercise-result-0"
- tapOn:
    id: "routine-save-btn"
- assertVisible:
    id: "routine-row-${output.routineName}"
- assertVisible:
    text: ".*1 exercise.*"
```

- [ ] **Step 2: Run it**

Run: `cd apps/mobile && set -a && . ./e2e/.env.e2e && set +a && maestro test e2e/maestro/flows/create-routine.yaml -e E2E_TEST_EMAIL=$E2E_TEST_EMAIL -e E2E_TEST_PASSWORD=$E2E_TEST_PASSWORD`
Expected: pass. If the count copy differs, fix the `text:` regex to the real string. Compare behavior to the Playwright equivalent (Task 3) — a divergence here is the suite's whole point.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/e2e/maestro/flows/create-routine.yaml
git commit -m "test(mobile): maestro create-routine flow (mirrors playwright)"
```

---

## Task 10: Maestro flow — Guided session + log sets

**Files:**
- Create: `apps/mobile/e2e/maestro/flows/session-log-sets.yaml`

**Interfaces:**
- Consumes: `helpers/login.yaml`; selector strings mirroring `TestIds`, `exerciseResultId`, `setRow*` (Task 1).

- [ ] **Step 1: Write the mirrored flow**

Create `apps/mobile/e2e/maestro/flows/session-log-sets.yaml`:
```yaml
appId: com.getgymli.dev
---
- runFlow: ../helpers/login.yaml
- tapOn:
    id: "session-add-exercise-btn"
- tapOn:
    id: "exercise-search-input"
- inputText: "bench"
- tapOn:
    id: "exercise-result-0"
- tapOn:
    id: "set-row-weight-0"
- inputText: "100"
- tapOn:
    id: "set-row-reps-0-0"
- inputText: "5"
- tapOn:
    id: "set-row-complete-0"
- tapOn:
    id: "session-end-btn"
- extendedWaitUntil:
    visible:
      id: "summary-volume"
    timeout: 20000
- assertVisible:
    id: "summary-volume"
- assertVisible:
    text: ".*500.*"
- assertVisible:
    id: "summary-sets"
- tapOn:
    id: "summary-done-btn"
```

- [ ] **Step 2: Run it**

Run: `cd apps/mobile && set -a && . ./e2e/.env.e2e && set +a && maestro test e2e/maestro/flows/session-log-sets.yaml -e E2E_TEST_EMAIL=$E2E_TEST_EMAIL -e E2E_TEST_PASSWORD=$E2E_TEST_PASSWORD`
Expected: pass; the `.*500.*` text assertion confirms volume = 100×5. Compare to Task 4.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/e2e/maestro/flows/session-log-sets.yaml
git commit -m "test(mobile): maestro session log-sets flow (mirrors playwright)"
```

---

## Task 11: Maestro flow — Conversational log (state-only)

**Files:**
- Create: `apps/mobile/e2e/maestro/flows/conversational-log.yaml`

**Interfaces:**
- Consumes: `helpers/login.yaml`; selector strings mirroring `TestIds`, `setRow*`.

- [ ] **Step 1: Write the mirrored flow**

Create `apps/mobile/e2e/maestro/flows/conversational-log.yaml`. Real Gemini call → generous wait; assert STATE, never AI text:
```yaml
appId: com.getgymli.dev
---
- runFlow: ../helpers/login.yaml
- tapOn:
    id: "log-input"
- inputText: "bench 225 5,5,4"
- tapOn:
    id: "log-send-btn"
# Generous wait for the real Gemini parse; assert resulting set-row state only.
- extendedWaitUntil:
    visible:
      id: "set-row-weight-0"
    timeout: 45000
- assertVisible:
    id: "set-row-weight-0"
- assertVisible:
    text: "225"
- assertVisible:
    id: "set-row-reps-0-0"
- assertVisible:
    id: "set-row-reps-0-1"
- assertVisible:
    id: "set-row-reps-0-2"
```

- [ ] **Step 2: Run it**

Run: `cd apps/mobile && set -a && . ./e2e/.env.e2e && set +a && maestro test e2e/maestro/flows/conversational-log.yaml -e E2E_TEST_EMAIL=$E2E_TEST_EMAIL -e E2E_TEST_PASSWORD=$E2E_TEST_PASSWORD`
Expected: pass. If the parse maps reps onto separate rows (one set per rep group), mirror whatever Task 5 settled on. Never assert any `LogFeed` text.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/e2e/maestro/flows/conversational-log.yaml
git commit -m "test(mobile): maestro conversational-log flow (state-only)"
```

---

## Task 12: Maestro flow — View progress

**Files:**
- Create: `apps/mobile/e2e/maestro/flows/view-progress.yaml`

**Interfaces:**
- Consumes: `helpers/login.yaml`; selector strings mirroring `TestIds`, `progressTabId`, `strengthChipId`.

> **Note:** Maestro can't pre-seed data via the Node API. This flow assumes the dev test account already has at least one logged exercise (the Playwright `view-progress` run, Task 6, seeds + tears down; for a clean account, run this flow after a manual log or right after Task 10's session). It asserts overview renders + a strength chip → chart. Because `strengthChipId(exerciseId)` needs a concrete id, select the **first** chip via `index` instead.

- [ ] **Step 1: Write the mirrored flow**

Create `apps/mobile/e2e/maestro/flows/view-progress.yaml`:
```yaml
appId: com.getgymli.dev
---
- runFlow: ../helpers/login.yaml
# Navigate to the Progress tab by its bottom-nav label.
- tapOn: "Progress"
- assertVisible:
    id: "streak-calendar"
- assertVisible:
    id: "week-stats-card"
- tapOn:
    id: "progress-tab-strength"
# Select the first strength chip (id prefix match), then assert the chart renders.
- tapOn:
    id: "strength-chip-.*"
- extendedWaitUntil:
    visible:
      id: "exercise-chart"
    timeout: 15000
- assertVisible:
    id: "exercise-chart"
```

- [ ] **Step 2: Run it**

Run: `cd apps/mobile && set -a && . ./e2e/.env.e2e && set +a && maestro test e2e/maestro/flows/view-progress.yaml -e E2E_TEST_EMAIL=$E2E_TEST_EMAIL -e E2E_TEST_PASSWORD=$E2E_TEST_PASSWORD`
Expected: pass when the account has progress data. Confirm the bottom-nav label is exactly `Progress` (else fix the `tapOn:` text). Compare to Task 6.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/e2e/maestro/flows/view-progress.yaml
git commit -m "test(mobile): maestro view-progress flow (mirrors playwright)"
```

---

## Task 13: Maestro flow — Edit profile + `e2e` aggregate script

**Files:**
- Create: `apps/mobile/e2e/maestro/flows/edit-profile.yaml`
- Modify: `apps/mobile/package.json` (add aggregate `e2e`)
- Modify: root `package.json` (add aggregate `e2e`)
- Modify: `apps/mobile/e2e/README.md` (final pass)

**Interfaces:**
- Consumes: `helpers/login.yaml`; selector strings mirroring `TestIds`.

- [ ] **Step 1: Write the mirrored flow**

Create `apps/mobile/e2e/maestro/flows/edit-profile.yaml`:
```yaml
appId: com.getgymli.dev
---
- runFlow: ../helpers/login.yaml
- tapOn: "Profile"
- evalScript: ${output.newName = 'E2E ' + Date.now()}
- tapOn:
    id: "profile-display-name-input"
- inputText: ${output.newName}
- hideKeyboard
# Debounced autosave -> "Saved" indicator appears. No sign-out.
- extendedWaitUntil:
    visible:
      id: "profile-saved-indicator"
    timeout: 15000
- assertVisible:
    id: "profile-saved-indicator"
- assertVisible:
    id: "profile-display-name-input"
```

- [ ] **Step 2: Run it**

Run: `cd apps/mobile && set -a && . ./e2e/.env.e2e && set +a && maestro test e2e/maestro/flows/edit-profile.yaml -e E2E_TEST_EMAIL=$E2E_TEST_EMAIL -e E2E_TEST_PASSWORD=$E2E_TEST_PASSWORD`
Expected: pass. Confirm bottom-nav label `Profile`. This flow renames the dev account's display name; the mirrored Playwright run (Task 7) restores it, or restore manually. Compare to Task 7.

- [ ] **Step 3: Add the aggregate `e2e` script (mobile package)**

Modify `apps/mobile/package.json` `scripts`:
```json
    "e2e": "npm run e2e:web && npm run e2e:android"
```

- [ ] **Step 4: Add the root aggregate `e2e` script**

Modify root `package.json` `scripts`:
```json
    "e2e": "npm run e2e -w apps/mobile"
```

- [ ] **Step 5: Final README pass**

Append a "Flow inventory" table to `apps/mobile/e2e/README.md`:
```markdown
## Flow inventory

| Flow | Playwright spec | Maestro flow | AI? | Self-cleans (PW) |
|---|---|---|---|---|
| Login (precondition) | `fixtures/auth.ts` | `helpers/login.yaml` | no | n/a |
| Create routine | `flows/create-routine.spec.ts` | `flows/create-routine.yaml` | no | yes |
| Guided session + log sets | `flows/session-log-sets.spec.ts` | `flows/session-log-sets.yaml` | no | yes |
| Conversational log | `flows/conversational-log.spec.ts` | `flows/conversational-log.yaml` | yes | yes |
| View progress | `flows/view-progress.spec.ts` | `flows/view-progress.yaml` | no | yes (PW seeds+cleans) |
| Edit profile | `flows/edit-profile.spec.ts` | `flows/edit-profile.yaml` | no | yes (restores name) |

AI flows assert on resulting app **state**, never on AI reply wording.
```

- [ ] **Step 6: Run the full web suite end-to-end**

Run: `npm run e2e:web`
Expected: all Playwright specs (smoke + 5 flows) pass; teardown leaves no E2E data. Verify orphan-free:
Run: `cd apps/mobile && set -a && . ./e2e/.env.e2e && set +a && node -e "import('@gymli/shared').then(async ({createApiClient,createServices})=>{/* manual spot-check via getRoutines/getWorkouts if desired */})"`
(Or simply re-run `e2e:web`; a colliding leftover would fail `create-routine`.)

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/e2e/maestro/flows/edit-profile.yaml apps/mobile/e2e/README.md apps/mobile/package.json package.json
git commit -m "test(mobile): maestro edit-profile flow + aggregate e2e scripts + README"
```

---

## Task Dependency Graph

```
Task 1 (testID foundation)
   │
   ├─> Task 2 (Playwright scaffolding + smoke)
   │       ├─> Task 3 (create routine)
   │       ├─> Task 4 (session + log sets)
   │       ├─> Task 5 (conversational log)
   │       ├─> Task 6 (view progress)
   │       └─> Task 7 (edit profile)
   │
   └─> Task 8 (Maestro scaffolding + login helper)
           ├─> Task 9  (create routine)         [mirrors 3]
           ├─> Task 10 (session + log sets)      [mirrors 4]
           ├─> Task 11 (conversational log)      [mirrors 5]
           ├─> Task 12 (view progress)           [mirrors 6]
           └─> Task 13 (edit profile + e2e agg)  [mirrors 7]
```

- Task 1 blocks everything (selectors are the foundation).
- Tasks 2 and 8 are independent scaffolds; Playwright tasks (3–7) need only Task 2, Maestro tasks (9–13) need only Task 8.
- Within each suite the flow tasks are independent of each other and can be done in any order / parallel.
- Task 13 must be last (it adds the aggregate `e2e` script that runs both suites).
