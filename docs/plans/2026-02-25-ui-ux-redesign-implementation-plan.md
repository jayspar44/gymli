# UI/UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Gymli to match premium native fitness apps (Strava, Garmin Connect) — new design system, intelligent AI coaching backed by real workout data, native-feeling interactions.

**Architecture:** Four-phase approach — design foundation first (colors, fonts, component kit), then backend intelligence (context builder, previous performance), then core flow redesigns (onboarding, today, workout, progress), then polish (transitions, haptics, secondary screens).

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, Framer Motion, Capacitor 8, Express 5, Firebase Firestore, Gemini 2.5 Flash

**Design Doc:** `docs/plans/2026-02-25-ui-ux-redesign-design.md`

**No test infrastructure exists.** This plan does not add tests — that's a separate initiative. Focus is on shipping the redesign.

---

## Dependency Graph

```
Phase 1: Design Foundation          Phase 2: Backend Intelligence
  Task 1 (deps + fonts)               Task 6 (previous perf endpoint)
       ↓                              Task 7 (context builder)
  Task 2 (colors + tailwind)           Task 8 (daily tip endpoint)
       ↓                              Task 9 (chat context + persona)
  Task 3 (component kit)              Task 10 (PR bug fix)
       ↓                                    ↓
  Task 4 (bottom sheet)          ────────────┘
       ↓                       ↓
  Task 5 (layout restyle)     ↓
       ↓                     ↓
       └────────┬────────────┘
                ↓
Phase 3: Core Flow Redesigns
  Task 11 (onboarding)
  Task 12 (today dashboard)
  Task 13 (workout session)
  Task 14 (progress page)
                ↓
Phase 4: Polish + Secondary
  Task 15 (log/history)
  Task 16 (chat redesign)
  Task 17 (profile/settings)
  Task 18 (login redesign)
  Task 19 (transitions + haptics)
```

Phase 1 and Phase 2 can run in parallel. Phase 3 depends on both. Phase 4 depends on Phase 3.

Within each phase, tasks are sequential unless noted otherwise.

---

## Phase 1: Design Foundation

### Task 1: Install Dependencies + Swap Fonts

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`

**Step 1: Install new dependencies**

```bash
cd frontend && npm install framer-motion vaul @capacitor/haptics
```

**Step 2: Update Google Fonts link in `index.html`**

Replace the current font link (line 11) that loads Cinzel + Outfit:

```html
<!-- OLD -->
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

<!-- NEW -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

**Step 3: Update body font in `index.css`**

```css
/* OLD */
body {
  font-family: 'Outfit', system-ui, sans-serif;
}

/* NEW */
body {
  font-family: 'Inter', system-ui, sans-serif;
}
```

**Step 4: Update Tailwind config font family**

In `tailwind.config.js`, change:

```js
// OLD
fontFamily: {
  sans: ['Outfit', 'system-ui', 'sans-serif'],
},

// NEW
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
```

**Step 5: Remove all Cinzel references from components**

Search for `Cinzel` across the codebase and remove every inline `style={{ fontFamily: "'Cinzel', serif" }}`. These appear in:
- `frontend/src/components/layout/TopBar.jsx` (app title)
- `frontend/src/pages/Login.jsx` (logo)
- `frontend/src/pages/Today.jsx` (greeting)
- `frontend/src/pages/PlanSetup.jsx` (headings)
- `frontend/src/pages/Profile.jsx` (welcome heading)
- `frontend/src/components/workout/WorkoutSummary.jsx` (completion text)
- `frontend/src/components/chat/ChatOverlay.jsx` (header)

Replace with appropriate Tailwind font weight classes (`font-bold`, `font-semibold`). Do NOT add a new display font — use the same Inter family with weight variation.

**Step 6: Commit**

```bash
git add -A && git commit -m "chore: swap fonts from Cinzel+Outfit to Inter, add framer-motion + vaul + haptics"
```

---

### Task 2: Update Color System + Tailwind Config

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`

**Step 1: Replace CSS variables in `index.css`**

Replace the entire `:root` and `.dark` blocks:

```css
:root {
  --color-primary: #d97706;
  --color-primary-dark: #b45309;
  --color-primary-light: #f59e0b;
  --color-primary-muted: rgba(217, 119, 6, 0.1);
  --color-success: #10b981;
  --color-success-muted: rgba(16, 185, 129, 0.1);
  --color-danger: #ef4444;
  --color-danger-muted: rgba(239, 68, 68, 0.1);
  --color-warning: #f59e0b;

  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-surface-alt: #f4f4f5;
  --color-text: #09090b;
  --color-text-secondary: #71717a;
  --color-border: #e4e4e7;

  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

.dark {
  --color-primary: #f59e0b;
  --color-primary-dark: #d97706;
  --color-primary-light: #fbbf24;
  --color-primary-muted: rgba(245, 158, 11, 0.1);
  --color-success: #34d399;
  --color-success-muted: rgba(52, 211, 153, 0.1);
  --color-danger: #f87171;
  --color-danger-muted: rgba(248, 113, 113, 0.1);

  --color-bg: #09090b;
  --color-surface: #18181b;
  --color-surface-alt: #27272a;
  --color-text: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-border: #3f3f46;
}
```

**Step 2: Remove old variables that no longer exist**

Delete `--color-accent` (was `#a0522d`). Search codebase for `--color-accent` references and replace with `--color-primary-dark`.

**Step 3: Update Tailwind config — replace forge scale with design tokens**

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
          muted: 'var(--color-primary-muted)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**Step 4: Update hardcoded color references across components**

Search for these patterns and update:
- `from-[#d4872a]` → `from-[var(--color-primary)]`
- `to-[#b86b1f]` → `to-[var(--color-primary-dark)]`
- `#d4872a` (anywhere hardcoded) → `var(--color-primary)`
- `#fdf8f0` (hardcoded cream) → `var(--color-bg)` or remove
- `forge-` Tailwind class references (e.g., `bg-forge-500`) → `bg-[var(--color-primary)]`
- `text-[#fdf8f0]` on buttons → `text-white`

Also update `meta theme-color` in `index.html` and in `ThemeContext.jsx` where it sets `meta[name="theme-color"]`.

**Step 5: Remove decorative elements**

Remove these from their respective files:
- **TopBar.jsx**: Delete the forge glow border (`<div className="absolute bottom-0...">` with the gradient overlay). Replace with a simple `border-b border-[var(--color-border)]` on the header element.
- **Login.jsx**: Delete `EmberParticle` component, `ForgeGlow` component, `forge-line-glow` animation, and the decorative top border. Replace with a clean solid/subtle gradient background.
- **PlanSetup.jsx**: Delete the cycling `FORGE_QUOTES` array and the quote display in the generating state. Replace with a skeleton/shimmer loading state.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: update color system to zinc/amber, remove forge decorative elements"
```

---

### Task 3: Component Kit

**Files:**
- Create: `frontend/src/components/ui/Button.jsx`
- Create: `frontend/src/components/ui/Card.jsx`
- Create: `frontend/src/components/ui/Input.jsx`
- Create: `frontend/src/components/ui/Stat.jsx`
- Create: `frontend/src/components/ui/Badge.jsx`
- Create: `frontend/src/components/ui/Skeleton.jsx`
- Create: `frontend/src/components/ui/SegmentedControl.jsx`
- Create: `frontend/src/components/ui/ProgressRing.jsx`
- Create: `frontend/src/components/ui/Chip.jsx`

Build each component using CSS variables. No hardcoded colors. Every component should accept `className` for overrides via `cn()` utility.

**Step 1: Button component**

```jsx
// frontend/src/components/ui/Button.jsx
import { cn } from '../../utils/cn';

const variants = {
  primary: 'bg-[var(--color-primary)] text-white font-semibold active:opacity-90',
  secondary: 'border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  ghost: 'text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary-muted)]',
  destructive: 'bg-[var(--color-danger)] text-white font-semibold active:opacity-90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
```

**Step 2: Card component**

```jsx
// frontend/src/components/ui/Card.jsx
import { cn } from '../../utils/cn';

export default function Card({ children, className, padding = 'md', interactive = false, ...props }) {
  const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-5', none: '' };
  return (
    <div
      className={cn(
        'rounded-2xl bg-[var(--color-surface)]',
        'border border-[var(--color-border)] dark:border-transparent',
        paddings[padding],
        interactive && 'active:scale-[0.99] transition-transform cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('pb-3 mb-3 border-b border-[var(--color-border)]', className)}>
      {children}
    </div>
  );
}
```

**Step 3: Input component**

```jsx
// frontend/src/components/ui/Input.jsx
import { cn } from '../../utils/cn';
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, suffix, className, type = 'text', ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]',
            'text-[var(--color-text)] placeholder-[var(--color-text-secondary)]',
            'outline-none focus:border-[var(--color-primary)] transition-colors',
            'px-3 py-2.5 text-sm',
            Icon && 'pl-10',
            suffix && 'pr-12',
            error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
});

export default Input;
```

**Step 4: Stat component**

```jsx
// frontend/src/components/ui/Stat.jsx
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendIcons = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendColors = {
  up: 'text-[var(--color-success)]',
  down: 'text-[var(--color-danger)]',
  flat: 'text-[var(--color-text-secondary)]',
};

export default function Stat({ value, label, trend, icon: Icon, className }) {
  const TrendIcon = trend ? trendIcons[trend] : null;
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[var(--color-primary)]" />}
        <span className="text-2xl font-bold text-[var(--color-text)] tabular-nums">{value}</span>
        {TrendIcon && <TrendIcon className={cn('w-4 h-4', trendColors[trend])} />}
      </div>
      <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">{label}</span>
    </div>
  );
}
```

**Step 5: Badge component**

```jsx
// frontend/src/components/ui/Badge.jsx
import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]',
  success: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-danger-muted)] text-[var(--color-danger)]',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
```

**Step 6: Skeleton component**

```jsx
// frontend/src/components/ui/Skeleton.jsx
import { cn } from '../../utils/cn';

export default function Skeleton({ className, variant = 'text' }) {
  const base = 'animate-pulse rounded-lg bg-[var(--color-surface-alt)]';
  const variants = {
    text: 'h-4 w-full',
    heading: 'h-6 w-3/4',
    circle: 'rounded-full w-10 h-10',
    card: 'h-32 w-full rounded-2xl',
    chart: 'h-48 w-full rounded-2xl',
  };
  return <div className={cn(base, variants[variant], className)} />;
}
```

**Step 7: SegmentedControl component**

```jsx
// frontend/src/components/ui/SegmentedControl.jsx
import { cn } from '../../utils/cn';

export default function SegmentedControl({ options, value, onChange, className }) {
  return (
    <div className={cn(
      'inline-flex p-1 rounded-xl bg-[var(--color-surface-alt)]',
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all',
            value === option.value
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 8: ProgressRing component**

```jsx
// frontend/src/components/ui/ProgressRing.jsx
import { cn } from '../../utils/cn';

export default function ProgressRing({ value, max, size = 64, strokeWidth = 4, color, children, className }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);
  const strokeColor = color || 'var(--color-primary)';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--color-surface-alt)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
```

**Step 9: Chip component**

```jsx
// frontend/src/components/ui/Chip.jsx
import { cn } from '../../utils/cn';

export default function Chip({ children, selected, icon: Icon, onPress, className }) {
  return (
    <button
      onClick={onPress}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
        selected
          ? 'bg-[var(--color-primary)] text-white font-medium'
          : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
        className
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
```

**Step 10: Commit**

```bash
git add frontend/src/components/ui/ && git commit -m "feat: add component kit — Button, Card, Input, Stat, Badge, Skeleton, SegmentedControl, ProgressRing, Chip"
```

---

### Task 4: BottomSheet Component

**Files:**
- Create: `frontend/src/components/ui/BottomSheet.jsx`

**Step 1: Build BottomSheet using vaul**

```jsx
// frontend/src/components/ui/BottomSheet.jsx
import { Drawer } from 'vaul';
import { cn } from '../../utils/cn';

export default function BottomSheet({ open, onClose, children, className }) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-[var(--color-surface)]',
            'max-h-[85vh]',
            className
          )}
          style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 1rem)' }}
        >
          <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-[var(--color-border)]" />
          <div className="flex-1 overflow-y-auto px-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

**Step 2: Verify it renders correctly**

```bash
cd frontend && npm run dev
```

Open browser, import and render a test BottomSheet on any page to verify styling and drag-to-dismiss work.

**Step 3: Commit**

```bash
git add frontend/src/components/ui/BottomSheet.jsx && git commit -m "feat: add BottomSheet component using vaul"
```

---

### Task 5: Layout Restyle (TopBar + BottomNav)

**Files:**
- Modify: `frontend/src/components/layout/TopBar.jsx`
- Modify: `frontend/src/components/layout/BottomNav.jsx`
- Modify: `frontend/src/components/layout/MobileContainer.jsx`

**Step 1: Restyle TopBar**

Replace the entire TopBar component. Key changes:
- Remove Cinzel font, forge glow border
- App name: "Gymli" in Inter bold (or hide it and use space for page title)
- Clean bottom border: simple `border-b border-[var(--color-border)]`
- Keep avatar button with same sizing

```jsx
// frontend/src/components/layout/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProfileMenu from './ProfileMenu';

export default function TopBar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [menuOpen]);

  const initial = user?.displayName?.[0] || user?.email?.[0] || '?';

  return (
    <header className="relative z-30 flex items-center justify-between h-14 px-4 flex-shrink-0 border-b border-[var(--color-border)]">
      <span className="text-lg font-bold text-[var(--color-text)] tracking-tight">Gymli</span>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary)] text-white text-sm font-semibold">
              {initial.toUpperCase()}
            </div>
          )}
        </button>
        {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      </div>
    </header>
  );
}
```

**Step 2: Restyle BottomNav — add animated indicator**

Replace `BottomNav.jsx`. Key changes:
- Use Framer Motion `layoutId` for a sliding active indicator
- Remove the glow shadow on the active bar
- Clean styling

```jsx
// frontend/src/components/layout/BottomNav.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/log', icon: Dumbbell, label: 'Log' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
];

export default function BottomNav() {
  const location = useLocation();
  const activeTab = tabs.find(t => t.to === '/' ? location.pathname === '/' : location.pathname.startsWith(t.to))?.to;

  return (
    <nav className="relative z-30 flex-shrink-0 border-t border-[var(--color-border)]" style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex items-center justify-around h-16 bg-[var(--color-surface)]">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = to === activeTab;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="relative flex flex-col items-center justify-center gap-1 w-full h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-[var(--color-primary)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className={`text-[11px] transition-colors ${isActive ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 3: Update MobileContainer — remove safe-area bottom padding**

The bottom padding is already handled by `BottomNav` and individual overlays. Remove the duplicate `paddingBottom` from MobileContainer to avoid double-padding:

```jsx
// Keep paddingTop, paddingLeft, paddingRight
// Remove paddingBottom from MobileContainer — BottomNav handles it
style={{
  paddingTop: 'var(--safe-area-top)',
  paddingLeft: 'var(--safe-area-left)',
  paddingRight: 'var(--safe-area-right)',
}}
```

**Step 4: Update ProfileMenu styling**

In `ProfileMenu.jsx`, remove any forge-themed elements (Cinzel font, forge colors). Ensure it uses the new color variables. Style as a clean dropdown with `rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg`.

**Step 5: Verify layout looks correct**

```bash
cd frontend && npm run dev
```

Check all three tabs render with the sliding indicator. Verify TopBar, BottomNav, and ProfileMenu in both light and dark mode.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: restyle layout — clean TopBar, animated BottomNav indicator, updated ProfileMenu"
```

---

## Phase 2: Backend Intelligence

### Task 6: Previous Performance Endpoint

**Files:**
- Create: `backend/src/services/performance-service.js`
- Modify: `backend/src/controllers/workout-controller.js`
- Modify: `backend/src/routes/api.js`

**Step 1: Create performance service**

```js
// backend/src/services/performance-service.js
import { db } from './firebase-service.js';

/**
 * Get the most recent logged data for a set of exercises.
 * Returns a map: { exerciseId: { date, sets: [{weight, reps}], bestWeight, notes } }
 */
export async function getPreviousPerformance(uid, exerciseIds) {
  if (!exerciseIds?.length) return {};

  // Fetch last 20 workouts — should cover all exercises in a plan cycle
  const snap = await db
    .collection('users').doc(uid)
    .collection('workouts')
    .orderBy('date', 'desc')
    .limit(20)
    .get();

  const result = {};
  const found = new Set();

  for (const doc of snap.docs) {
    const workout = doc.data();
    if (!workout.exercises) continue;

    for (const ex of workout.exercises) {
      if (exerciseIds.includes(ex.exerciseId) && !found.has(ex.exerciseId)) {
        result[ex.exerciseId] = {
          date: workout.date,
          sets: (ex.sets || [])
            .filter(s => s.completed)
            .map(s => ({ weight: s.weight, reps: s.reps })),
          bestWeight: ex.bestWeight || 0,
          notes: ex.notes || null,
        };
        found.add(ex.exerciseId);
      }
    }

    // Early exit if we found all requested exercises
    if (found.size === exerciseIds.length) break;
  }

  return result;
}
```

**Step 2: Add controller method**

In `workout-controller.js`, add:

```js
import { getPreviousPerformance } from '../services/performance-service.js';

export async function fetchPreviousPerformance(req, res, next) {
  try {
    const { exerciseIds } = req.body;
    if (!exerciseIds?.length) return res.json({});
    const result = await getPreviousPerformance(req.user.uid, exerciseIds);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
```

**Step 3: Add route**

In `api.js`, add after the workouts group:

```js
router.post('/workouts/previous', workoutController.fetchPreviousPerformance);
```

**Step 4: Add frontend API function**

In `frontend/src/api/services.js`, add:

```js
export const getPreviousPerformance = (exerciseIds) =>
  api.post('/workouts/previous', { exerciseIds }).then(r => r.data);
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add previous performance endpoint for workout session pre-fill"
```

---

### Task 7: Coaching Context Builder

**Files:**
- Create: `backend/src/services/coaching-context-service.js`

**Step 1: Build the context assembler**

```js
// backend/src/services/coaching-context-service.js
import { db } from './firebase-service.js';
import { getProfile } from './user-service.js';
import { getActivePlan } from './plan-service.js';

/**
 * Build a structured coaching context for AI calls.
 * Assembled once per chat session, cached by caller.
 */
export async function buildCoachingContext(uid) {
  const [profile, plan, workoutsSnap] = await Promise.all([
    getProfile(uid),
    getActivePlan(uid),
    db.collection('users').doc(uid).collection('workouts')
      .orderBy('date', 'desc').limit(15).get(),
  ]);

  const recentWorkouts = workoutsSnap.docs.map(d => {
    const w = d.data();
    return {
      date: w.date,
      exercises: (w.exercises || []).map(e => ({
        name: e.name,
        sets: (e.sets || []).filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps })),
        bestWeight: e.bestWeight || 0,
      })),
      totalVolume: w.totalVolume || 0,
      duration: w.duration || null,
    };
  });

  // Compute per-exercise trends from recent workouts
  const exerciseTrends = computeTrends(recentWorkouts);

  // Recent PRs (from workout docs in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const recentPRs = [];
  for (const w of recentWorkouts) {
    if (w.date < thirtyDaysStr) break;
    // PRs are stored on the workout doc — but we need to check the raw data
    const raw = workoutsSnap.docs.find(d => d.data().date === w.date)?.data();
    if (raw?.prs?.length) {
      for (const pr of raw.prs) {
        recentPRs.push({ name: pr.name, weight: pr.weight, date: w.date });
      }
    }
  }

  // Adherence: workouts in last 4 weeks vs planned
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const fourWeeksStr = fourWeeksAgo.toISOString().slice(0, 10);
  const recentCount = recentWorkouts.filter(w => w.date >= fourWeeksStr).length;
  const plannedPerWeek = plan?.daysPerWeek || 0;
  const completionRate = plannedPerWeek > 0
    ? Math.round((recentCount / (plannedPerWeek * 4)) * 100)
    : null;

  return {
    profile: {
      name: profile?.displayName || 'there',
      experience: profile?.experienceLevel || 'beginner',
      goals: profile?.goals || '',
      units: profile?.units || 'lbs',
      bodyweight: profile?.bodyweight || null,
    },
    plan: plan ? {
      name: plan.templateName || plan.name || 'Custom',
      daysPerWeek: plan.daysPerWeek,
      schedule: plan.weeklySchedule || null,
      exercises: (plan.days || []).flatMap(d =>
        (d.exercises || []).map(e => e.name || e.exerciseId)
      ),
    } : null,
    recentWorkouts: recentWorkouts.slice(0, 10),
    exerciseTrends,
    adherence: {
      completionRate,
      currentStreak: profile?.streak || 0,
      totalWorkouts: profile?.totalWorkouts || 0,
    },
    recentPRs,
  };
}

function computeTrends(workouts) {
  // Group exercises across workouts, compare last 2 weeks vs prior 2 weeks
  const exerciseMap = {};

  for (const w of workouts) {
    for (const e of w.exercises) {
      if (!exerciseMap[e.name]) exerciseMap[e.name] = [];
      exerciseMap[e.name].push({ date: w.date, bestWeight: e.bestWeight });
    }
  }

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksStr = twoWeeksAgo.toISOString().slice(0, 10);

  return Object.entries(exerciseMap).map(([name, entries]) => {
    const recent = entries.filter(e => e.date >= twoWeeksStr);
    const older = entries.filter(e => e.date < twoWeeksStr);

    const recentBest = Math.max(0, ...recent.map(e => e.bestWeight));
    const olderBest = Math.max(0, ...older.map(e => e.bestWeight));

    let trend = 'flat';
    if (recentBest > olderBest) trend = 'improving';
    else if (recentBest < olderBest) trend = 'declining';
    else if (recent.length >= 3 && older.length >= 1) trend = 'stalled';

    return {
      name,
      trend,
      currentBest: recentBest,
      previousBest: olderBest,
      sessionsTracked: entries.length,
    };
  });
}

/**
 * Format coaching context as a text block for Gemini system prompt injection.
 */
export function formatContextForAI(ctx) {
  const lines = [];

  lines.push(`User: ${ctx.profile.name} (${ctx.profile.experience})`);
  if (ctx.profile.goals) lines.push(`Goals: ${ctx.profile.goals}`);
  if (ctx.profile.bodyweight) lines.push(`Bodyweight: ${ctx.profile.bodyweight} ${ctx.profile.units}`);

  if (ctx.plan) {
    lines.push(`\nPlan: ${ctx.plan.name} (${ctx.plan.daysPerWeek} days/week)`);
  }

  if (ctx.adherence.completionRate !== null) {
    lines.push(`Adherence: ${ctx.adherence.completionRate}% (last 4 weeks)`);
  }
  lines.push(`Streak: ${ctx.adherence.currentStreak} days | Total workouts: ${ctx.adherence.totalWorkouts}`);

  if (ctx.recentWorkouts.length) {
    lines.push('\nRecent workouts:');
    for (const w of ctx.recentWorkouts.slice(0, 8)) {
      const exercises = w.exercises.map(e => {
        const setsStr = e.sets.map(s => `${s.weight}×${s.reps}`).join(', ');
        return `${e.name} [${setsStr}]`;
      }).join('; ');
      lines.push(`  ${w.date}: ${exercises} (vol: ${w.totalVolume})`);
    }
  }

  if (ctx.exerciseTrends.length) {
    lines.push('\nExercise trends:');
    for (const t of ctx.exerciseTrends) {
      lines.push(`  ${t.name}: ${t.trend} (current best: ${t.currentBest}, previous: ${t.previousBest})`);
    }
  }

  if (ctx.recentPRs.length) {
    lines.push('\nRecent PRs:');
    for (const pr of ctx.recentPRs) {
      lines.push(`  ${pr.name}: ${pr.weight} (${pr.date})`);
    }
  }

  return lines.join('\n');
}
```

**Step 2: Commit**

```bash
git add backend/src/services/coaching-context-service.js && git commit -m "feat: add coaching context builder — assembles full workout history for AI"
```

---

### Task 8: Daily Tip Endpoint

**Files:**
- Create: `backend/src/services/tip-service.js`
- Create: `backend/src/controllers/coaching-controller.js`
- Modify: `backend/src/routes/api.js`

**Step 1: Create tip service**

```js
// backend/src/services/tip-service.js
import { buildCoachingContext } from './coaching-context-service.js';

// Simple in-memory cache: { uid: { date, tip } }
const tipCache = new Map();

export async function getDailyTip(uid) {
  const today = new Date().toISOString().slice(0, 10);
  const cached = tipCache.get(uid);
  if (cached?.date === today) return cached.tip;

  const ctx = await buildCoachingContext(uid);
  const tip = generateTip(ctx, today);

  tipCache.set(uid, { date: today, tip });
  return tip;
}

function generateTip(ctx, today) {
  // Priority 1: PR in last workout
  if (ctx.recentPRs.length) {
    const latest = ctx.recentPRs[0];
    const daysAgo = daysBetween(latest.date, today);
    if (daysAgo <= 2) {
      return `New ${latest.name} PR: ${latest.weight} ${ctx.profile.units}. Keep pushing.`;
    }
  }

  // Priority 2: Stalled exercise
  const stalled = ctx.exerciseTrends.find(t => t.trend === 'stalled' && t.sessionsTracked >= 4);
  if (stalled) {
    return `${stalled.name} has plateaued at ${stalled.currentBest} ${ctx.profile.units}. Consider a deload or variation swap.`;
  }

  // Priority 3: Low adherence this week (check if it's Thu+ and behind)
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek >= 4 && ctx.adherence.completionRate !== null && ctx.adherence.completionRate < 50) {
    return "Lighter week — that's fine. Consistency over time matters more than any single week.";
  }

  // Priority 4: Streak milestones
  const milestones = [90, 60, 30, 14, 7];
  const streak = ctx.adherence.currentStreak;
  for (const m of milestones) {
    if (streak === m) {
      return `${m} days consistent. That's discipline paying off.`;
    }
  }

  // Priority 5: Volume trending up
  if (ctx.recentWorkouts.length >= 2) {
    const recentVol = ctx.recentWorkouts.slice(0, 3).reduce((s, w) => s + w.totalVolume, 0);
    const olderVol = ctx.recentWorkouts.slice(3, 6).reduce((s, w) => s + w.totalVolume, 0);
    if (olderVol > 0 && recentVol > olderVol * 1.05) {
      const pct = Math.round(((recentVol - olderVol) / olderVol) * 100);
      return `Training volume up ${pct}% recently. Strong trend.`;
    }
  }

  // Priority 6: Returning after gap
  if (ctx.recentWorkouts.length && daysBetween(ctx.recentWorkouts[0].date, today) >= 3) {
    return "Welcome back. Ease into it today.";
  }

  // No tip
  return null;
}

function daysBetween(dateStr, todayStr) {
  const d1 = new Date(dateStr);
  const d2 = new Date(todayStr);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
```

**Step 2: Create coaching controller**

```js
// backend/src/controllers/coaching-controller.js
import { getDailyTip } from '../services/tip-service.js';

export async function fetchDailyTip(req, res, next) {
  try {
    const tip = await getDailyTip(req.user.uid);
    res.json({ tip });
  } catch (err) {
    next(err);
  }
}
```

**Step 3: Add route**

In `api.js`:

```js
import { fetchDailyTip } from '../controllers/coaching-controller.js';

router.get('/coaching/tip', fetchDailyTip);
```

**Step 4: Add frontend API function**

In `frontend/src/api/services.js`:

```js
export const getDailyTip = () => api.get('/coaching/tip').then(r => r.data);
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add daily coaching tip endpoint — deterministic, data-driven, cached per day"
```

---

### Task 9: Update Chat to Use Coaching Context + Update AI Persona

**Files:**
- Modify: `backend/src/services/ai-service.js`
- Modify: `backend/src/services/chat-service.js`

**Step 1: Replace GYMLI_SYSTEM_PROMPT in `ai-service.js`**

Replace the dwarf warrior persona with a direct coaching persona:

```js
export const GYMLI_SYSTEM_PROMPT = `You are Gymli, an AI strength training coach built into the Gymli workout app. You are knowledgeable, direct, and encouraging — like a smart training partner.

Guidelines:
- Be concise. 2-4 sentences max unless the user asks for detail.
- Reference the user's actual data when available (weights, trends, PRs, volume).
- Give specific, actionable advice. "Try 82.5kg next session" is better than "keep pushing."
- If you don't have enough data to answer, say so honestly.
- No roleplay, no character voice. Just be a helpful coach.
- Use the user's preferred units (provided in context).`;
```

**Step 2: Update `chat` function to accept full coaching context**

In `ai-service.js`, modify the `chat` function to include coaching context in the system prompt:

```js
export async function chat(messages, context, coachingContext) {
  const ai = getAI();
  if (!ai) return "I'm currently unavailable. Please try again later.";

  let systemPrompt = GYMLI_SYSTEM_PROMPT;
  if (coachingContext) {
    systemPrompt += '\n\n--- USER DATA ---\n' + coachingContext;
  }
  if (context?.screen) {
    systemPrompt += `\n\nThe user is currently on the "${context.screen}" screen of the app.`;
  }

  // ... rest of function unchanged
}
```

**Step 3: Update chat service to build and pass coaching context**

In `chat-service.js`, modify `sendMessage`:

```js
import { buildCoachingContext, formatContextForAI } from './coaching-context-service.js';

// Cache per uid, expires after 10 minutes
const contextCache = new Map();

export async function sendMessage(uid, message, screenContext) {
  // Build or retrieve cached coaching context
  let coachingCtx = contextCache.get(uid);
  const now = Date.now();
  if (!coachingCtx || now - coachingCtx.timestamp > 10 * 60 * 1000) {
    const ctx = await buildCoachingContext(uid);
    const formatted = formatContextForAI(ctx);
    coachingCtx = { text: formatted, timestamp: now };
    contextCache.set(uid, coachingCtx);
  }

  // ... existing history loading code ...

  const response = await aiChat(chatMessages, { screen: screenContext }, coachingCtx.text);

  // ... existing persist code ...
}
```

**Step 4: Update workout summary prompt**

In `ai-service.js` `generateWorkoutSummary`, update the system prompt to use the new persona (not dwarf). The function already receives workout data, so no structural changes needed — just tone.

**Step 5: Update insights prompt**

In `ai-service.js` `generateInsights`, same treatment — use new persona tone.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: update AI persona to direct coach, inject full workout context into chat"
```

---

### Task 10: Fix PR Detection Bug

**Files:**
- Modify: `backend/src/services/workout-service.js`

**Step 1: Fix the Firestore query in `logWorkout`**

The current code uses `where('exercises', '!=', null)` which doesn't work correctly for array fields. Replace the PR detection section (approximately lines 39-66) with:

```js
// PR detection — fetch recent workouts and check in code
const historySnap = await workoutsRef
  .orderBy('date', 'desc')
  .limit(50)
  .get();

const prs = [];
for (const exercise of exercises) {
  let historicalBest = 0;

  for (const doc of historySnap.docs) {
    const w = doc.data();
    if (!w.exercises) continue;
    const match = w.exercises.find(e => e.exerciseId === exercise.exerciseId);
    if (match && match.bestWeight > historicalBest) {
      historicalBest = match.bestWeight;
    }
  }

  if (exercise.bestWeight > historicalBest && historicalBest > 0) {
    prs.push({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      weight: exercise.bestWeight,
      previousBest: historicalBest,
    });
  }
}
```

This removes the problematic compound query and does the filtering in JavaScript, which is more reliable and doesn't require a Firestore composite index.

**Step 2: Commit**

```bash
git add backend/src/services/workout-service.js && git commit -m "fix: PR detection — replace broken Firestore array query with in-memory filtering"
```

---

## Phase 3: Core Flow Redesigns

### Task 11: Onboarding Flow

**Files:**
- Create: `frontend/src/pages/Onboarding.jsx`
- Modify: `frontend/src/App.jsx` (add route)
- Modify: `frontend/src/components/ProtectedRoute.jsx` (redirect to onboarding instead of profile)
- Modify: `frontend/src/api/services.js` (if needed)

**Step 1: Create Onboarding page with 4-step progressive flow**

Build `Onboarding.jsx` as a multi-step form with:
- Step indicator (4 dots at top)
- Animated step transitions using Framer Motion `AnimatePresence`
- State machine: `step = 1 | 2 | 3 | 4`

Step 1 (Welcome): Name input + "Continue" button
Step 2 (Goals): Goals textarea + optional chip presets (Strength, Muscle, General Fitness, Weight Loss) that pre-fill the textarea
Step 3 (Starting Point): Experience level as 3 large tappable cards (Beginner/Intermediate/Advanced with short descriptions), optional bodyweight input + units toggle
Step 4 (Schedule + Plan): 7-day toggle grid. Below: for beginners, show auto-recommended template with explanation. For intermediate/advanced, show template cards with recommendation badge. "Generate Plan" button.

On submit: `POST /user/profile` with `onboardingComplete: true`, then `POST /plans/generate` with selected template, then navigate to `/`.

Use the new component kit: `Button`, `Card`, `Input`, `Chip` throughout.

**Step 2: Update routing**

In `App.jsx`, add `/onboarding` route. Update `OnboardingGate` to redirect to `/onboarding` instead of `/profile`.

```jsx
<Route path="onboarding" element={<Onboarding />} />
```

**Step 3: Update OnboardingGate redirect**

```jsx
function OnboardingGate({ children }) {
  const { needsOnboarding, loading } = useUserProfile();
  if (loading) return null;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return children;
}
```

**Step 4: Replace forge-themed loading in PlanSetup**

Update `PlanSetup.jsx` generating state: remove `FORGE_QUOTES` cycling, replace with skeleton loading + simple "Generating your plan..." text and a spinner.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: progressive 4-step onboarding flow replacing single-page profile setup"
```

---

### Task 12: Today Dashboard Redesign

**Files:**
- Rewrite: `frontend/src/pages/Today.jsx`
- Modify: `frontend/src/api/services.js` (add daily tip call)

**Step 1: Rewrite Today.jsx**

Structure the page top-to-bottom:

1. **Greeting + subtitle**: "Good morning, Jay" (derive time-of-day greeting) + contextual subtitle from workout data
2. **Stat strip**: Horizontal row of `Stat` components — streak (with flame icon), total workouts
3. **Today's workout card** (or rest day / completed variant):
   - Card header: day name + focus
   - Exercise list: each row shows name, target sets×reps, and **last session's weight** (from `getPreviousPerformance` or from data included in today endpoint response)
   - Start Workout button (`Button` component, primary, full-width)
   - If completed: green success state with summary stats
   - If rest day: "Rest Day" message + next workout day preview
4. **Week strip**: 7-day horizontal display showing which days have workouts, which are rest, which are done. Tappable days open a `BottomSheet` with that day's exercise preview.
5. **AI tip**: one-line tip from `/api/coaching/tip`, dismissible. Only shown if tip is not null.

**Step 2: Fetch previous performance data**

When loading today's workout, also call `getPreviousPerformance` with the exercise IDs from today's plan. Display last weight next to each exercise.

**Step 3: Fetch daily tip**

Call `getDailyTip()` on mount. Show as a subtle card below the week strip if non-null.

**Step 4: Add time-of-day greeting helper**

```js
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
```

**Step 5: Remove forge-themed greetings**

Delete the `GREETINGS` array with "The anvil awaits, warrior!" etc.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: redesign Today dashboard — greeting, stat strip, last weights, week strip, daily tip"
```

---

### Task 13: Workout Session Redesign

**Files:**
- Rewrite: `frontend/src/components/workout/WorkoutSession.jsx`
- Modify: `frontend/src/components/workout/ExerciseCard.jsx`
- Modify: `frontend/src/components/workout/SetRow.jsx`
- Modify: `frontend/src/components/workout/RestTimer.jsx`
- Modify: `frontend/src/components/workout/WorkoutSummary.jsx`

This is the most complex task. Key changes:

**Step 1: Load previous performance on session start**

When `WorkoutSession` mounts, call `getPreviousPerformance` with all exercise IDs for the current day. Store in state as `previousData`.

**Step 2: Pre-fill weights from previous session**

In the exercise initialization, when creating the `sets` array, pre-fill the `weight` field from `previousData[exerciseId].sets[i].weight` (matching by set index). Leave `reps` empty for the user to fill.

**Step 3: Show "Last session" summary on ExerciseCard**

Above the set table in `ExerciseCard`, add:
```
Last: 80kg × 8, 8, 7, 6
```
Format from `previousData[exerciseId].sets` — show weight once (if consistent) and list reps.

**Step 4: Add exercise nav pill strip**

Replace the small dot navigation with a horizontally scrollable strip of exercise name pills (abbreviated if needed). Active pill has primary background. Use `overflow-x-auto` with `scrollbar-hide`.

```jsx
<div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
  {exercises.map((ex, i) => (
    <button
      key={i}
      onClick={() => setCurrentIndex(i)}
      className={cn(
        'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
        i === currentIndex
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
      )}
    >
      {ex.name.split(' ').slice(0, 2).join(' ')}
    </button>
  ))}
</div>
```

**Step 5: Add per-exercise notes**

Add a collapsible "Add note" section at the bottom of each `ExerciseCard`. Store in exercise state as `notes`. Persist to workout doc on finish.

**Step 6: Redesign rest timer**

Update `RestTimer.jsx`:
- Appears as a compact bar at bottom of screen (not full-width banner)
- Shows countdown number + thin progress bar
- Tap to expand: shows ±15s adjust buttons
- Auto-hides when timer reaches 0
- Does NOT trigger if two sets completed within 5 seconds of each other

**Step 7: Add finish confirmation**

Replace direct "Finish" action with a `BottomSheet`:
- "End workout?"
- "X of Y exercises completed"
- Cancel / End Workout buttons

**Step 8: Restyle WorkoutSummary**

Update `WorkoutSummary.jsx`:
- Use `Stat` components for Duration / Volume / Sets grid
- Use `Badge` component with `success` variant for PRs
- AI summary in clean body text (not italic, no "— Gymli" signature)
- Remove Cinzel font, Trophy gradient box

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: redesign workout session — previous weights, pre-fill, nav pills, rest timer, notes, confirmation"
```

---

### Task 14: Progress Page Redesign

**Files:**
- Rewrite: `frontend/src/pages/Progress.jsx`
- Modify: `frontend/src/components/progress/ExerciseChart.jsx`
- Modify: `frontend/src/components/progress/VolumeChart.jsx`
- Modify: `frontend/src/components/progress/StreakCalendar.jsx`
- Modify: `frontend/src/components/progress/GymliInsights.jsx`
- Create: `frontend/src/components/progress/PRBoard.jsx`

**Step 1: Add tabbed layout with SegmentedControl**

Replace the single stacked layout with 3 tabs: Overview | Strength | Volume.

```jsx
const [tab, setTab] = useState('overview');

<SegmentedControl
  options={[
    { value: 'overview', label: 'Overview' },
    { value: 'strength', label: 'Strength' },
    { value: 'volume', label: 'Volume' },
  ]}
  value={tab}
  onChange={setTab}
/>
```

**Step 2: Overview tab**

- `StreakCalendar` (restyle with new colors)
- This week summary: use `Stat` components in a 3-column grid (Workouts, Volume, vs Last Week %)
- `GymliInsights` (restyle — remove Gymli avatar, use clean card with lightbulb icon)

**Step 3: Strength tab — create PRBoard component**

```jsx
// frontend/src/components/progress/PRBoard.jsx
// Fetch logged exercises from /api/stats/exercises
// For each, show: exercise name | current best weight | date | trend arrow
// Tap an exercise -> sets ExerciseChart's selected exercise
// Use Card, Badge, Stat components
```

Show `ExerciseChart` above the PR list. Add period selector using `SegmentedControl`: 1M | 3M | 6M | All.

**Step 4: Restyle ExerciseChart**

Update Recharts config for the line chart:
- Add gradient fill area under the line (`<defs><linearGradient>` from primary color at 30% opacity to transparent)
- Minimal grid lines (horizontal only, `stroke: var(--color-border)`, `strokeDasharray: 3 3`)
- Axis tick text in `var(--color-text-secondary)`, `fontSize: 11`
- Custom tooltip styled with the app's design tokens
- Rounded line (`type="monotone"`)
- Use `<Area>` instead of `<Line>` for the gradient fill effect

**Step 5: Restyle VolumeChart**

Similar treatment:
- Rounded bar corners (`radius={[4, 4, 0, 0]}`)
- Gradient fill on bars (primary color)
- Period selector
- Clean axis styling

**Step 6: Restyle StreakCalendar**

- Update heatmap colors: empty = `var(--color-surface-alt)`, light = primary at 20%, medium = primary at 50%, dark = primary at 100%
- Use new color variables throughout

**Step 7: Restyle GymliInsights**

- Remove the "G" avatar icon
- Use a clean card with a lightbulb or sparkle icon
- Remove themed language
- Clean refresh button

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: redesign Progress page — tabbed layout, PR board, gradient charts, clean insights"
```

---

## Phase 4: Polish + Secondary Screens

### Task 15: Log/History Redesign

**Files:**
- Modify: `frontend/src/pages/Log.jsx`
- Modify: `frontend/src/components/log/WorkoutHistoryItem.jsx`
- Modify: `frontend/src/components/log/WorkoutHistoryList.jsx`
- Modify: `frontend/src/components/log/ManualLogForm.jsx`
- Modify: `frontend/src/components/log/ExercisePicker.jsx`

**Step 1: Restyle WorkoutHistoryItem**

Each card shows: date (formatted), workout name/day focus, exercise count, total volume, duration, and PR `Badge` if any PRs in that session.

**Step 2: Add inline expand for workout detail**

Instead of tapping to a new overlay, tap a workout card → `AnimatePresence` expand to show exercise/set detail inline. Or use `BottomSheet` for detail view.

**Step 3: Update ExercisePicker to use BottomSheet**

Replace the full-screen overlay with a `BottomSheet` at 90% snap point. Update the category filter pills to use `Chip` components.

**Step 4: Update ManualLogForm**

Restyle with new component kit. Use `Input`, `Button`, `Card` components throughout.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: redesign Log page — restyled cards, inline expand, BottomSheet exercise picker"
```

---

### Task 16: Chat Redesign

**Files:**
- Modify: `frontend/src/components/chat/ChatOverlay.jsx`
- Modify: `frontend/src/components/chat/ChatMessage.jsx`
- Modify: `frontend/src/components/chat/ChatInput.jsx`
- Modify: `frontend/src/components/chat/ChatFAB.jsx`

**Step 1: Update ChatOverlay header**

- Remove Cinzel font
- Remove "G" amber avatar
- Header: "Coach" in bold sans-serif + close button
- Remove themed empty state text, replace with clean "Ask about your training, progress, or plan."

**Step 2: Update quick prompts**

Make quick prompts contextual. If user has workout data, show: "How's my bench progressing?", "What should I focus on?", "Review my last workout". If no data: "Help me get started", "What program should I follow?".

**Step 3: Update ChatMessage**

- User messages: keep primary bg + white text, right-aligned
- AI messages: keep surface-alt bg, left-aligned
- Remove the "G" avatar from AI messages
- Remove themed error messages ("The forge fires flicker...")
- Keep markdown rendering

**Step 4: Restyle ChatFAB**

Update to use new primary color variable. Keep positioning and sizing.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: redesign Chat — clean header, contextual prompts, updated message styling"
```

---

### Task 17: Profile / Settings Redesign

**Files:**
- Rewrite: `frontend/src/pages/Profile.jsx`

**Step 1: Redesign as settings-style grouped sections**

Replace the single form with grouped sections (like iOS Settings):

```
Section: Personal
  - Display Name (Input)
  - Bodyweight (Input with unit suffix)
  - Units (SegmentedControl: lbs | kg)

Section: Training
  - Experience Level (SegmentedControl: Beginner | Intermediate | Advanced)
  - Goals (textarea)
  - Training Days (7-day toggle grid)

Section: Preferences
  - Theme (SegmentedControl: Light | Dark | System)
  - Rest Timer Default (SegmentedControl: 60s | 90s | 120s | 180s)

Section: Account
  - Sign Out (Button, destructive variant)
```

**Step 2: Auto-save on change**

Instead of a "Save" button, auto-save with a debounce (500ms). Show subtle "Saved" toast or inline confirmation.

**Step 3: Remove onboarding-specific code from Profile**

The onboarding flow is now separate (`Onboarding.jsx`). Remove the `needsOnboarding` conditional rendering and forge-themed welcome header from Profile.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: redesign Profile as settings page — grouped sections, auto-save, clean styling"
```

---

### Task 18: Login Redesign

**Files:**
- Rewrite: `frontend/src/pages/Login.jsx`

**Step 1: Remove all decorative elements**

Delete: `EmberParticle`, `ForgeGlow`, `forge-pulse` animation, `forge-line-glow` animation, ember particles, staged fade-in delays.

**Step 2: Clean login design**

- Solid `var(--color-bg)` background
- "Gymli" wordmark centered, large, bold Inter
- Subtle tagline: "Your training, simplified." in text-secondary
- Google sign-in button: white/surface card style with Google icon
- Email sign-in button: secondary variant
- Email form: clean inputs using `Input` component, `Button` for submit
- Simple fade-in on mount (single `motion.div` with `opacity` + `y` animation)

**Step 3: Clean up animations in index.css**

Remove `@keyframes ember-rise`, `@keyframes forge-pulse`, `@keyframes forge-line-glow` if they existed in `index.css` or inline in Login.jsx.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: redesign Login — clean, minimal, no forge decorations"
```

---

### Task 19: Page Transitions + Haptic Feedback

**Files:**
- Modify: `frontend/src/components/layout/Layout.jsx`
- Modify: `frontend/src/App.jsx`
- Create: `frontend/src/utils/haptics.js`
- Modify: Various components (WorkoutSession, SetRow, Button)

**Step 1: Add page transition wrapper**

In `Layout.jsx`, wrap `<Outlet />` with Framer Motion for tab crossfade:

```jsx
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  return (
    <MobileContainer>
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <ChatFAB />
    </MobileContainer>
  );
}
```

**Step 2: Add slide transition for workout session**

When `WorkoutSession` mounts (full-screen), animate with slide-from-right:

```jsx
<motion.div
  className="fixed inset-0 z-50 bg-[var(--color-bg)]"
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
>
```

**Step 3: Create haptics utility**

```js
// frontend/src/utils/haptics.js
import { Capacitor } from '@capacitor/core';

let Haptics = null;

async function getHaptics() {
  if (Haptics) return Haptics;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import('@capacitor/haptics');
    Haptics = mod.Haptics;
    return Haptics;
  } catch {
    return null;
  }
}

export async function impactLight() {
  const h = await getHaptics();
  h?.impact({ style: 'LIGHT' });
}

export async function impactMedium() {
  const h = await getHaptics();
  h?.impact({ style: 'MEDIUM' });
}

export async function notifySuccess() {
  const h = await getHaptics();
  h?.notification({ type: 'SUCCESS' });
}

export async function notifyWarning() {
  const h = await getHaptics();
  h?.notification({ type: 'WARNING' });
}
```

**Step 4: Integrate haptics into key interactions**

- `SetRow.jsx`: Call `impactMedium()` when a set is marked complete
- `WorkoutSummary.jsx`: Call `notifySuccess()` when summary appears
- `Button.jsx` (primary variant): Call `impactLight()` on tap (optional — may feel excessive, test on device)

**Step 5: Add list item stagger animation**

For workout history list and exercise lists, add staggered fade-in:

```jsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: add page transitions, slide animations, haptic feedback, staggered list animations"
```

---

## Final Verification

After all tasks are complete:

1. **Visual audit**: Open the app in both light and dark mode. Check every screen for:
   - Consistent use of new color variables (no old `#d4872a`, `#fdf8f0`, `#0c0a09` hardcodes remaining)
   - No Cinzel font references remaining
   - No forge-themed text ("warrior", "anvil", "forge", "hammer")
   - Component kit used consistently (no inline button/card styles)

2. **Flow test**: Walk through every user journey:
   - Fresh user: onboarding → plan generation → today → start workout → complete → progress
   - Returning user: today (with previous data) → workout (with pre-filled weights) → summary → chat
   - Rest day: today shows rest day + next workout preview
   - Chat: ask data-specific question, verify AI references actual workout numbers

3. **Native feel check (on device)**:
   - Bottom sheet drag-to-dismiss
   - Tab switching animation
   - Workout session slide-in
   - Haptic feedback on set completion
   - Rest timer behavior

4. **Run lint**:

```bash
npm run lint
```

Fix any issues.

---

## Task Summary

| Phase | Task | Description | Effort |
|-------|------|-------------|--------|
| 1 | 1 | Dependencies + font swap | Small |
| 1 | 2 | Color system + decorative cleanup | Medium |
| 1 | 3 | Component kit (9 components) | Medium |
| 1 | 4 | BottomSheet component | Small |
| 1 | 5 | Layout restyle (TopBar + BottomNav) | Small |
| 2 | 6 | Previous performance endpoint | Small |
| 2 | 7 | Coaching context builder | Medium |
| 2 | 8 | Daily tip endpoint | Small |
| 2 | 9 | Chat context + AI persona update | Medium |
| 2 | 10 | PR detection bug fix | Small |
| 3 | 11 | Onboarding flow | Large |
| 3 | 12 | Today dashboard redesign | Large |
| 3 | 13 | Workout session redesign | Large |
| 3 | 14 | Progress page redesign | Large |
| 4 | 15 | Log/History redesign | Medium |
| 4 | 16 | Chat redesign | Small |
| 4 | 17 | Profile/Settings redesign | Medium |
| 4 | 18 | Login redesign | Small |
| 4 | 19 | Transitions + haptics | Medium |
