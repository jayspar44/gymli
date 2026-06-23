# Gymli → React Native + Expo Migration — Design Spec

**Date:** 2026-06-06
**Status:** Approved (design); revised after best-practice review
**Scope:** Replace the Capacitor/Vite web frontend with a single Expo (React Native) app that targets **Android + web** today, structured so iOS can be added later with little extra work. Backend is untouched.

> Versions and APIs below were verified against live sources (docs.expo.dev, reactnative.dev, firebase.google.com, library docs/GitHub) in June 2026. SDK-managed library versions are intentionally installed via `npx expo install` rather than hardcoded — see §4.

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
- Library swaps (charts, lists, animation, sheets, icons, navigation, styling, auth bridge, keyboard, images, fonts).
- Custom dev build (EAS) for Android; static web export; EAS Update (OTA); Sentry.

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
│       ├── domain/          #   set-metrics, session-actions, set-fields
│       ├── types/           #   shared TS types / contracts
│       ├── package.json     #   "main"/"react-native" → src/index.ts (source, no build step)
│       └── (vitest tests for the above)
└── apps/
    └── mobile/              # the Expo app → Android + web (iOS-ready)
        ├── app/             #   Expo Router file-based routes; (tabs)/ group + _layout
        ├── components/      #   ui/, workout/, chat/, progress/, log/, layout/
        ├── contexts/        #   Auth, UserProfile, Theme (ported logic)
        ├── lib/             #   firebase.web.ts / firebase.native.ts (platform split)
        ├── hooks/
        ├── assets/          #   fonts (Inter), icons, splash
        ├── app.config.ts    #   dynamic config (preferred over app.json)
        ├── eas.json         #   build profiles: development / preview / production
        └── metro.config.js  #   NativeWind + Firebase/Hermes resolver fixes (§8)
   package.json              # npm workspaces (matches existing root tooling)
```

**Boundary rule:** `packages/shared` contains zero React-Native and zero React-DOM imports — only platform-agnostic logic. The app layer owns all UI.

**Monorepo mechanics (current best practice, verified):**
- Manual Metro monorepo boilerplate (`watchFolders`, `nodeModulesPaths`, `disableHierarchicalLookup`) is **not needed** — auto-configured since SDK 52; SDK 56's on-demand filesystem resolves symlink edge cases. Keep `metro.config.js` minimal (only the NativeWind wrap + Firebase fix in §8).
- Metro consumes `packages/shared` **TypeScript source directly — no pre-build step**. The package's `package.json` points `main`/`react-native` at `src/index.ts`; the app's `tsconfig` uses `moduleResolution: "bundler"`. We deliberately use classic `main`/`react-native` fields (not an `exports` map) because §8 disables Metro package-exports to fix Firebase.

---

## 4. Version Strategy & Stack (verified June 2026)

**Strategy:** Pin the framework (**Expo SDK 56**); install every SDK-managed library with **`npx expo install <pkg>`** so Expo resolves the SDK-56-compatible version (these *are* the current versions). Do **not** hardcode patch numbers for SDK-managed libs — they drift and `expo install` prevents mismatches. Non-SDK libs (axios, date-fns, firebase) are pinned explicitly.

| Concern | Package | Version (ref) |
|---|---|---|
| Framework | `expo` (**SDK 56**) | 56.0.x |
| Runtime | `react-native` / `react` | 0.85.x / 19.2.x (SDK-bundled) |
| Routing | `expo-router` | SDK-managed |
| Styling | `nativewind` + `tailwindcss` | 4.2.x + **3.4.17** (NativeWind v4 needs Tailwind **v3**) |
| Animation | `react-native-reanimated` + `react-native-worklets` | 4.x (+ worklets, separate install) |
| Gestures | `react-native-gesture-handler` | SDK-managed |
| Screens / safe area | `react-native-screens` / `react-native-safe-area-context` | SDK-managed |
| Lists | `@shopify/flash-list` | v2.x (New-Arch rewrite) |
| Bottom sheet | `@gorhom/bottom-sheet` | 5.x |
| Charts | `react-native-gifted-charts` (+ `react-native-svg`) | 1.4.x |
| Icons | `lucide-react-native` (+ `react-native-svg`) | 1.x |
| Images | `expo-image` | SDK-managed |
| Fonts | `expo-font` (config plugin) | SDK-managed |
| Keyboard | `react-native-keyboard-controller` | current (complex forms) |
| System bars | `expo-status-bar` + `expo-navigation-bar` | SDK-managed |
| Haptics | `expo-haptics` | SDK-managed |
| Auth/data | `firebase` (JS SDK) | 12.14.x |
| Persistence | `@react-native-async-storage/async-storage` | SDK-managed |
| Native Google sign-in | `@react-native-google-signin/google-signin` | v16.x |
| HTTP / dates | `axios` / `date-fns` | 1.17.x / 4.4.x |
| Dev build / CI / OTA | `expo-dev-client` + **EAS Build** + **EAS Update** (`expo-updates`) | current |
| Monitoring | `@sentry/react-native` | current |

**Critical compatibility notes:**
- **NativeWind v4 requires Tailwind v3 (`^3.4.17`).** Current app is on Tailwind v4. Classes mostly carry over; `tailwind.config` + theme tokens re-expressed in v3 syntax. Pinning Tailwind v4 breaks NativeWind.
- **Reanimated 4 is New-Architecture-only**; needs `react-native-worklets` separately. On Expo, `babel-preset-expo` auto-adds the worklets babel plugin — no manual babel edit. (Old `react-native-reanimated/plugin` path is gone.)
- **No Expo Go** — native modules (Reanimated/gesture-handler/Google-signin/keyboard-controller/svg/flash-list native bits) require a **custom dev build** (`expo-dev-client`).
- **Android edge-to-edge is mandatory** in SDK 55+ (opt-out flag removed) — see §8.

---

## 5. Library & Pattern Mapping (old → new)

| Current | Replacement | Notes |
|---|---|---|
| Vite + react-dom | Expo SDK 56 + Expo Router | file-based routing; `(tabs)/` group |
| `@capacitor/*` | Expo native APIs | `expo-haptics`, `expo-status-bar`/`expo-navigation-bar`; Capacitor removed entirely |
| `react-router-dom` | `expo-router` | route files under `app/`; **don't** import `@react-navigation/*` (removed dep in SDK 56) |
| `framer-motion` | `react-native-reanimated` + gesture-handler | transitions, animated nav, gestures |
| `vaul` | `@gorhom/bottom-sheet` | BottomSheet component |
| `recharts` | `react-native-gifted-charts` | ExerciseChart, VolumeChart, StreakCalendar |
| list rendering (`.map`/scroll) | `@shopify/flash-list` v2 | workout history, exercise picker (long/variable lists) |
| `lucide-react` | `lucide-react-native` | same icon set |
| `react-markdown` | **removed** | tiny custom subset renderer (see §7) |
| `<img>` | `expo-image` | caching, placeholders |
| Tailwind v4 | `nativewind` + Tailwind 3.4.17 | classes carry over; config re-expressed |
| keyboard handling | `react-native-keyboard-controller` | set-logging + profile forms |
| custom fonts (Inter) | `expo-font` config plugin | bundled at build, no async load |

---

## 6. Auth

Firebase **JS SDK** on every platform so web and native share one auth layer (`@react-native-firebase` is native-only and would not run on web — rejected).

**Platform split via Metro file resolution** (`apps/mobile/lib/firebase.web.ts` and `firebase.native.ts`):

```ts
// firebase.native.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; // import from 'firebase/auth', NOT '/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';
const app = initializeApp(firebaseConfig);
// @ts-ignore — getReactNativePersistence exists at runtime; types-only false positive (firebase-js-sdk #9316)
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

// firebase.web.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
export const auth = getAuth(initializeApp(firebaseConfig)); // default browser persistence
```

| Seam | Web | Android (native) |
|---|---|---|
| Google sign-in | `signInWithPopup(GoogleAuthProvider)` | `@react-native-google-signin` → `isSuccessResponse(res)` → `res.data.idToken` → `signInWithCredential(auth, GoogleAuthProvider.credential(idToken))` |
| Email/password | unchanged | unchanged |
| Persistence | default (browser) | `initializeAuth` + `getReactNativePersistence(AsyncStorage)` |

- Native Google sign-in needs the config plugin (`@react-native-google-signin/google-signin` with `iosUrlScheme`), a configured `webClientId`, and a **dev build** (not Expo Go). Because we use the Firebase JS SDK (not @react-native-firebase), **no `google-services.json` is required for auth** — only the plugin + `webClientId`.
- `AuthContext`, `UserProfileContext`, `ThemeContext` logic ports nearly verbatim; only the Google-sign-in call and persistence init are platform-branched. The axios request interceptor (attach Firebase ID token) ports unchanged into `packages/shared`.

---

## 7. Chat Formatting (markdown removed)

The only rich-text need is AI chat/coaching responses (bold, bullet lists, paragraphs, line breaks). In React Native, HTML rendering would require a heavier parser library and is worse than markdown; a full markdown library is unnecessary for this small subset.

**Decision:** a **~40-line custom renderer** parses the limited markdown subset Gemini emits and renders native `<Text>`/`<View>`. No third-party dependency. If formatting needs grow later, swap in a maintained markdown library — but not now.

Supported subset: `**bold**`, bullet lists (`-`/`*`), numbered lists, paragraphs, line breaks. Anything outside the subset renders as plain text (graceful degradation).

---

## 8. Build Config, Metro & Platform Setup (the gotchas)

**Metro (`apps/mobile/metro.config.js`)** — wrap with NativeWind and apply the Firebase/Hermes fix:
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');                 // Firebase ships .cjs
config.resolver.unstable_enablePackageExports = false;  // fixes "Component auth has not been registered yet" on Hermes
module.exports = withNativeWind(config, { input: './global.css' });
```
This is why `packages/shared` uses classic `main`/`react-native` fields rather than an `exports` map (disabling package-exports is global).

**NativeWind v4 setup:** `tailwind.config.js` with `presets: [require('nativewind/preset')]`; `global.css` with the three `@tailwind` directives imported once in root `_layout`; `babel-preset-expo` with `{ jsxImportSource: 'nativewind' }`; `app.config.ts` web `bundler: 'metro'`; `nativewind-env.d.ts` (not `nativewind.d.ts`).

**Android edge-to-edge (mandatory, SDK 55+):** wrap app in `SafeAreaProvider`; consume insets via `useSafeAreaInsets()` / `SafeAreaView` from `react-native-safe-area-context` (RN's own `SafeAreaView` is deprecated). Audit every screen for hardcoded top/bottom padding. Style bars with `expo-status-bar` + `expo-navigation-bar`.

**Web (`app.config.ts`):** `web.output: "static"` for SSG/SEO; export via `npx expo export --platform web` → static `dist/`. (`"single"` = SPA without SEO; `"server"` only if dynamic SSR is needed.)

**Config & env:** use `app.config.ts` (dynamic) over `app.json`. Env vars via `EXPO_PUBLIC_*` are **inlined at build time and are not secret** — the Firebase *web* config (apiKey etc.) is an identifier set, safe to embed (security is enforced by Firestore rules + App Check). Never put service-account/admin creds in client env.

**Typed routes:** enable `experiments.typedRoutes: true` (still opt-in/beta but recommended).

---

## 9. Data & State

- Keep the existing **React Context** approach (Auth/UserProfile/Theme) — ports directly, no new state library.
- Server calls stay as **axios service wrappers** in `packages/shared/api` (the current `services.js` is a thin, portable layer).
- TanStack Query is explicitly **not** adopted now (YAGNI); revisit only if server-state caching becomes painful.

---

## 10. Dev Workflow & Distribution

- **Custom dev build** via `expo-dev-client` (Expo Go insufficient due to native modules).
- **EAS Build profiles:** `development` (dev client), `preview` (internal distribution), `production` (store). Per-profile env in `eas.json`.
- **Android:** `eas build -p android` → Play Store internal testing track.
- **Web:** `npx expo export -p web` (static) → Firebase Hosting (reuse existing).
- **OTA:** **EAS Update** (`expo-updates`) with channels per profile + runtime-version policy; use staged rollouts for production.
- **Monitoring:** Sentry React Native SDK (tag by OTA channel/version).
- **iOS (later):** `eas build -p ios` → TestFlight; iOS cloud builds need **no local Mac**.

---

## 11. Phased Delivery (ship-fast → polish)

| Phase | Outcome |
|---|---|
| **0 — Scaffold** | npm workspaces; Expo SDK 56 app (TS) with dev client; NativeWind (Tailwind v3) + Expo Router (typed routes); `metro.config.js` Firebase fix; `packages/shared` (api/services + domain utils) consumed as source; theme tokens converted; `SafeAreaProvider` + edge-to-edge baseline; Inter via expo-font plugin. |
| **1 — Vertical slice** | Auth (Google native + email + web popup) + **Today screen** running on an Android dev build against the live backend. Proves toolchain end-to-end (Reanimated, NativeWind, Firebase-on-Hermes, Google sign-in in a real build) before going wide. |
| **2 — Breadth (Android)** | Port remaining screens: Log + conversational logging, Progress (gifted-charts), Profile, Onboarding, Chat (custom renderer), routines. Lists via FlashList; forms via keyboard-controller. Parity over polish. → Play Store internal track. |
| **3 — Web** | `web.output: static`; web-specific layout passes; deploy to Firebase Hosting. |
| **4 — Polish** | Reanimated transitions + shared-element transitions, gesture interactions, chart/animation refinement, expo-image, splash/icon — the "looks as good as Strava" pass. EAS Update + Sentry wired. |
| **5 — Cleanup** | Delete old `frontend/`; update root scripts, CLAUDE.md, CI. |
| **Later — iOS** | EAS iOS build + TestFlight + platform tweaks (safe areas, haptics, gestures, zoom transitions). |

Behavior parity per screen is the acceptance bar for Phases 1–3; visual polish is Phase 4.

---

## 12. Testing

| Layer | Tooling |
|---|---|
| `packages/shared` (pure logic) | **Vitest** — existing `set-metrics`, `session-actions`, `set-fields` tests port over |
| `apps/mobile` (components) | **Jest (`jest-expo` preset) + React Native Testing Library** |
| Backend | unchanged |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Firebase "auth not registered" on Hermes | `metro.config.js`: `sourceExts += 'cjs'` + `unstable_enablePackageExports=false` (§8); validate in Phase 1 |
| `getReactNativePersistence` TS error | runtime-valid; `// @ts-ignore` (firebase-js-sdk #9316) |
| Native Google sign-in fragile in release builds | use `@react-native-google-signin` (not expo-auth-session); test in a real dev build in Phase 1; use `res.data.idToken` + `isSuccessResponse` |
| Tailwind v4→v3 downgrade churn | re-express tokens once in Phase 0; classes mostly unchanged |
| Reanimated 4 / New Arch surprises | SDK 56 New-Arch default; install `react-native-worklets`; validate animations in Phase 1 |
| Edge-to-edge content under system bars | `SafeAreaProvider` + `useSafeAreaInsets` audit per screen (§8) |
| Version drift / mismatches | install SDK-managed libs via `npx expo install`, not hardcoded patches (§4) |
| Charts fidelity vs recharts | gifted-charts covers current types; escalate a specific chart to victory-native XL only if it needs Skia/gesture power |
| Web parity gaps (RN Web quirks) | dedicated Phase 3 web pass; keep old `frontend/` live until web parity reached |
| Scope creep mid-migration | hard parity rule for Phases 1–3; defer enhancements to post-migration |

---

## 14. Definition of Done

- Android dev build + static web export run all ported screens at behavior parity with the current app, against the live backend.
- Auth (Google + email) works on Android and web.
- `packages/shared` has zero RN/DOM imports; shared logic tests pass.
- Old `frontend/` removed; root scripts and docs updated.
- EAS Build (Android) + EAS Update + Sentry configured.
- (iOS explicitly excluded from this milestone's DoD.)
