# Gymli UI/UX Redesign — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Goal:** Redesign Gymli to match the quality of Strava, Garmin Connect, and Nike Training Club — premium native feel, data-dense UI, intelligent AI coaching backed by real workout data.

## Design Principles

1. **Data is the design.** Large numbers, gradient charts, circular progress — no decorative filler.
2. **Every pixel earns its space.** Cards show real information. No empty states that stay empty.
3. **The AI sees everything.** Coaching is backed by actual workout history, not generic advice.
4. **Native feel over web defaults.** Bottom sheets, swipe gestures, haptics, transitions.
5. **Amber warmth, not fantasy theme.** Keep the warm amber identity. Drop the dwarf/forge persona.

---

## 1. Visual Identity Overhaul

### Typography

| Role | Current | New |
|------|---------|-----|
| Display/Headings | Cinzel (fantasy serif) | **Inter** or **DM Sans** — bold weight (700) for headings, semibold (600) for subheadings |
| Body | Outfit | Same font family as display — regular (400) and medium (500) |
| Data/Numbers | System default | Same family — tabular numbers variant for aligned columns |

Single font family throughout. No display font.

### Color System

| Token | Light Mode | Dark Mode | Notes |
|-------|------------|-----------|-------|
| `--color-bg` | `#fafafa` | `#09090b` (zinc-950) | Cool neutral, not warm cream |
| `--color-surface` | `#ffffff` | `#18181b` (zinc-900) | Subtle lift from bg |
| `--color-surface-alt` | `#f4f4f5` (zinc-100) | `#27272a` (zinc-800) | Card variant, input backgrounds |
| `--color-primary` | `#d97706` (amber-600) | `#f59e0b` (amber-500) | Slightly adjusted for contrast per mode |
| `--color-primary-muted` | `#d97706` at 10% | `#f59e0b` at 10% | Backgrounds for badges, highlights |
| `--color-text` | `#09090b` | `#fafafa` | Maximum contrast |
| `--color-text-secondary` | `#71717a` (zinc-500) | `#a1a1aa` (zinc-400) | Labels, captions |
| `--color-border` | `#e4e4e7` (zinc-200) | `#3f3f46` (zinc-700) | Subtle, not prominent |
| `--color-success` | `#10b981` | `#34d399` | PR badges, completed states |
| `--color-danger` | `#ef4444` | `#f87171` | Destructive actions, errors |

### Card Styling

| Current | New |
|---------|-----|
| `rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]` | `rounded-2xl bg-[var(--color-surface)]` — no visible border in dark mode, use subtle shadow or surface color difference only. Light mode: optional `border border-[var(--color-border)]` or shadow `shadow-sm`. |

Cards should feel like Garmin's "At a Glance" widgets — surface shifts, not bordered boxes.

### App Name Treatment

| Current | New |
|---------|-----|
| `<span class="text-primary">GYM</span><span>LI</span>` in Cinzel with Flame icon | "Gymli" in heading font, bold weight, no icon. Or just show nothing in TopBar and use the space for page title + actions. |

### Decorative Elements — Remove

- Ember particles on login
- Forge glow borders
- Gradient dividers with `linear-gradient(90deg, transparent, primary, transparent)`
- Forge-themed loading quotes
- "— Gymli" signature on messages
- Themed error messages ("The forge fires flicker...")
- Flame icons next to headings

### AI Tone

| Context | Current | New |
|---------|---------|-----|
| Greeting | "The anvil awaits, warrior!" | "Good morning, Jay" |
| Coaching | "By Durin's hammer, your bench press grows mighty!" | "Bench is up 5kg in 3 weeks. Try 82.5 next session." |
| Error | "The forge fires flicker..." | "Something went wrong. Tap to retry." |
| Summary | "A worthy forging session! You hammered through..." | "Solid session — 4 exercises, 12,400kg total volume. Bench PR: 85kg." |
| Loading | Cycling forge quotes | Skeleton shimmer screens |

---

## 2. Component Design System

### New `components/ui/` Kit

| Component | Variants | Key Props |
|-----------|----------|-----------|
| `Button` | primary, secondary, ghost, destructive, icon | size (sm/md/lg), loading, disabled, fullWidth |
| `Card` | elevated, flat, interactive | padding (sm/md/lg), onPress |
| `Input` | text, number, textarea | label, error, icon, unit suffix |
| `BottomSheet` | — | snapPoints[], onDismiss, handle |
| `SegmentedControl` | — | options[], value, onChange |
| `Chip` | filter, status | selected, icon |
| `Badge` | default, success, warning | size (sm/md) |
| `Stat` | — | value, label, trend (up/down/flat), icon |
| `Skeleton` | text, circle, card, chart | width, height, lines |
| `ProgressRing` | — | value, max, size, color |
| `Tabs` | — | tabs[], activeTab, onChange |

All components use CSS variables from the theme. No hardcoded colors.

### Motion & Transitions

**Library:** Framer Motion

| Pattern | Usage | Implementation |
|---------|-------|----------------|
| Page transitions | Tab switches | Crossfade (opacity 0→1, 150ms) |
| Push/pop screens | Workout session, Plan setup | Slide from right (x: 100%→0), slide back on dismiss |
| Bottom sheets | Exercise detail, day preview, finish confirmation, exercise picker | `motion.div` with drag gesture, snap points, backdrop blur |
| List items | Workout history, exercise list | `AnimatePresence` + staggered fade-up on mount |
| Stat counters | Numbers on Progress page | `motion.span` with animated counting |
| Charts | On mount | Draw-in animation (stroke-dashoffset or opacity) |
| Set completion | Checkbox tap | Scale bounce (1→1.2→1) + green color fill |
| Tab indicator | Bottom nav active state | `layoutId` shared layout animation for sliding indicator |

### Bottom Sheets Replace Full-Screen Overlays

| Current (full-screen) | New (bottom sheet) |
|-----------------------|-------------------|
| Exercise picker | Bottom sheet, 90% height snap, drag to dismiss |
| Workout history detail | Bottom sheet, 50%/90% snap points |
| Day preview (from week strip) | Bottom sheet, auto-height |
| Finish workout confirmation | Bottom sheet, auto-height |
| Exercise detail (tap in Today card) | Bottom sheet, 50% snap showing last 3 sessions |

**Keep as full-screen push:** Workout session (needs full focus), Manual log form, Chat overlay, Plan view/edit.

### Haptic Feedback

Via `@capacitor/haptics`:

| Action | Haptic Type |
|--------|-------------|
| Set completed (checkbox) | `ImpactStyle.Medium` |
| PR achieved | `NotificationType.Success` |
| Workout finished | `NotificationType.Success` |
| Button tap (primary) | `ImpactStyle.Light` |
| Bottom sheet snap | `ImpactStyle.Light` |
| Error/validation | `NotificationType.Warning` |

### Pull to Refresh

On Today, Log, and Progress screens. Use Framer Motion drag gesture with threshold + spinner animation.

---

## 3. Screen Redesigns

### 3.1 Login

**Keep:** Amber accent, email/Google auth, mobile-centered layout.
**Remove:** Ember particles, forge glow, decorative top border, staged fade-in delays.
**Add:** Clean background (solid or subtle gradient), app logo/wordmark centered, inputs with focus animations, smooth transitions between landing/email modes.

### 3.2 Onboarding (replaces current Profile-as-onboarding)

**Flow:** 4 progressive steps with progress indicator (dot strip at top).

| Step | Content | Inputs |
|------|---------|--------|
| 1. Welcome | "Let's build your program." | Name input, continue button |
| 2. Goals | "What are you training for?" | Goals textarea, optional predefined chips (Strength, Muscle, General Fitness, Weight Loss) that pre-fill |
| 3. Starting Point | "Where are you starting from?" | Experience level (3 tappable cards: Beginner/Intermediate/Advanced with descriptions), bodyweight (optional), units toggle |
| 4. Schedule | "Which days can you train?" | 7-day toggle grid. Below: auto-selected plan preview for beginners. Template grid for intermediate/advanced with recommendation badge. |

After step 4: "Generate Plan" → skeleton loading (no forge quotes) → lands on Today with first workout ready. Plan is active immediately.

### 3.3 Today (Dashboard)

**Layout top to bottom:**

```
┌──────────────────────────────────┐
│ Good morning, Jay          [⚙️]  │  ← greeting + settings/profile icon
│ Push Day                         │  ← contextual subtitle
├──────────────────────────────────┤
│ 🔥 12 day streak    28 total    │  ← stat strip (compact horizontal)
├──────────────────────────────────┤
│ Today's Workout                  │
│ ┌──────────────────────────────┐ │
│ │ Bench Press     4×8   80kg  │ │  ← exercise + target + last weight
│ │ Incline DB      3×10  24kg  │ │
│ │ Cable Fly       3×12  15kg  │ │
│ │ Tricep Pushdown 3×12  25kg  │ │
│ │ Skull Crusher   3×10  20kg  │ │
│ │                              │ │
│ │ [ Start Workout ]            │ │  ← primary button
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ This Week                        │
│ M✓  T✓  W·  T-  F-  S-  S-     │  ← dot = today, ✓ = done, - = planned/rest
│ Today: Push  |  Thu: Pull        │  ← labels for today + next
├──────────────────────────────────┤
│ 💡 Bench trending up — try       │  ← AI tip (one line, dismissible)
│    82.5kg next session           │
└──────────────────────────────────┘
```

**Rest day variant:** Same layout but workout card replaced with "Rest Day" card showing: "Back at it Thursday with Pull Day" + preview of that day's exercises.

**Completed variant:** Workout card shows green check overlay with summary: "5 exercises · 45 min · 12,400kg volume" + any PRs.

### 3.4 Workout Session

**Full-screen push transition (slide from right).**

**Header:** Timer (left, prominent) | "2 of 5" (center) | "End" button (right, needs confirmation via bottom sheet)

**Exercise view — one at a time, horizontal swipe between exercises:**

```
┌──────────────────────────────────┐
│ Bench Press                      │
│ Target: 4 × 8                   │
│ Last: 80kg × 8, 8, 7, 6         │  ← previous session data
├──────────────────────────────────┤
│ Set   Weight      Reps      ✓   │
│  1    [80] kg     [8 ]      ○   │  ← weight pre-filled from last
│  2    [80] kg     [8 ]      ○   │
│  3    [80] kg     [  ]      ○   │
│  4    [80] kg     [  ]      ○   │
│  + Add set                       │
├──────────────────────────────────┤
│ 📝 Notes                        │  ← collapsible, per-exercise
└──────────────────────────────────┘
```

**Exercise nav:** Tappable pill strip below header: `[Bench] [Incline] [Fly] [Pushdown] [Skull]` — scrollable if >5, active pill highlighted.

**Rest timer:** Compact bar appears at screen bottom after set completion. Shows countdown + thin progress bar. Tap to expand (adjust ±15s, reset). Auto-hides when timer ends. Does NOT appear if sets completed <5s apart (user is correcting, not resting).

**Completion flow:** Tap "End" → bottom sheet: "End workout? 4/5 exercises completed." → Cancel / End Workout buttons → summary modal.

**Workout summary:** Centered modal over blurred backdrop:
- Large stat grid: Duration | Volume | Sets completed
- PR callouts with success badge
- AI summary (1-2 sentences, data-specific)
- "Done" button

### 3.5 Progress

**Segmented control at top:** Overview | Strength | Volume

**Overview tab:**
- Streak calendar (keep heatmap, restyle with new colors)
- This week summary: stat grid (workouts, volume, vs last week %)
- AI insights card (now backed by real data — see Section 4)

**Strength tab:**
- Exercise selector (chips or segmented, not dropdown)
- Line chart: weight over time with gradient fill (amber → transparent)
- Below chart: PR board — list of exercises with current best, date, trend arrow
- Period selector: 1M / 3M / 6M / All (segmented control)

**Volume tab:**
- Bar chart: weekly volume with rounded caps, gradient fills
- Volume by muscle group (horizontal bars or simple breakdown)
- Period selector

**Chart styling (matching Strava/Garmin):**
- Gradient fills (primary color → transparent at 10%)
- Minimal grid lines (horizontal only, very faint)
- Axis labels in text-secondary, small
- Tap data points for tooltip with exact values
- Animated draw-in on mount
- Rounded bar ends

### 3.6 Log / History

- Workout cards: date, workout name, duration, volume, exercise count, PR badge if applicable
- Tap card → inline expand or bottom sheet with exercise/set detail
- Calendar view toggle (month grid with workout dots, like Strava)
- Manual log: keep overlay approach, improved with new component kit

### 3.7 Chat

- Keep FAB + full-screen overlay approach (chat needs focus)
- Remove Cinzel heading, dwarf avatar, themed errors
- Clean header: "Coach" or "Gymli" in body font + close button
- Messages: user (primary bg, right), AI (surface-alt, left) — keep this
- Quick prompts: contextual to current data, not generic
- Empty state: "Ask about your training, progress, or plan." + contextual suggestions

### 3.8 Profile (post-onboarding)

- Settings-style grouped sections (like iOS Settings)
- Section 1: Personal (name, bodyweight, units)
- Section 2: Training (experience, goals, available days)
- Section 3: Preferences (theme toggle, rest timer default)
- Section 4: Account (sign out, delete account)
- No "Save" button — auto-save on change with subtle confirmation

---

## 4. AI Coaching Architecture

### Context Builder Service

New backend service: `services/coaching-context.js`

```
buildCoachingContext(uid) → {
  profile: { name, experience, goals, units, bodyweight },
  plan: {
    name, daysPerWeek,
    schedule: { Mon: "Push", Tue: "Rest", ... },
    exercises: [{ name, targetSets, targetReps }]
  },
  recentWorkouts: [                    // last 10 sessions
    {
      date, dayName,
      exercises: [{ name, sets: [{ weight, reps }], bestWeight }],
      totalVolume, duration
    }
  ],
  exerciseTrends: [                    // per exercise in active plan
    { name, trend: "improving"|"stalled"|"declining",
      currentBest, previousBest, sessionsAtPlateau }
  ],
  adherence: {
    completionRate,                    // workouts done / planned, last 4 weeks
    currentStreak, totalWorkouts
  },
  recentPRs: [{ name, weight, date }] // last 30 days
}
```

### How Context Flows to Gemini

| AI Call | Context Provided |
|---------|-----------------|
| **Chat** | Full coaching context (built once per session, cached) + conversation history (last 20 exchanges) |
| **Daily tip** (new) | Exercise trends + adherence + recent PRs → single-sentence tip |
| **Workout summary** | Current workout data + profile (same as now, this is fine) |
| **Insights** | Full coaching context (replaces current shallow format) |
| **Plan generation** | Profile + template (same as now) |

### Daily Tip Generation

New endpoint: `GET /api/coaching/tip` — called on Today screen load.

Trigger logic (deterministic, checked in order — first match wins):

| Priority | Condition | Example Output |
|----------|-----------|----------------|
| 1 | PR in last session | "New bench PR: 85kg. Up 5kg in 3 weeks." |
| 2 | Exercise stalled ≥3 weeks | "OHP has plateaued at 50kg. Consider dropping to 45kg for a week, then rebuild." |
| 3 | Missed 2+ workouts this week (and it's Thu+) | "Lighter week — that's fine. Consistency over time matters more than any single week." |
| 4 | Streak milestone (7, 14, 30, 60, 90) | "30 days consistent. That's a real habit now." |
| 5 | Volume up week-over-week | "Volume up 8% this week. Progressing well." |
| 6 | Returning after 3+ day gap | "Welcome back. Ease into it today." |
| 7 | None of the above | No tip shown (don't force it) |

Tips are cached for the day (one tip per day max).

### Workout Previous Performance

New endpoint: `GET /api/workouts/previous/:exerciseId`

Returns the last logged session for a given exercise:
```
{
  date: "2026-02-22",
  sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }, { weight: 80, reps: 7 }],
  bestWeight: 80,
  notes: "Felt strong, could go heavier"
}
```

Called on workout session start for all exercises in that day's plan. This powers the "Last: 80kg × 8, 8, 7" display and weight pre-fill.

Alternative: batch endpoint `POST /api/workouts/previous` with `{ exerciseIds: [...] }` to reduce calls.

### Fix Existing PR Detection Bug

Current PR query uses `where('exercises', '!=', null)` which doesn't work correctly on array fields in Firestore. Fix: query `orderBy('date', 'desc').limit(50)` without the array filter, then filter in code. Or restructure to use a `exercises_logged` array of exercise IDs at the document root for proper indexing.

---

## 5. Technical Implementation

### Stack (unchanged)

- React 19 + Vite 7 + Capacitor 8
- Tailwind CSS 4 (update color tokens + remove Cinzel)
- Firebase Firestore + Auth
- Gemini 2.5 Flash

### New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `framer-motion` | Animations, gestures, layout transitions, bottom sheets | ~33kb gzipped |
| `vaul` | Bottom sheet primitive (or build with framer-motion) | ~5kb |
| `@capacitor/haptics` | Vibration feedback on native | Already in Capacitor |

### Font Change

Remove Cinzel from Google Fonts load. Replace Outfit with Inter (or DM Sans / Plus Jakarta Sans). Single font, variable weight file for performance.

### Design System Build Order

1. CSS variable update (colors, remove forge tokens)
2. Font swap
3. `components/ui/` kit (Button, Card, Input, Stat, Badge, Skeleton first)
4. BottomSheet component
5. Page transition wrapper
6. Restyle existing pages with new components
7. New features (previous performance, context builder, daily tips)

---

## 6. Reference Benchmarks

### From Garmin Connect
- True dark surfaces with minimal contrast between bg and card
- 2-column "At a Glance" stat card grid with circular progress indicators
- Swipeable "In Focus" carousel for featured data
- Per-metric accent colors (not one color everywhere)
- 5-tab bottom nav with labels

### From Strava
- Orange/amber accent on true dark background — validates our color choice
- Area charts with gradient fill
- Segmented controls for view switching
- Calendar with streak tracking and share button
- Filter chips for data categories
- Large bold stat numbers with small labels below

### Shared Patterns
- Data density > decoration
- Large numbers + small labels (not the reverse)
- Circular progress for goals
- Monochrome + accent color per context
- Cards as surface shifts, not bordered boxes
- Skeleton loading states matching content layout

---

## Summary of Changes

| Area | Effort | Impact |
|------|--------|--------|
| Theme overhaul (colors, fonts, tone) | Medium | High — immediate visual upgrade |
| Component kit (`components/ui/`) | Medium | High — consistency + faster future development |
| Bottom sheets + transitions (Framer Motion) | Medium | High — native feel |
| Workout previous performance | Low | Critical — most-requested feature in gym apps |
| AI context builder | Medium | Critical — makes coaching real |
| Daily tips | Low | Medium — proactive value without user effort |
| Onboarding redesign | Medium | High — first impression |
| Today dashboard redesign | Medium | High — most-used screen |
| Workout session redesign | Medium | Critical — core use case |
| Progress page redesign | Medium | High — retention driver |
| Chart restyling | Low-Medium | Medium — visual polish |
| Haptic feedback | Low | Medium — native feel |
| PR bug fix | Low | Medium — data correctness |
