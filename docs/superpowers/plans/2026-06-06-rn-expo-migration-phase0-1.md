# Gymli RN + Expo Migration — Phase 0 (Scaffold) & Phase 1 (Vertical Slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an Expo SDK 56 monorepo and prove the entire toolchain end-to-end by running Login (Google + email) and a ported Today screen on an Android dev build against the live backend.

**Architecture:** npm-workspaces monorepo. `packages/shared` holds platform-agnostic TypeScript (API client via dependency injection, services, domain utils, types — zero React-Native/DOM imports). `apps/mobile` is a single Expo app (Expo Router) that owns all UI and the platform-split Firebase init, targeting Android + web (iOS-ready). Backend untouched.

**Tech Stack:** Expo SDK 56 (RN 0.85 / React 19.2, New Arch, Hermes v1), Expo Router, NativeWind 4 (Tailwind v3.4.17), Reanimated 4 + worklets, Firebase JS SDK 12, `@react-native-google-signin/google-signin`, TypeScript, Vitest (shared) + Jest/jest-expo (app).

**Spec:** `docs/superpowers/specs/2026-06-06-react-native-expo-migration-design.md`

---

## File Structure (created in this plan)

| Path | Responsibility |
|---|---|
| `package.json` (root) | add npm `workspaces` for `apps/*` + `packages/*` |
| `packages/shared/package.json` | `main`/`react-native` → `src/index.ts` (source, no build) |
| `packages/shared/tsconfig.json` | TS config for the shared lib |
| `packages/shared/vitest.config.ts` | Vitest runner |
| `packages/shared/src/index.ts` | barrel export |
| `packages/shared/src/api/client.ts` | `createApiClient({ baseURL, getToken })` (DI, no firebase import) |
| `packages/shared/src/api/services.ts` | `createServices(client)` → typed service methods |
| `packages/shared/src/domain/set-fields.ts` | ported from `frontend/src/utils/set-fields.js` |
| `packages/shared/src/domain/session-actions.ts` | ported from `frontend/src/utils/session-actions.js` |
| `packages/shared/src/types/index.ts` | shared domain types |
| `apps/mobile/` | Expo app (created via `create-expo-app`) |
| `apps/mobile/metro.config.js` | NativeWind wrap + Firebase/Hermes resolver fix |
| `apps/mobile/tailwind.config.js` | NativeWind preset + theme tokens |
| `apps/mobile/global.css` | Tailwind directives |
| `apps/mobile/babel.config.js` | `babel-preset-expo` + nativewind jsxImportSource |
| `apps/mobile/app.config.ts` | dynamic Expo config (web static, plugins, env) |
| `apps/mobile/eas.json` | build profiles |
| `apps/mobile/nativewind-env.d.ts` | NativeWind types |
| `apps/mobile/lib/firebase.web.ts` / `firebase.native.ts` | platform-split Firebase init |
| `apps/mobile/lib/api.ts` | wires `createApiClient`/`createServices` with firebase token |
| `apps/mobile/lib/theme.ts` | theme token constants |
| `apps/mobile/contexts/AuthContext.tsx` | auth (email + Google web/native) |
| `apps/mobile/contexts/UserProfileContext.tsx` | profile |
| `apps/mobile/contexts/ThemeContext.tsx` | theme (NativeWind colorScheme + AsyncStorage) |
| `apps/mobile/app/_layout.tsx` | root layout: providers + SafeArea + auth gate |
| `apps/mobile/app/login.tsx` | Login screen |
| `apps/mobile/app/(tabs)/_layout.tsx` | tab navigator |
| `apps/mobile/app/(tabs)/index.tsx` | Today screen |

---

## Task 1: Add npm workspaces to the root

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Add the `workspaces` field**

Add this top-level key to the root `package.json` (after `"type": "module",`):

```json
"workspaces": [
  "apps/*",
  "packages/*",
  "frontend",
  "backend"
],
```

(Keeping `frontend`/`backend` listed avoids breaking existing installs during the migration.)

- [ ] **Step 2: Create the directories**

Run:
```bash
mkdir -p apps packages/shared/src/{api,domain,types}
```
Expected: directories created, no output.

- [ ] **Step 3: Verify workspace resolution still works**

Run: `npm install`
Expected: completes without error; root `node_modules` present.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add npm workspaces for apps and packages"
```

---

## Task 2: Create the `packages/shared` library shell

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/vitest.config.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Write `packages/shared/package.json`**

```json
{
  "name": "@gymli/shared",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "react-native": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "axios": "1.17.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^4.1.7"
  }
}
```

We point `main`/`react-native` at the **TypeScript source** — Metro transpiles it directly (no build step), and §8's Metro config disables package-exports so classic fields are used.

- [ ] **Step 2: Write `packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "declaration": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `packages/shared/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { globals: true, environment: 'node' },
});
```

- [ ] **Step 4: Write a placeholder `packages/shared/src/index.ts`**

```ts
export * from './api/client';
export * from './api/services';
export * from './domain/set-fields';
export * from './domain/session-actions';
export * from './types';
```

- [ ] **Step 5: Install workspace deps**

Run: `npm install`
Expected: `@gymli/shared` linked into the workspace; no errors. (Index imports will error until later tasks add the files — that's fine, nothing builds them yet.)

- [ ] **Step 6: Commit**

```bash
git add packages/shared
git commit -m "chore: scaffold @gymli/shared workspace package"
```

---

## Task 3: Port domain utils into `packages/shared` (TDD)

The current `frontend/src/utils/set-fields.js` and `session-actions.js` are pure logic with existing Vitest tests. Port them to TS verbatim and bring the tests.

**Files:**
- Create: `packages/shared/src/domain/set-fields.ts`
- Create: `packages/shared/src/domain/set-fields.test.ts`
- Create: `packages/shared/src/domain/session-actions.ts`
- Create: `packages/shared/src/domain/session-actions.test.ts`

- [ ] **Step 1: Copy the source files and rename to `.ts`**

Run:
```bash
cp frontend/src/utils/set-fields.js packages/shared/src/domain/set-fields.ts
cp frontend/src/utils/set-fields.test.js packages/shared/src/domain/set-fields.test.ts
cp frontend/src/utils/session-actions.js packages/shared/src/domain/session-actions.ts
cp frontend/src/utils/session-actions.test.js packages/shared/src/domain/session-actions.test.ts
```

- [ ] **Step 2: Fix test import paths**

In both `*.test.ts` files, ensure the import points at the local module (e.g. `from './set-fields'`). Add explicit types only where TS `strict` complains; otherwise leave logic identical.

- [ ] **Step 3: Run the tests (expect PASS after port)**

Run: `npm test --workspace @gymli/shared`
Expected: both suites PASS (same assertions as the originals).

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/domain
git commit -m "feat(shared): port set-fields and session-actions domain utils to TS"
```

---

## Task 4: Shared API client via dependency injection (TDD)

The current `frontend/src/api/client.js` imports the Firebase `auth` singleton. In the monorepo that would couple shared → app. Replace with a factory that receives a `getToken` function.

**Files:**
- Create: `packages/shared/src/api/client.ts`
- Create: `packages/shared/src/api/client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { createApiClient } from './client';

test('attaches bearer token from getToken to each request', async () => {
  const client = createApiClient({
    baseURL: 'http://x',
    getToken: async () => 'TOKEN123',
  });
  const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
  expect(config.headers.Authorization).toBe('Bearer TOKEN123');
});

test('omits Authorization when getToken returns null', async () => {
  const client = createApiClient({ baseURL: 'http://x', getToken: async () => null });
  const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
  expect(config.headers.Authorization).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace @gymli/shared -- client`
Expected: FAIL — `createApiClient` not defined.

- [ ] **Step 3: Implement `client.ts`**

```ts
import axios, { type AxiosInstance } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getToken: () => Promise<string | null>;
  timeoutMs?: number;
}

export function createApiClient({ baseURL, getToken, timeoutMs = 30000 }: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace @gymli/shared -- client`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/api/client.ts packages/shared/src/api/client.test.ts
git commit -m "feat(shared): add DI-based api client factory"
```

---

## Task 5: Shared services factory (TDD)

Port `frontend/src/api/services.js` into a `createServices(client)` factory returning all service methods.

**Files:**
- Create: `packages/shared/src/api/services.ts`
- Create: `packages/shared/src/api/services.test.ts`
- Create: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Write minimal shared types**

`packages/shared/src/types/index.ts`:
```ts
export interface Routine { id: string; name: string; exercises?: unknown[] }
export interface TodayData {
  alreadyLoggedToday?: boolean;
  existingWorkout?: { exercises?: unknown[] };
}
export interface StreakData { currentStreak?: number }
export interface DailyTip { tip: string | null }
```

- [ ] **Step 2: Write the failing test**

```ts
import { createServices } from './services';

function fakeClient() {
  const calls: any[] = [];
  return {
    calls,
    get: (url: string, cfg?: any) => { calls.push(['get', url, cfg]); return Promise.resolve({ data: { ok: url } }); },
    post: (url: string, body?: any) => { calls.push(['post', url, body]); return Promise.resolve({ data: { ok: url } }); },
    put: (url: string, body?: any) => { calls.push(['put', url, body]); return Promise.resolve({ data: { ok: url } }); },
    delete: (url: string) => { calls.push(['delete', url]); return Promise.resolve({ data: { ok: url } }); },
  } as any;
}

test("getTodaysWorkout hits /workouts/today and unwraps data", async () => {
  const c = fakeClient();
  const s = createServices(c);
  const r = await s.getTodaysWorkout();
  expect(c.calls[0]).toEqual(['get', '/workouts/today', undefined]);
  expect(r).toEqual({ ok: '/workouts/today' });
});

test("getRoutines hits /routines", async () => {
  const c = fakeClient();
  await createServices(c).getRoutines();
  expect(c.calls[0]).toEqual(['get', '/routines', undefined]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test --workspace @gymli/shared -- services`
Expected: FAIL — `createServices` not defined.

- [ ] **Step 4: Implement `services.ts`** (port every method from the current `services.js`)

```ts
import type { AxiosInstance } from 'axios';

export function createServices(client: AxiosInstance) {
  const get = <T>(url: string, config?: any) => client.get<T>(url, config).then(r => r.data);
  const post = <T>(url: string, body?: any) => client.post<T>(url, body).then(r => r.data);
  const put = <T>(url: string, body?: any) => client.put<T>(url, body).then(r => r.data);
  const del = <T>(url: string) => client.delete<T>(url).then(r => r.data);

  return {
    // User profile
    getProfile: () => get('/user/profile'),
    updateProfile: (data: any) => post('/user/profile', data),
    // Routines
    getRoutines: () => get('/routines'),
    createRoutine: (data: any) => post('/routines', data),
    getRoutine: (id: string) => get(`/routines/${id}`),
    updateRoutine: (id: string, data: any) => put(`/routines/${id}`, data),
    deleteRoutine: (id: string) => del(`/routines/${id}`),
    // Exercises
    searchExercises: (params: any) => get('/exercises', { params }),
    // Workouts
    getTodaysWorkout: () => get('/workouts/today'),
    logWorkout: (data: any) => post('/workouts', data),
    getWorkouts: (params: any) => get('/workouts', { params }),
    updateWorkout: (id: string, data: any) => put(`/workouts/${id}`, data),
    deleteWorkout: (id: string) => del(`/workouts/${id}`),
    getPreviousPerformance: (exerciseIds: string[]) => post('/workouts/previous', { exerciseIds }),
    // Chat
    sendChat: (message: string, context: any) => post('/chat', { message, context }),
    getChatHistory: (limit?: number) => get('/chat/history', { params: { limit } }),
    clearChatHistory: () => del('/chat/history'),
    // Conversational logging
    parseLog: (payload: any) => post('/log/parse', payload),
    // Coaching
    getDailyTip: () => get('/coaching/tip'),
    // Stats
    getExerciseProgress: (exerciseId: string) => get(`/stats/exercise/${exerciseId}`),
    getVolumeStats: (period: string) => get('/stats/volume', { params: { period } }),
    getStreakData: () => get('/stats/streak'),
    getInsights: () => get('/stats/insights'),
    getLoggedExercises: () => get('/stats/exercises'),
  };
}

export type Services = ReturnType<typeof createServices>;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace @gymli/shared -- services`
Expected: PASS.

- [ ] **Step 6: Run the whole shared suite**

Run: `npm test --workspace @gymli/shared`
Expected: all suites PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src
git commit -m "feat(shared): add services factory and shared types"
```

---

## Task 6: Create the Expo SDK 56 app

**Files:**
- Create: `apps/mobile/` (generated)

- [ ] **Step 1: Generate the app**

Run:
```bash
cd apps && npx create-expo-app@latest mobile --template default && cd ..
```
Expected: `apps/mobile` created with Expo Router default template.

- [ ] **Step 2: Verify the SDK is 56**

Run: `cat apps/mobile/package.json | grep '"expo"'`
Expected: `"expo": "~56...."`. If the template scaffolds an older SDK, run `cd apps/mobile && npx expo install expo@^56 && npx expo install --fix && cd ../..`.

- [ ] **Step 3: Add the dev client + core native libs (via expo install so versions match SDK 56)**

Run:
```bash
cd apps/mobile
npx expo install expo-dev-client react-native-reanimated react-native-worklets react-native-gesture-handler react-native-safe-area-context react-native-screens
npx expo install firebase @react-native-async-storage/async-storage
npm install @gymli/shared@*
cd ../..
```
Expected: installs complete; `@gymli/shared` linked from the workspace.

- [ ] **Step 4: Sanity check the dev server boots**

Run: `cd apps/mobile && npx expo start --clear` (Ctrl-C after it prints the QR/Metro bundler URL), then `cd ../..`
Expected: Metro starts without resolver errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile package-lock.json
git commit -m "chore(mobile): scaffold expo sdk 56 app with dev client and native deps"
```

---

## Task 7: Configure NativeWind + the Metro Firebase/Hermes fix

**Files:**
- Modify: `apps/mobile/package.json` (add nativewind + tailwind)
- Create: `apps/mobile/global.css`
- Create/Modify: `apps/mobile/tailwind.config.js`
- Create/Modify: `apps/mobile/babel.config.js`
- Create/Modify: `apps/mobile/metro.config.js`
- Create: `apps/mobile/nativewind-env.d.ts`

- [ ] **Step 1: Install NativeWind + Tailwind v3**

Run:
```bash
cd apps/mobile
npm install nativewind@^4.2.5
npm install -D tailwindcss@3.4.17
cd ../..
```

- [ ] **Step 2: Write `apps/mobile/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Write `apps/mobile/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ported from the current zinc/amber theme
        primary: '#d4872a',
        bg: { DEFAULT: '#fafafa', dark: '#09090b' },
        surface: { DEFAULT: '#ffffff', alt: '#f4f4f5', dark: '#18181b' },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Write `apps/mobile/babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```
(`babel-preset-expo` auto-adds the `react-native-worklets/plugin` — do not add it manually.)

- [ ] **Step 5: Write `apps/mobile/metro.config.js` (NativeWind + Firebase fix)**

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');                // Firebase ships .cjs files
config.resolver.unstable_enablePackageExports = false; // fixes "Component auth has not been registered yet" on Hermes

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 6: Write `apps/mobile/nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 7: Import `global.css` once in the root layout**

In `apps/mobile/app/_layout.tsx` (template-generated), add at the very top:
```tsx
import '../global.css';
```

- [ ] **Step 8: Verify a NativeWind class renders**

Temporarily set the template index screen's root `View` to `className="flex-1 items-center justify-center bg-primary"`. Run `cd apps/mobile && npx expo start --clear`, open on Android, confirm an amber background. Revert the temporary change after confirming.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile
git commit -m "chore(mobile): configure nativewind v4 and metro firebase/hermes fix"
```

---

## Task 8: app.config.ts, eas.json, env, and SafeArea/edge-to-edge baseline

**Files:**
- Create: `apps/mobile/app.config.ts`
- Delete: `apps/mobile/app.json` (fold into app.config.ts)
- Create: `apps/mobile/eas.json`
- Create: `apps/mobile/.env.local` (gitignored) + `apps/mobile/.env.example`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Write `apps/mobile/app.config.ts`**

```ts
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Gymli',
  slug: 'gymli',
  scheme: 'gymli',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  android: { package: 'com.gymli.app' }, // edge-to-edge is default in SDK 56; the old edgeToEdgeEnabled flag was removed
  web: { bundler: 'metro', output: 'static' },
  plugins: [
    'expo-router',
    'expo-font',
    ['@react-native-google-signin/google-signin', {}],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    firebaseConfig: process.env.EXPO_PUBLIC_FIREBASE_CONFIG,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  },
};

export default config;
```

- [ ] **Step 2: Remove `app.json`**

Run: `rm apps/mobile/app.json`
(If the template put required keys like `icon`/`splash` in `app.json`, copy them into `app.config.ts` first.)

- [ ] **Step 3: Write `apps/mobile/.env.example`**

```bash
EXPO_PUBLIC_API_URL=https://<your-backend-host>/api
EXPO_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-oauth-client-id>.apps.googleusercontent.com
```

- [ ] **Step 4: Create `.env.local` with real values**

Copy the Firebase web config from the current `frontend/.env.local` (`VITE_FIREBASE_CONFIG` value) into `EXPO_PUBLIC_FIREBASE_CONFIG`. Set `EXPO_PUBLIC_API_URL` to the deployed backend URL (or your machine's LAN IP `http://<LAN-IP>:<port>/api` for local dev — `localhost` will not work from an Android device). Confirm `.env.local` is gitignored.

Run: `grep -q '.env.local' apps/mobile/.gitignore || echo '.env.local' >> apps/mobile/.gitignore`

- [ ] **Step 5: Write `apps/mobile/eas.json`**

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "android": { "buildType": "apk" } },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

- [ ] **Step 6: Wrap the root layout in SafeAreaProvider**

Replace `apps/mobile/app/_layout.tsx` with:
```tsx
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```
(Providers for Auth/Profile/Theme are added in Task 11–12.)

- [ ] **Step 7: Verify it still boots**

Run: `cd apps/mobile && npx expo start --clear` then Ctrl-C, `cd ../..`
Expected: no config errors; Metro starts.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile
git commit -m "chore(mobile): app.config.ts, eas profiles, env, safe-area baseline"
```

---

## Task 9: Platform-split Firebase init + api wiring

**Files:**
- Create: `apps/mobile/lib/firebase.web.ts`
- Create: `apps/mobile/lib/firebase.native.ts`
- Create: `apps/mobile/lib/firebase.ts` (shared config loader + re-export type)
- Create: `apps/mobile/lib/api.ts`

- [ ] **Step 1: Write `apps/mobile/lib/firebase.ts` (config loader)**

```ts
import Constants from 'expo-constants';

export function getFirebaseConfig() {
  const raw = Constants.expoConfig?.extra?.firebaseConfig as string | undefined;
  if (!raw) throw new Error('EXPO_PUBLIC_FIREBASE_CONFIG is not set');
  return JSON.parse(raw);
}
```

- [ ] **Step 2: Write `apps/mobile/lib/firebase.native.ts`**

```ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseConfig } from './firebase';

const app = initializeApp(getFirebaseConfig());
// @ts-ignore getReactNativePersistence exists at runtime (firebase-js-sdk #9316 — types-only gap)
export const auth: Auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
```

- [ ] **Step 3: Write `apps/mobile/lib/firebase.web.ts`**

```ts
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseConfig } from './firebase';

export const auth: Auth = getAuth(initializeApp(getFirebaseConfig()));
```

Metro resolves `firebase.native.ts` on Android/iOS and `firebase.web.ts` on web automatically when importing `./firebase` — but since `firebase.ts` already exists as the config loader, import the auth instance explicitly from a barrel. Create the platform split via a dedicated name instead:

Rename the platform files to `auth.native.ts` / `auth.web.ts` and import `{ auth } from './auth'`. Apply that naming now:
```bash
cd apps/mobile/lib && mv firebase.native.ts auth.native.ts && mv firebase.web.ts auth.web.ts && cd ../../..
```

- [ ] **Step 4: Write `apps/mobile/lib/api.ts`**

```ts
import Constants from 'expo-constants';
import { createApiClient, createServices } from '@gymli/shared';
import { auth } from './auth';

const baseURL = (Constants.expoConfig?.extra?.apiUrl as string) ?? '/api';

const client = createApiClient({
  baseURL,
  getToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
});

export const api = createServices(client);
```

- [ ] **Step 5: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit; cd ../..`
Expected: no errors (the `@ts-ignore` covers the persistence gap).

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib
git commit -m "feat(mobile): platform-split firebase auth init and api wiring"
```

---

## Task 10: AuthContext (email + Google web/native)

**Files:**
- Create: `apps/mobile/contexts/AuthContext.tsx`
- Add dep: `@react-native-google-signin/google-signin`

- [ ] **Step 1: Install the native Google sign-in lib**

Run: `cd apps/mobile && npx expo install @react-native-google-signin/google-signin && cd ../..`

- [ ] **Step 2: Write `apps/mobile/contexts/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, GoogleAuthProvider, signInWithCredential, signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/auth';

type AuthValue = {
  user: User | null;
  loading: boolean;
  signInWithEmail: (e: string, p: string) => Promise<unknown>;
  signUpWithEmail: (e: string, p: string) => Promise<unknown>;
  signInWithGoogle: () => Promise<unknown>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);

  async function signInWithGoogle() {
    if (Platform.OS === 'web') {
      return signInWithPopup(auth, new GoogleAuthProvider());
    }
    const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId as string,
    });
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) throw new Error('Google sign-in cancelled');
    const idToken = res.data.idToken;
    return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  }

  const value: AuthValue = {
    user, loading,
    signInWithEmail: (e, p) => signInWithEmailAndPassword(auth, e, p),
    signUpWithEmail: (e, p) => createUserWithEmailAndPassword(auth, e, p),
    signInWithGoogle,
    signOut: () => fbSignOut(auth),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 3: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/contexts/AuthContext.tsx apps/mobile/package.json
git commit -m "feat(mobile): auth context with email and google (web+native) sign-in"
```

---

## Task 11: UserProfile + Theme contexts

**Files:**
- Create: `apps/mobile/contexts/UserProfileContext.tsx`
- Create: `apps/mobile/contexts/ThemeContext.tsx`

- [ ] **Step 1: Write `apps/mobile/contexts/UserProfileContext.tsx`** (port of the current logic, using `api`)

```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

type ProfileValue = {
  profile: any | null; loading: boolean; error: string | null;
  updateProfile: (d: any) => Promise<any>; refreshProfile: () => Promise<void>;
  needsOnboarding: boolean;
};
const Ctx = createContext<ProfileValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    try {
      setLoading(true);
      setProfile(await api.getProfile()); setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) setProfile(null);
      else setError(err.message);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const updateProfile = useCallback(async (data: any) => {
    const updated = await api.updateProfile(data); setProfile(updated); return updated;
  }, []);

  return (
    <Ctx.Provider value={{
      profile, loading, error, updateProfile, refreshProfile: loadProfile,
      needsOnboarding: !loading && !error && !!user && !profile?.onboardingComplete,
    }}>{children}</Ctx.Provider>
  );
}
export function useUserProfile() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUserProfile must be used within UserProfileProvider');
  return c;
}
```

- [ ] **Step 2: Write `apps/mobile/contexts/ThemeContext.tsx`** (NativeWind colorScheme + AsyncStorage)

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';

type Pref = 'light' | 'dark' | 'system';
type ThemeValue = { theme: 'light' | 'dark'; preference: Pref; setTheme: (p: Pref) => void; toggleTheme: () => void; isDark: boolean };
const Ctx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [preference, setPreference] = useState<Pref>('system');

  useEffect(() => {
    AsyncStorage.getItem('gymli-theme').then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') { setPreference(v); setColorScheme(v); }
    });
  }, []);

  const setTheme = (p: Pref) => { setPreference(p); setColorScheme(p); AsyncStorage.setItem('gymli-theme', p); };
  const resolved = (colorScheme ?? 'light') as 'light' | 'dark';

  return (
    <Ctx.Provider value={{
      theme: resolved, preference, setTheme,
      toggleTheme: () => setTheme(resolved === 'dark' ? 'light' : 'dark'),
      isDark: resolved === 'dark',
    }}>{children}</Ctx.Provider>
  );
}
export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme must be used within ThemeProvider');
  return c;
}
```

- [ ] **Step 3: Wire all three providers into `app/_layout.tsx`**

Update `apps/mobile/app/_layout.tsx` to nest providers inside `SafeAreaProvider`:
```tsx
import { AuthProvider } from '../contexts/AuthContext';
import { UserProfileProvider } from '../contexts/UserProfileContext';
import { ThemeProvider } from '../contexts/ThemeContext';
// ...inside SafeAreaProvider, wrap <Stack/>:
// <ThemeProvider><AuthProvider><UserProfileProvider> ... </UserProfileProvider></AuthProvider></ThemeProvider>
```

- [ ] **Step 4: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile
git commit -m "feat(mobile): user profile and theme contexts; wire providers"
```

---

## Task 12: Auth-gated routing (Login route + protected tabs)

**Files:**
- Create: `apps/mobile/app/login.tsx`
- Modify: `apps/mobile/app/_layout.tsx` (redirect logic)
- Create: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add the auth gate to `_layout.tsx`**

Inside the providers, render a gate component that uses `useAuth()` and `useRouter()` from `expo-router`:
```tsx
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'login';
    if (!user && !inAuth) router.replace('/login');
    else if (user && inAuth) router.replace('/');
  }, [user, loading, segments]);
  return null;
}
```
Render `<AuthGate />` alongside `<Stack />`.

- [ ] **Step 2: Write `apps/mobile/app/(tabs)/_layout.tsx`** (single Today tab for the slice)

```tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Write `apps/mobile/app/login.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setErr(null);
    try { await fn(); } catch (e: any) { setErr(e.message ?? 'Sign-in failed'); } finally { setBusy(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-1 justify-center gap-3 px-6">
        <Text className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Gymli</Text>
        <TextInput className="rounded-xl bg-surface-alt px-4 py-3 dark:bg-surface-dark dark:text-zinc-50"
          placeholder="Email" autoCapitalize="none" keyboardType="email-address"
          value={email} onChangeText={setEmail} />
        <TextInput className="rounded-xl bg-surface-alt px-4 py-3 dark:bg-surface-dark dark:text-zinc-50"
          placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {err ? <Text className="text-sm text-red-500">{err}</Text> : null}
        <Pressable className="rounded-xl bg-primary py-3"
          onPress={() => run(() => (mode === 'in' ? signInWithEmail(email, password) : signUpWithEmail(email, password)))}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-semibold text-white">{mode === 'in' ? 'Sign in' : 'Create account'}</Text>}
        </Pressable>
        <Pressable className="rounded-xl border border-zinc-300 py-3 dark:border-zinc-700" onPress={() => run(signInWithGoogle)}>
          <Text className="text-center font-semibold text-zinc-900 dark:text-zinc-50">Continue with Google</Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')}>
          <Text className="text-center text-sm text-zinc-500">{mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app
git commit -m "feat(mobile): login screen and auth-gated routing"
```

---

## Task 13: Today screen (ported)

Behavioral reference: `frontend/src/pages/Today.jsx` (data calls: `getTodaysWorkout`, `getRoutines`, `getStreakData`, `getDailyTip`).

**Files:**
- Create: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Write `apps/mobile/app/(tabs)/index.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

export default function Today() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayData, setTodayData] = useState<any>(null);
  const [routines, setRoutines] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [tip, setTip] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [today, r, s] = await Promise.all([
        api.getTodaysWorkout().catch(() => null),
        api.getRoutines().catch(() => []),
        api.getStreakData().catch(() => null),
      ]);
      setTodayData(today); setRoutines(r as any[]); setStreak(s);
      setTip(await api.getDailyTip().then((t: any) => t.tip).catch(() => null));
    } catch { setError('Failed to load today'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <SafeAreaView className="flex-1 items-center justify-center bg-bg dark:bg-bg-dark"><ActivityIndicator /></SafeAreaView>;
  }
  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-2 bg-bg dark:bg-bg-dark">
        <Text className="text-red-500">{error}</Text>
        <Pressable onPress={load}><Text className="text-primary">Retry</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-4 pb-24 pt-4">
        <View>
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Today</Text>
          {streak?.currentStreak ? <Text className="text-sm text-zinc-500">{streak.currentStreak} day streak</Text> : null}
        </View>

        {todayData?.alreadyLoggedToday ? (
          <View className="rounded-2xl bg-surface-alt p-4 dark:bg-surface-dark">
            <Text className="font-semibold text-zinc-900 dark:text-zinc-50">Workout complete for today</Text>
            <Text className="text-sm text-zinc-500">{todayData.existingWorkout?.exercises?.length ?? 0} exercises logged</Text>
          </View>
        ) : (
          <Pressable className="rounded-xl bg-primary py-4" onPress={() => router.push('/log?start=empty')}>
            <Text className="text-center font-semibold text-white">Start workout</Text>
          </Pressable>
        )}

        <View>
          <Text className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Routines</Text>
          {routines.length === 0 ? (
            <Text className="text-sm text-zinc-500">No routines yet. Build one from the Log tab.</Text>
          ) : routines.map((r) => (
            <Pressable key={r.id} className="mb-2 flex-row items-center justify-between rounded-xl bg-surface-alt px-4 py-3 dark:bg-surface-dark"
              onPress={() => router.push(`/log?routine=${r.id}`)}>
              <Text className="font-medium text-zinc-900 dark:text-zinc-50">{r.name}</Text>
              <Text className="text-xs text-zinc-500">{r.exercises?.length ?? 0} exercises</Text>
            </Pressable>
          ))}
        </View>

        {tip ? <Text className="text-xs text-zinc-500">{tip}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
```

(The `/log` routes don't exist yet — these navigations are wired in Phase 2. They are harmless until then.)

- [ ] **Step 2: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app
git commit -m "feat(mobile): port Today screen"
```

---

## Task 14: Build the dev client and verify end-to-end on Android

**Files:** none (verification task)

- [ ] **Step 1: Build a development client for Android**

Run: `cd apps/mobile && eas build --profile development --platform android`
(Requires `eas login` first if not authenticated. Wait for the cloud build; install the resulting APK on an emulator or device.)
Expected: build succeeds; APK link produced.

- [ ] **Step 2: Start the dev server and connect**

Run: `cd apps/mobile && npx expo start --dev-client`
Open the installed dev client, load the app.
Expected: Login screen renders (auth gate redirected an unauthenticated session there).

- [ ] **Step 3: Verify email auth end-to-end**

Sign in with an existing test account.
Expected: redirect to Today; Today shows real data fetched from the live backend (routines/streak/tip as available). This confirms: Firebase auth on Hermes (the Metro fix), the DI api client attaching the ID token, and NativeWind styling all work together.

- [ ] **Step 4: Verify Google sign-in (native)**

Sign out (temporarily wire a sign-out button or use the email account), then tap "Continue with Google".
Expected: native Google account picker → returns to Today authenticated. (If `idToken` is null, confirm `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is the **Web** OAuth client ID and a SHA-1 is registered for the Android app in Firebase.)

- [ ] **Step 5: Verify web target boots**

Run: `cd apps/mobile && npx expo start --web`
Expected: Login renders in the browser; email sign-in works (Google uses popup on web).

- [ ] **Step 6: Document the result**

Note in the commit message whether all four surfaces (email/Android, Google/Android, web email, web Google) passed.

- [ ] **Step 7: Commit (slice complete)**

```bash
git add -A
git commit -m "test(mobile): verify vertical slice — auth + Today on android dev build and web"
```

---

## Self-Review Notes

- **Spec coverage:** Phases 0–1 of the spec (§11) are covered: monorepo (T1–2), shared package + DI api (T3–5, addressing the §3 boundary rule), Expo SDK 56 app + dev client (T6), NativeWind + Metro Firebase fix (T7, §8), app.config/eas/env/safe-area (T8, §8/§10), platform-split Firebase (T9, §6), auth incl. Google native shape (T10, §6), profile/theme contexts (T11), auth-gated routing + Login (T12), Today port (T13), end-to-end verification (T14). Phases 2–5 (breadth, web polish, polish, cleanup) are intentionally out of this plan and get their own plan after the slice validates patterns.
- **Deferred-by-design (not gaps):** charts (gifted-charts), FlashList, keyboard-controller, expo-image, custom markdown renderer, Sentry, EAS Update — all belong to Phases 2/4 and are listed in the spec; no Phase 0/1 task needs them.
- **Type consistency:** `createApiClient`/`createServices`/`Services` names are consistent across T4/T5/T9; `api` object methods used in T11/T13 match the methods defined in T5; `auth` import path (`../lib/auth`) consistent across T9/T10 after the Step-3 rename in T9.
```
