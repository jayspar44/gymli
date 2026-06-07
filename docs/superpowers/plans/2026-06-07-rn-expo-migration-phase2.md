# Gymli RN + Expo Migration — Phase 2 (Screen Breadth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the remaining screens/components from the React/Vite frontend to the Expo app at behavior parity, so the dev app and web show the full feature set (Log + conversational logging, Workout session, Progress + charts, Profile, Onboarding, Chat, routines).

**Architecture:** Mechanical conversion of existing React-DOM components (`frontend/src/`) into React Native + NativeWind, reusing `@gymli/shared` for all data access. The existing `.jsx` files are the authoritative behavioral spec; this plan supplies the conversion rules and full code only for genuinely-new pieces (charts, markdown renderer, navigation).

**Tech Stack:** Expo SDK 56, Expo Router, NativeWind 4, Reanimated 4, `@gorhom/bottom-sheet`, `react-native-gifted-charts`, `@shopify/flash-list`, `lucide-react-native`, `@gymli/shared`.

**Spec:** `docs/superpowers/specs/2026-06-06-react-native-expo-migration-design.md`
**Prior plan (Phase 0/1, completed):** `docs/superpowers/plans/2026-06-06-rn-expo-migration-phase0-1.md`

---

## Conversion Cheatsheet (apply in EVERY task)

DOM → React Native primitive:
| React DOM | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>`,`<span>`,`<h1..h3>`,raw text | `<Text>` (ALL text must be inside `<Text>`) |
| `<button onClick>` | `<Pressable onPress>` |
| `<input>` | `<TextInput>` |
| `<img src>` | `<Image>` from `expo-image` |
| scrollable `<div>` | `<ScrollView>` or `<FlashList>` (long/variable lists) |
| `onClick` | `onPress` · `onChange(e=>e.target.value)` | `onChangeText(v=>...)` |
| `navigate('/x')` (react-router) | `useRouter().push('/x')` (expo-router) |
| `framer-motion` `motion.*`/animations | `react-native-reanimated` (`Animated.View`, `useSharedValue`, `withTiming`) |
| `recharts` | `react-native-gifted-charts` |
| `vaul` Drawer | `@gorhom/bottom-sheet` |
| `lucide-react` icons | `lucide-react-native` (same names) |
| `.map()` long lists | `@shopify/flash-list` `<FlashList data renderItem estimatedItemSize? no>` (v2 needs no estimate) |

Styling: keep Tailwind `className` (NativeWind), but **replace CSS variables** with theme tokens already established in the slice:
| Old (CSS var) | New (NativeWind) |
|---|---|
| `text-[var(--color-text)]` | `text-zinc-900 dark:text-zinc-50` |
| `text-[var(--color-text-secondary)]` | `text-zinc-500` |
| `bg-[var(--color-surface)]` | `bg-white dark:bg-surface-dark` |
| `bg-[var(--color-surface-alt)]` | `bg-surface-alt dark:bg-surface-dark` |
| `bg-[var(--color-bg)]` | `bg-bg dark:bg-bg-dark` |
| `text-[var(--color-primary)]` / `bg-[...primary]` | `text-primary` / `bg-primary` |

Rules for every task:
- All user-visible strings wrapped in `<Text>`.
- Data via `import { api } from '../../lib/api'` (adjust depth) — never axios/fetch directly.
- Screens use `SafeAreaView` (from `react-native-safe-area-context`) with appropriate `edges`.
- Haptics: replace any web haptics with `expo-haptics` (`import * as Haptics from 'expo-haptics'`).
- Keep behavior identical to the source `.jsx` (loading/error/empty states, data flow, navigation targets).
- `as never` casts on `router.push`/`useSegments` are acceptable until typed-routes regenerate (existing pattern).
- After each task: `cd apps/mobile && NODE_ENV=development npx tsc --noEmit` must be clean.

Verification harness (used in tasks): the local web dev server is the fast smoke test. After a screen lands, load it at `http://localhost:4200` (start with `cd apps/mobile && NODE_ENV=development npx expo start --web --port 4200` if not running) and confirm it renders with **0 console errors** via the route.

---

## File Structure (created/modified in this plan)

```
apps/mobile/
├── components/ui/         # ported kit: Button, Card, Input, Badge, Chip, Stat,
│                          #   Skeleton, SegmentedControl, ProgressRing, BottomSheet
├── components/workout/    # ExerciseCard, SetRow, RestTimer, WorkoutSession,
│                          #   WorkoutSummary, LogInput, LogFeed
├── components/log/        # ExercisePicker, WorkoutHistoryItem, WorkoutHistoryList
├── components/progress/   # ExerciseChart, VolumeChart, StreakCalendar, PRBoard,
│                          #   GymliInsights, ExerciseSelector
├── components/chat/       # ChatFAB, ChatOverlay, ChatInput, ChatMessage, Markdown
├── components/routine/    # RoutineEditor
├── components/layout/     # TopBar, ProfileMenu (BottomNav → Expo Router Tabs)
├── app/(tabs)/_layout.tsx # 4 tabs + chat FAB
├── app/(tabs)/index.tsx   # Today (exists)
├── app/(tabs)/log.tsx     # Log screen
├── app/(tabs)/progress.tsx
├── app/(tabs)/profile.tsx
├── app/session.tsx        # active workout session (modal/stack route)
└── app/onboarding.tsx     # onboarding flow (stack route, gated)
```

Note: delete the leftover create-expo-app demo components (`components/animated-icon*`, `external-link.tsx`, `hint-row.tsx`, `themed-text.tsx`, `themed-view.tsx`, `web-badge.tsx`, `components/ui/collapsible.tsx`) in Task 1 — they're unused template cruft.

---

## Task 1: Port the UI kit + remove template cruft

**Source:** `frontend/src/components/ui/*.jsx` (Button, Card, Input, Badge, Chip, Stat, Skeleton, SegmentedControl, ProgressRing, BottomSheet)
**Create:** `apps/mobile/components/ui/{Button,Card,Input,Badge,Chip,Stat,Skeleton,SegmentedControl,ProgressRing,BottomSheet}.tsx`
**Test:** `apps/mobile/components/ui/__tests__/Button.test.tsx`

- [ ] **Step 1: Remove unused template components**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
rm -f components/animated-icon.tsx components/animated-icon.web.tsx components/animated-icon.module.css \
      components/external-link.tsx components/hint-row.tsx components/themed-text.tsx \
      components/themed-view.tsx components/web-badge.tsx components/ui/collapsible.tsx
grep -rn "animated-icon\|external-link\|hint-row\|themed-text\|themed-view\|web-badge\|collapsible" app components 2>/dev/null || echo "no references — safe"
```
Expected: "no references — safe". If any reference appears, it's in template files also being removed; re-check.

- [ ] **Step 2: Install gifted-charts + flash-list + bottom-sheet deps (needed across Phase 2)**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npx expo install react-native-gifted-charts react-native-svg @shopify/flash-list @gorhom/bottom-sheet lucide-react-native expo-image expo-haptics
```
Expected: installs resolve SDK-56-compatible versions.

- [ ] **Step 3: Port each UI component** (one `<View>`/`<Text>`/`<Pressable>` conversion per file, applying the cheatsheet)

For each file in `frontend/src/components/ui/`, create the `.tsx` equivalent in `apps/mobile/components/ui/`. These are small (13–45 lines). Convert per the cheatsheet, keeping prop APIs identical (same prop names: `variant`, `size`, `onPress` instead of `onClick`, etc.). Example — `Button.tsx`:

```tsx
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base = 'rounded-xl items-center justify-center flex-row';
const variants: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface-alt dark:bg-surface-dark',
  ghost: 'bg-transparent',
};
const sizes: Record<Size, string> = { sm: 'px-3 py-2', md: 'px-4 py-3', lg: 'px-4 py-4' };
const textVariants: Record<Variant, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-zinc-900 dark:text-zinc-50 font-semibold',
  ghost: 'text-primary font-semibold',
};

export function Button({
  children, variant = 'primary', size = 'md', loading, disabled, className, onPress, ...rest
}: { children: React.ReactNode; variant?: Variant; size?: Size; loading?: boolean; className?: string } & PressableProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50', className)}
      {...rest}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text className={textVariants[variant]}>{children}</Text>}
    </Pressable>
  );
}
```

Port `Card`, `Input`, `Badge`, `Chip`, `Stat`, `Skeleton`, `SegmentedControl`, `ProgressRing`, `BottomSheet` the same way (read each source for exact styling/props). `ProgressRing` uses SVG → use `react-native-svg` (`<Svg><Circle/></Svg>`). `BottomSheet` → wrap `@gorhom/bottom-sheet` `BottomSheetModal` exposing the same open/close API the source had.

- [ ] **Step 4: Add the `cn` util**

Create `apps/mobile/lib/cn.ts` (port of `frontend/src/utils/cn.js`):
```ts
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

- [ ] **Step 5: Smoke test for Button (RNTL)**

`apps/mobile/components/ui/__tests__/Button.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

test('renders label and fires onPress', () => {
  const onPress = jest.fn();
  render(<Button onPress={onPress}>Go</Button>);
  fireEvent.press(screen.getByText('Go'));
  expect(onPress).toHaveBeenCalled();
});
```
Install test deps if missing: `NODE_ENV=development npx expo install -- --dev jest-expo @testing-library/react-native jest react-test-renderer` and add `"test": "jest"` + jest-expo preset to `apps/mobile/package.json` (jest config: `{ "preset": "jest-expo" }`).

- [ ] **Step 6: Run test + typecheck**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile
NODE_ENV=development npm test 2>&1 | tail -10
NODE_ENV=development npx tsc --noEmit
```
Expected: Button test passes; tsc clean.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/components/ui apps/mobile/lib/cn.ts apps/mobile/package.json apps/mobile/jest.config.* 2>/dev/null
git rm -r --cached --ignore-unmatch apps/mobile/components/animated-icon* 2>/dev/null
git add -A apps/mobile/components
git commit -m "feat(mobile): port ui component kit; remove template cruft"
```

---

## Task 2: Navigation shell — 4 tabs + chat FAB

**Source:** `frontend/src/components/layout/{BottomNav,Layout,TopBar,ProfileMenu}.jsx`
**Modify:** `apps/mobile/app/(tabs)/_layout.tsx`
**Create:** `apps/mobile/app/(tabs)/{log,progress,profile}.tsx` (stubs), `apps/mobile/components/chat/ChatFAB.tsx` (stub wired in Task 8), `apps/mobile/components/layout/TopBar.tsx`

- [ ] **Step 1: Expand the tab navigator**

Rewrite `apps/mobile/app/(tabs)/_layout.tsx` to the 4 tabs matching `BottomNav.jsx` (Today, Log, Progress, Profile), using `lucide-react-native` icons and the amber active tint:
```tsx
import { Tabs } from 'expo-router';
import { Home, Dumbbell, TrendingUp, User } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#d4872a' }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create placeholder tab screens** so routes resolve (replaced in later tasks)

`app/(tabs)/log.tsx`, `progress.tsx`, `profile.tsx` each:
```tsx
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Screen() {
  return <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark"><View className="flex-1 items-center justify-center"><Text className="text-zinc-500">Coming next</Text></View></SafeAreaView>;
}
```

- [ ] **Step 3: Typecheck + smoke**

```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile && NODE_ENV=development npx tsc --noEmit
```
Then load `http://localhost:4200` — confirm 4 tabs render and switch with no console errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(tabs\) ; git commit -m "feat(mobile): 4-tab navigation shell with icons"
```

---

## Task 3: Progress screen + charts

**Source:** `frontend/src/pages/Progress.jsx` + `components/progress/{ExerciseChart,VolumeChart,StreakCalendar,PRBoard,GymliInsights,ExerciseSelector}.jsx`
**Create:** `apps/mobile/components/progress/*.tsx`, replace `app/(tabs)/progress.tsx`
**Data:** `api.getVolumeStats`, `api.getStreakData`, `api.getExerciseProgress`, `api.getInsights`, `api.getLoggedExercises`

- [ ] **Step 1: Port the chart components with gifted-charts**

`ExerciseChart` (recharts LineChart → gifted-charts `LineChart`) and `VolumeChart` (recharts BarChart → gifted-charts `BarChart`). Read each source for the data shape, map to gifted-charts' `data={[{value, label}]}`. Example `VolumeChart.tsx`:
```tsx
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export function VolumeChart({ data }: { data: { week: string; volume: number }[] }) {
  const bars = data.map((d) => ({ value: d.volume, label: d.week }));
  return (
    <View className="rounded-2xl bg-surface-alt p-4 dark:bg-surface-dark">
      <Text className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Weekly volume</Text>
      <BarChart data={bars} frontColor="#d4872a" barWidth={18} spacing={14} hideRules yAxisThickness={0} xAxisThickness={0} />
    </View>
  );
}
```
`StreakCalendar` (heatmap grid) → render with `<View>` grid of colored cells (no chart lib needed; port the grid logic). `PRBoard`, `GymliInsights` → plain `<View>`/`<Text>` per source. `ExerciseSelector` → use the ported `SegmentedControl`/picker.

- [ ] **Step 2: Port the Progress screen** (tabs/sections per source), wiring the data calls and the chart components.

- [ ] **Step 3: Typecheck + smoke**
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile && NODE_ENV=development npx tsc --noEmit
```
Load `/progress` at localhost:4200 (signed in) — charts render, 0 console errors.

- [ ] **Step 4: Commit**
```bash
git add apps/mobile/components/progress apps/mobile/app/\(tabs\)/progress.tsx
git commit -m "feat(mobile): port progress screen and charts (gifted-charts)"
```

---

## Task 4: Log screen + workout history + exercise picker

**Source:** `frontend/src/pages/Log.jsx` + `components/log/{ExercisePicker,WorkoutHistoryItem,WorkoutHistoryList}.jsx`
**Create:** `apps/mobile/components/log/*.tsx`, replace `app/(tabs)/log.tsx`
**Data:** `api.getWorkouts`, `api.getRoutines`, `api.searchExercises`, `api.createRoutine`/`updateRoutine`/`deleteRoutine`

- [ ] **Step 1: Port `WorkoutHistoryList` using FlashList**
```tsx
import { FlashList } from '@shopify/flash-list';
// <FlashList data={workouts} renderItem={({item}) => <WorkoutHistoryItem workout={item} />} />
```
Port `WorkoutHistoryItem` (the kind-aware display per source) and `ExercisePicker` (search input + results list; `api.searchExercises`).

- [ ] **Step 2: Port the Log screen** — routine list + start flow + history, navigation to `/session` for active workouts (per `Log.jsx` behavior, incl. the `?start=empty` / `?routine=` params handled in Today).

- [ ] **Step 3: Typecheck + smoke + commit**
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile && NODE_ENV=development npx tsc --noEmit
git add apps/mobile/components/log apps/mobile/app/\(tabs\)/log.tsx
git commit -m "feat(mobile): port log screen, workout history (flashlist), exercise picker"
```

---

## Task 5: Workout session flow (incl. conversational logging)

**Source:** `frontend/src/components/workout/{WorkoutSession,ExerciseCard,SetRow,RestTimer,WorkoutSummary,LogInput,LogFeed}.jsx`
**Create:** `apps/mobile/components/workout/*.tsx`, `apps/mobile/app/session.tsx`
**Data:** `api.getTodaysWorkout`, `api.getPreviousPerformance`, `api.logWorkout`, `api.parseLog`; domain logic via `@gymli/shared` (`applyAction`, `set-fields`).

- [ ] **Step 1: Port `SetRow` + `ExerciseCard`** (kind-aware set inputs; use `set-fields` from `@gymli/shared` for field config). `TextInput` for set values; `Pressable` for set completion. Haptics on set complete via `expo-haptics`.

- [ ] **Step 2: Port `RestTimer`** — replace `setInterval`/framer with a Reanimated/`setInterval` countdown; haptic + (optional) `expo-haptics` on finish. Keep the source's timer logic.

- [ ] **Step 3: Port `LogInput` + `LogFeed`** (conversational logging) — `LogInput` posts to `api.parseLog`, applies parsed envelope via `applyAction` (from `@gymli/shared`), `LogFeed` renders the action log. Behavior per source.

- [ ] **Step 4: Port `WorkoutSession` + `WorkoutSummary`** into `app/session.tsx` (a stack route, presented over the tabs). Wire the split conversational/manual session view per source. Save via `api.logWorkout`.

- [ ] **Step 5: Typecheck + smoke + commit**
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile && NODE_ENV=development npx tsc --noEmit
git add apps/mobile/components/workout apps/mobile/app/session.tsx
git commit -m "feat(mobile): port workout session flow with conversational logging"
```

---

## Task 6: Profile screen + routine editor

**Source:** `frontend/src/pages/Profile.jsx` + `components/routine/RoutineEditor.jsx` + `components/layout/ProfileMenu.jsx`
**Create:** `apps/mobile/components/routine/RoutineEditor.tsx`, `apps/mobile/components/layout/ProfileMenu.tsx`, replace `app/(tabs)/profile.tsx`
**Data:** `api.getProfile`/`updateProfile` (via `useUserProfile`), routine CRUD; `useAuth().signOut`, `useTheme()`.

- [ ] **Step 1: Port Profile** — grouped settings sections, auto-save (per source), theme toggle (`useTheme`), sign out (`useAuth`). `RoutineEditor` as a `@gorhom/bottom-sheet` or stack route.

- [ ] **Step 2: Typecheck + smoke + commit**
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile && NODE_ENV=development npx tsc --noEmit
git add apps/mobile/components/routine apps/mobile/components/layout/ProfileMenu.tsx apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "feat(mobile): port profile screen and routine editor"
```

---

## Task 7: Onboarding flow

**Source:** `frontend/src/pages/Onboarding.jsx`
**Create:** `apps/mobile/app/onboarding.tsx`
**Gating:** wire the deferred `needsOnboarding` redirect in `app/_layout.tsx`'s AuthGate (the TODO left in Phase 1).

- [ ] **Step 1: Port the 4-step onboarding** (progressive steps per source), saving via `api.updateProfile` (`useUserProfile().updateProfile`).

- [ ] **Step 2: Wire the AuthGate redirect** — in `app/_layout.tsx`, replace the Phase-1 TODO with: if `user && !inAuth && needsOnboarding` → `router.replace('/onboarding')`. Use `useUserProfile()` inside the gate.

- [ ] **Step 3: Typecheck + smoke + commit**
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile && NODE_ENV=development npx tsc --noEmit
git add apps/mobile/app/onboarding.tsx apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): port onboarding flow and wire needsonboarding gate"
```

---

## Task 8: Chat (overlay + FAB + custom markdown renderer)

**Source:** `frontend/src/components/chat/{ChatOverlay,ChatFAB,ChatInput,ChatMessage}.jsx`
**Create:** `apps/mobile/components/chat/{ChatOverlay,ChatFAB,ChatInput,ChatMessage,Markdown}.tsx`; mount the FAB+overlay in `app/(tabs)/_layout.tsx`
**Data:** `api.sendChat`, `api.getChatHistory`, `api.clearChatHistory`

- [ ] **Step 1: Build the custom markdown subset renderer** (the spec's decision — no markdown dependency)

`apps/mobile/components/chat/Markdown.tsx`:
```tsx
import { Text, View } from 'react-native';

// Renders the limited subset Gemini emits: **bold**, bullet/numbered lists, paragraphs, line breaks.
function renderInline(text: string, keyBase: string) {
  // split on **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <Text key={`${keyBase}-${i}`} className="font-semibold">{p.slice(2, -2)}</Text>
      : <Text key={`${keyBase}-${i}`}>{p}</Text>
  );
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  const blocks = children.split(/\n{2,}/); // paragraphs
  return (
    <View>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        const isBullet = lines.every((l) => /^\s*[-*]\s+/.test(l));
        const isNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l));
        if (isBullet || isNumbered) {
          return (
            <View key={bi} className="mb-2 gap-1">
              {lines.map((l, li) => {
                const content = l.replace(/^\s*([-*]|\d+\.)\s+/, '');
                const marker = isNumbered ? `${li + 1}.` : '•';
                return (
                  <View key={li} className="flex-row gap-2">
                    <Text className={className}>{marker}</Text>
                    <Text className={className + ' flex-1'}>{renderInline(content, `${bi}-${li}`)}</Text>
                  </View>
                );
              })}
            </View>
          );
        }
        return <Text key={bi} className={(className ?? '') + ' mb-2'}>{renderInline(block, `${bi}`)}</Text>;
      })}
    </View>
  );
}
```

- [ ] **Step 2: Port `ChatMessage`** to render user/assistant bubbles, using `<Markdown>` for assistant text. Port `ChatInput` (`TextInput` + send). Port `ChatOverlay` as a `@gorhom/bottom-sheet` modal (replacing the web overlay), wired to `api.sendChat`/`getChatHistory`/`clearChatHistory` with the contextual prompts per source. Port `ChatFAB` (floating `Pressable` with chat icon) that opens the overlay.

- [ ] **Step 3: Mount FAB + overlay** above the tabs (in `(tabs)/_layout.tsx`, render `<ChatFAB />` + the overlay alongside `<Tabs>` so it's available on every tab, per the web `Layout`).

- [ ] **Step 4: Typecheck + smoke (incl. a Markdown unit test)**

`apps/mobile/components/chat/__tests__/Markdown.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { Markdown } from '../Markdown';
test('renders bold and bullets', () => {
  render(<Markdown>{"Do **this**\n\n- a\n- b"}</Markdown>);
  expect(screen.getByText('this')).toBeTruthy();
  expect(screen.getByText('a')).toBeTruthy();
});
```
```bash
cd /Users/jayspar/Documents/projects/Gymli/apps/mobile && NODE_ENV=development npm test 2>&1 | tail -8 && NODE_ENV=development npx tsc --noEmit
```

- [ ] **Step 5: Commit**
```bash
git add apps/mobile/components/chat apps/mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat(mobile): port chat overlay/fab with custom markdown renderer"
```

---

## Task 9: Full smoke + cleanup

- [ ] **Step 1: Whole-app web smoke** — sign in, walk every tab (Today, Log, Progress, Profile), open Chat, start a session, open Onboarding; confirm **0 console errors** on each route (Playwright or manual at localhost:4200).
- [ ] **Step 2: tsc + tests** — `NODE_ENV=development npx tsc --noEmit` clean; `NODE_ENV=development npm test` green (mobile) and `npm test --workspace @gymli/shared` green.
- [ ] **Step 3: Lint** — `npm run lint` passes (frontend+backend hook).
- [ ] **Step 4: Commit any cleanup**
```bash
git add -A apps/mobile && git commit -m "chore(mobile): phase 2 smoke fixes" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** Spec §2 (port all screens) — Log/conversational logging (T4,T5), Progress+charts (T3), Profile (T6), Onboarding (T7), Chat (T8), routines (T4,T6), UI kit + nav (T1,T2). Library mappings from §4/§5 applied via the cheatsheet (gifted-charts T3, FlashList T4, bottom-sheet T6/T8, custom markdown T8, lucide T2, reanimated T5). §7 markdown-removed honored (T8 custom renderer, no dep). §8 edge-to-edge/SafeArea applied per screen.
- **Out of scope (next phase):** hosted web deploy (Firebase Hosting dev/prod) once parity reached; iOS; `finishing-a-development-branch` PR.
- **Placeholder scan:** chart/markdown/nav given full code; screen ports reference the authoritative source `.jsx` + the cheatsheet rather than reproducing 3,800 lines (the source files ARE in-repo and are the behavioral spec) — this is deliberate for a mechanical UI port, not a placeholder gap.
- **Type/name consistency:** `api` (from `lib/api`), `useAuth`/`useUserProfile`/`useTheme`, `cn` (lib/cn), `applyAction`/`set-fields` (@gymli/shared), theme tokens (`bg-bg`,`bg-surface-alt`,`text-primary`) are consistent across tasks and match the Phase 0/1 slice.
