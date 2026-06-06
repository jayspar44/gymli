# Gymli → React Native + Expo Migration — Design Spec

**Date:** 2026-06-06
**Status:** Approved (design)
**Scope:** Replace the Capacitor/Vite web frontend with a single Expo (React Native) app that targets **Android + web** today, structured so iOS can be added later with little extra work. Backend is untouched.

---

## 1. Goal & Rationale

Build a frontend capable of best-in-class native polish (target bar: Strava / Nike Run Club) while keeping a genuinely good web experience, from a single codebase, maintainable by a solo developer with AI assistance.

**Why a rewrite:** the current frontend is a Capacitor webview wrapper around a React-DOM/Vite app. A webview caps native feel and animation quality. Moving to React Native removes that ceiling. The Node/Express + Firebase + Gemini backend is unaffected and stays as-is.

**Decision profile driving this design:**
- Full frontend rewrite is acceptable; backend stays.
- Solo + AI; **ship fast first, polish later**.
- One codebase for Android + web now; iOS deferred but kept cheap.

---

## 2. Scope

### In scope
- New Expo app (TypeScript) targeting **Android + web** from one codebase.
- Monorepo refactor: `apps/mobile` + `packages/shared`, backend untouched.
- Port all existing screens/features: Today, Log (incl. conversational logging), Progress, Profile, Onboarding, Chat, routines, auth.
- Library swaps (charts, animation, sheets, icons, navigation, styling, auth bridge).
- Custom dev build (EAS) for Android; web export.

### Out of scope (now)
- **iOS** — deferred. Codebase remains cross-platform so iOS is a later phase (EAS iOS build + TestFlight), not a rewrite.
- Backend changes — none required.
- New product features — this is a migration, not a feature release. Behavior parity is the target.
- Markdown/HTML rich-text library — explicitly removed (see §7).

---

## 3. Architecture

Expo Router emits **iOS, Android, and web from one codebase**, so no separate web app is needed. A single Expo app is the only frontend.

```
Gymli/
├── backend/                 # UNTOUCHED (Node/Express/Firebase/Gemini)
├── packages/
│   └── shared/              # platform-agnostic TypeScript, no RN/DOM imports
│       ├── api/             #   axios client + service wrappers
│       ├── firebase/        #   firebase init (auth/firestore)
│       ├── domain/          #   set-metrics, session-actions, set-fields
│       ├── types/           #   shared TS types / contracts
│       └── (vitest tests for the above)
└── apps/
    └── mobile/              # the Expo app → Android + web (iOS-ready)
        ├── app/             #   Expo Router file-based routes
        ├── components/      #   ui/, workout/, chat/, progress/, log/, layout/
        ├── contexts/        #   Auth, UserProfile, Theme (ported logic)
        ├── hooks/
        └── assets/
   package.json              # npm workspaces (matches existing root tooling)
```

**Boundary rule:** `packages/shared` contains zero React-Native and zero React-DOM imports — only platform-agnostic logic. The app layer owns all UI. This keeps the shared core understandable and testable in isolation, and reusable if another surface is ever added.

---

## 4. Version Stack (verified live, June 2026 — pin these)

| Concern | Package | Version |
|---|---|---|
| Framework | `expo` (**SDK 56**) | 56.0.9 |
| Runtime | `react-native` / `react` | 0.85.3 / 19.2.7 |
| Routing | `expo-router` | 56.2.9 |
| Styling | `nativewind` + `tailwindcss` | 4.2.5 + **3.4.17** |
| Animation | `react-native-reanimated` (+ `react-native-worklets`) | 4.4.1 |
| Gestures | `react-native-gesture-handler` | 3.0.0 |
| Screens / safe area | `react-native-screens` / `react-native-safe-area-context` | 4.25.2 / 5.8.0 |
| Bottom sheet | `@gorhom/bottom-sheet` | 5.2.14 |
| Charts | `react-native-gifted-charts` (+ `react-native-svg`) | 1.4.77 |
| Icons | `lucide-react-native` (+ `react-native-svg`) | 1.17.0 |
| Auth/data | `firebase` (JS SDK) | 12.14.0 |
| Persistence | `@react-native-async-storage/async-storage` | 3.1.1 |
| Native Google sign-in | `@react-native-google-signin/google-signin` | current |
| HTTP / dates | `axios` / `date-fns` | 1.17.0 / 4.4.0 |
| Dev build / CI | `expo-dev-client` + **EAS Build** | current |

**Critical compatibility notes:**
- **NativeWind v4 requires Tailwind v3 (`^3.4.17`), not v4.** The current app is on Tailwind v4. Tailwind utility classes mostly carry over, but `tailwind.config` and theme tokens are re-expressed in v3 syntax. Pinning Tailwind v4 breaks NativeWind.
- **Reanimated 4 is New-Architecture-only** and needs `react-native-worklets` as a separate dep. Expo SDK 56 defaults to New Arch — aligned.
- **No Expo Go.** Native modules (Reanimated/gesture-handler/Google-signin/svg) require a **custom dev build** (`expo-dev-client`).

---

## 5. Library Mapping (old → new)

| Current | Replacement | Notes |
|---|---|---|
| Vite + react-dom | Expo SDK 56 + Expo Router | file-based routing |
| `@capacitor/*` | Expo native APIs | `expo-haptics`, `expo-status-bar`, RN keyboard handling; Capacitor removed entirely |
| `react-router-dom` | `expo-router` | route files under `app/` |
| `framer-motion` | `react-native-reanimated` + gesture-handler | page transitions, animated nav, gestures |
| `vaul` | `@gorhom/bottom-sheet` | BottomSheet component |
| `recharts` | `react-native-gifted-charts` | ExerciseChart, VolumeChart, StreakCalendar |
| `lucide-react` | `lucide-react-native` | same icon set |
| `react-markdown` | **removed** | tiny custom subset renderer (see §7) |
| `axios`, `date-fns`, `firebase` | same packages, latest versions | logic ports unchanged |
| `tailwindcss` v4 | `nativewind` + `tailwindcss` 3.4.17 | classes carry over; config re-expressed |

---

## 6. Auth

Firebase **JS SDK** on every platform so web and native share one auth layer (`@react-native-firebase` is native-only and would not run on web — rejected).

| Seam | Web | Android (native) |
|---|---|---|
| Google sign-in | `signInWithPopup(GoogleAuthProvider)` | `@react-native-google-signin` → Google ID token → `signInWithCredential(GoogleAuthProvider.credential(idToken))` |
| Email/password | unchanged | unchanged |
| Persistence | default (browser) | `initializeAuth` + `getReactNativePersistence(AsyncStorage)` |

`AuthContext`, `UserProfileContext`, `ThemeContext` logic ports nearly verbatim; only the Google-sign-in call and persistence init are platform-branched. The axios request interceptor (attach Firebase ID token) ports unchanged into `packages/shared`.

---

## 7. Chat Formatting (markdown removed)

The only rich-text need is AI chat/coaching responses (bold, bullet lists, paragraphs, line breaks). In React Native, HTML rendering would require a heavier parser library and is worse than markdown; a full markdown library is unnecessary for this small subset.

**Decision:** a **~40-line custom renderer** parses the limited markdown subset Gemini emits and renders native `<Text>`/`<View>`. No third-party dependency. If formatting needs grow later, swap in a maintained markdown library — but not now.

Supported subset: `**bold**`, bullet lists (`-`/`*`), numbered lists, paragraphs, line breaks. Anything outside the subset renders as plain text (graceful degradation).

---

## 8. Data & State

- Keep the existing **React Context** approach (Auth/UserProfile/Theme) — ports directly, no new state library.
- Server calls stay as **axios service wrappers** in `packages/shared/api` (the current `services.js` is a thin, portable layer).
- TanStack Query is explicitly **not** adopted now (YAGNI); revisit only if server-state caching becomes painful.

---

## 9. Dev Workflow & Distribution

- **Custom dev build** via `expo-dev-client` (Expo Go insufficient due to native modules).
- **Android:** `eas build -p android` → Play Store internal testing track.
- **Web:** `npx expo export -p web` → static hosting (can reuse Firebase Hosting).
- **iOS (later):** `eas build -p ios` → TestFlight. iOS cloud builds need **no local Mac**.
- Env: replace Vite's `import.meta.env.VITE_*` with Expo env conventions (`EXPO_PUBLIC_*` / `expo-constants`). `VITE_FIREBASE_CONFIG` / `VITE_API_URL` map to Expo equivalents.

---

## 10. Phased Delivery (ship-fast → polish)

| Phase | Outcome |
|---|---|
| **0 — Scaffold** | Workspaces; Expo SDK 56 app (TS); NativeWind (Tailwind v3) + Expo Router wired; `packages/shared` with ported api/services + firebase init; theme tokens converted. |
| **1 — Vertical slice** | Auth (Google + email) + **Today screen** running on an Android dev build against the live backend. Proves the whole toolchain end-to-end before going wide. |
| **2 — Breadth (Android)** | Port remaining screens: Log + conversational logging, Progress, Profile, Onboarding, Chat, routines. Parity over polish. → Play Store internal track. |
| **3 — Web** | Enable/verify web target; web-specific layout passes; deploy. |
| **4 — Polish** | Reanimated transitions, gesture interactions, chart/animation refinement — the "looks as good as Strava" pass. |
| **5 — Cleanup** | Delete old `frontend/`; update root scripts, CLAUDE.md, CI. |
| **Later — iOS** | EAS iOS build + TestFlight + platform tweaks (safe areas, haptics, gestures). |

Behavior parity per screen is the acceptance bar for Phases 1–3; visual polish is Phase 4.

---

## 11. Testing

| Layer | Tooling |
|---|---|
| `packages/shared` (pure logic) | **Vitest** — existing `set-metrics`, `session-actions`, `set-fields` tests port over |
| `apps/mobile` (components) | **Jest + React Native Testing Library** |
| Backend | unchanged |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Tailwind v4→v3 downgrade churn in theme/config | Re-express tokens once in Phase 0; classes themselves mostly unchanged |
| Native Google sign-in fragile in production builds | Use `@react-native-google-signin` (not `expo-auth-session`) on native; test in a real dev/release build early (Phase 1) |
| Reanimated 4 / New Arch surprises | SDK 56 defaults to New Arch; validate animations in Phase 1 slice before broad use |
| Charts fidelity vs recharts | gifted-charts covers current chart types; if a chart needs gesture/Skia power, escalate that one chart to victory-native XL |
| Web parity gaps (RN Web quirks) | Dedicated Phase 3 web pass; keep old `frontend/` live until web parity reached |
| Scope creep (adding features mid-migration) | Hard parity rule for Phases 1–3; defer enhancements to post-migration |

---

## 13. Definition of Done

- Android dev build + web export run all ported screens at behavior parity with the current app, against the live backend.
- Auth (Google + email) works on Android and web.
- `packages/shared` has zero RN/DOM imports; shared logic tests pass.
- Old `frontend/` removed; root scripts and docs updated.
- (iOS explicitly excluded from this milestone's DoD.)
