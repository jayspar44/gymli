# Gymli v2 — Conversational Logging — Design

**Date:** 2026-05-30
**Status:** Approved (design) — pending implementation plan
**Goal:** Pivot Gymli into a best-in-class Strong/Hevy-style logger whose differentiator is **conversational AI logging**. Strip AI-driven planning. Nail logging via (a) natural-language text and (b) manual tap input.

## Skill invocation notes

| Task area | Skill |
|---|---|
| UI work (split logging screen, library picker, routines) | `frontend-design:frontend-design` |
| Backend parse endpoint + services | `superpowers:test-driven-development` |
| Any bug during build | `superpowers:systematic-debugging` |
| Before completion / merge | `superpowers:verification-before-completion`, `/commit-push` |

---

## 1. Scope

| In scope (v1) | Out / deferred |
|---|---|
| Conversational **text** logging, confidence-gated confirm | Voice / speech-to-text (fast-follow) |
| Manual tap logging (always available) | RPE/RIR, set types (warmup/drop/failure), supersets |
| Saved **Routines** + ad-hoc empty sessions | AI **plan generation** (stripped) |
| Exercise **kinds**: weighted / bodyweight / assisted / timed / distance | Movement+modifier combinatorial library |
| AI = log + **light coach** (contextual Q&A, PR callouts, "what's next") | On-the-fly programming / weight prescription |
| Expanded flat exercise library (~400+) | Cross-variant progress roll-ups (tags reserved, not built) |
| Persist all AI interactions for training | Voice, multi-language |

**Success criteria:** a user can complete a full workout — build it (tap or talk), log every set (tap or talk), finish with PRs/summary — without the conversational path feeling slower or less trustworthy than manual.

---

## 2. Data model

### 2.1 Exercise (flat rows, expanded ~400+)

```js
{
  id,                                   // slug
  name,                                 // "Incline Dumbbell Bench Press"
  aliases: ["incline db press", "incline dumbbell press"],  // aids AI matching
  kind: "weighted"|"bodyweight"|"assisted"|"timed"|"distance",
  category, muscleGroups: { primary[], secondary[] }, equipment, instructions
}
```
- `aliases` + `kind` are the new fields. Optional `baseMovement` tag **reserved** (not populated v1) for future cross-variant roll-ups.
- Seed expanded from ~100 to ~400+ curated named exercises.

### 2.2 Set (kind-aware)

Replaces the flat `{weight, reps, completed}` with a shape selected by the exercise's `kind`:

| kind | set shape | example |
|---|---|---|
| weighted | `{ weight, reps, completed }` | 225 × 5 |
| bodyweight | `{ addedWeight, reps, completed }` | BW+25 × 8 |
| assisted | `{ assistWeight, reps, completed }` | −40 × 10 |
| timed | `{ seconds, completed }` | plank 0:60 |
| distance | `{ distance, unit, seconds, completed }` | 5 km / 24:30 |

- Workout / exercise / `totalVolume` / `prs` document shapes are **kept**.
- `volume` and PR detection become **kind-aware** (e.g. timed → no weight PR; track best time/distance instead).

### 2.3 Routine (repurposed `plans` collection)

```js
{ id, name, exercises: [{ exerciseId, targetSets, targetReps }], createdAt, updatedAt }
```
- User-authored. **No AI generation.**
- "Save current session as routine" supported.
- Replaces AI plan documents; `active` plan concept retired.

### 2.4 Training sink (new) — `interactionLogs`

Durable record of **every** AI interaction (global chat **and** in-session logging), for training/eval. Suggested path: top-level `interactionLogs/{autoId}` (or `users/{uid}/interactionLogs`).

```js
{
  uid,
  surface: "session-log" | "global-chat",
  sessionId?,                 // present for session-log
  inputText,
  envelope,                   // full model response (see §3)
  confidence,
  appliedActions,             // what the client actually committed
  userCorrection?,            // clarification chosen, or later grid edit, if captured
  exerciseResolution: { method:"catalog"|"fuzzy", matchedIds[], wasAmbiguous },
  model: "gemini-3-flash-preview",
  catalogVersion,
  createdAt
}
```
- **Privacy:** retaining user data for training needs a disclosure + consent flag on the profile (default per product/legal call). Flagged as open item §8.

---

## 3. AI engine — structured-output envelope (single call)

**Model:** Gemini 3 Flash Preview (upgraded from 2.5 Flash). One call per user utterance. No tool-calling loop, no deterministic fast-path in v1 (single code path).

**Endpoint:** `POST /api/log/parse` — rate-limited like `/api/chat` (10/min).

**Request:**
```js
{ text, session: { exercises, sets, currentExerciseId }, profileUnits }
```

**System prompt** carries a **compact exercise catalog** (`id` + `name` + `aliases`, prompt-cached) so the model resolves exercises itself and returns IDs.

**Response (JSON-schema-constrained envelope):**
```js
{
  reply: "✓ Bench Press 225×5,5,4 — 5lb PR! 🔥",   // shown in feed
  confidence: 0.0-1.0,
  needsClarification: false,
  clarification?: { prompt, options: [{ label, exerciseId }] },
  actions: [
    { type:"add_exercise", exerciseId },
    { type:"log_sets", exerciseId, sets:[ /* kind-aware set objects */ ] },
    { type:"set_notes", exerciseId, text },
    { type:"answer", text }     // pure coaching/Q&A — no mutation
  ]
}
```

**Behavior:**
- Frontend applies `actions` to client-side session state; persists to Firestore on finish (existing `logWorkout`) — plus the per-utterance training log immediately.
- **Confirm gate:** `confidence >= threshold` and `!needsClarification` → auto-commit with brief "Logged · Undo". Otherwise render clarification chips (or a pending preview) — do not commit until resolved.
- Coaching (`type:"answer"`) uses existing `buildCoachingContext()` **minus the plan dependency**.
- Mis-parses always editable by tapping a grid cell.

### 3.1 Exercise resolution boundary

- Resolution lives behind a **`resolveExercise()` interface** with two implementations: `catalog-in-prompt` (v1 default) and `server-fuzzy` (fallback).
- **Instrumented** via `interactionLogs.exerciseResolution` + confidence/clarification rates so effectiveness is measurable and swappable **without changing the data contract**.

### 3.2 Context isolation

- In-session logging feed is **session-scoped**: never injected into global chat context.
- Global chat context excludes session-log messages.
- Both still write to the shared `interactionLogs` training sink.

---

## 4. Screen & flow — split layout (live grid + AI feed)

| Region | Behavior |
|---|---|
| Header | Routine name + live timer |
| **Top — live grid** | Current exercise's sets (kind-aware inputs); tap any cell to edit; ✓ to complete. Source of truth. |
| **Bottom — AI feed + input** | Type natural language → envelope → grid updates; Gymli confirmations / clarifications / coaching appear as feed lines. |
| Exercise nav | Pill strip / swipe between exercises (kept) |
| Add exercise | "+ Add" (library picker) **or** say "add dumbbell bench" |
| Finish | Existing summary + PRs + `gymliSummary`; option "Save as routine" |

**Entry points:** start a **Routine** (pre-fills grid) or an **empty session** (build by tapping or talking).

**Library picker:** searchable flat list, filter by category/equipment/kind; returns `exerciseId`.

---

## 5. What gets stripped / repurposed

| Action | Targets |
|---|---|
| **Remove** | `plan-templates.js`, `POST /api/plans/generate`, `GET /api/plans/templates`, `PlanSetup.jsx`, `TemplatePicker.jsx`, AI `generatePlan` |
| **Repurpose** | `plan-service` + `plans` collection → Routines; `PlanView.jsx` → routine view/editor |
| **Simplify** | `getTodaysWorkout` (plan-driven) → "resume / quick-start / recent"; Today page = active routines + quick-start + recent history |
| **Keep** | global ChatFAB/ChatOverlay (unchanged v1), stats/progress, auth, workout summary |

---

## 6. Component / unit boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `log-parse-service` (backend) | text + session → validated envelope | ai-service (Gemini), resolver, catalog |
| `resolveExercise` | name/alias → exerciseId (+ ambiguity) | exercise-service / catalog |
| `interaction-log-service` | persist training records | firebase |
| `coaching-context-service` | user context for `answer` (plan dep removed) | profile, workouts |
| `SessionView` (frontend) | split screen, applies envelope actions to session state | log API, session state |
| `LogFeed` + `LogInput` | render feed, send utterances, render clarification chips | SessionView |
| `SetGrid` (kind-aware) | display/edit sets per exercise kind | session state |
| `RoutineList` / `RoutineEditor` | CRUD routines, "save session as routine" | routine (plan) service |

---

## 7. Testing

| Layer | Tests |
|---|---|
| Envelope parsing | shorthand, natural phrasing, multi-set, "now/next set", add/swap exercise, units, each kind |
| Confidence gate | auto-commit vs clarify thresholds; ambiguous exercise → chips |
| Resolver | catalog hit, alias hit, ambiguous, miss → clarification |
| Kind-aware sets | volume + PR per kind (weighted/bodyweight/assisted/timed/distance) |
| Training sink | every interaction persisted with required fields |
| Context isolation | session messages absent from global chat context and vice-versa |

---

## 8. Open items

- Confidence threshold value — tune empirically post-instrumentation.
- Training-data **consent/disclosure** UX + default (product/legal).
- Catalog token cost at ~400+ exercises vs prompt-cache savings — measure; trigger for `server-fuzzy` fallback.
- Routine authoring via AI (e.g. "make me a push day") — v1 supports session build + "save as routine"; full conversational routine editing deferred.
- Migration of existing `plans`/`workouts` documents to new shapes.
