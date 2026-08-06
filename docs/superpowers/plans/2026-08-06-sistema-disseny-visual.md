# Sistema de disseny visual "Nit de lectura" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give readOmetre a distinctive, coherent visual identity ("Nit de lectura" — reading under a warm light against a starry sky, with a paper-and-forest-green daylight counterpart), replacing the current unstyled Tailwind defaults across every page.

**Architecture:** CSS custom properties in `globals.css` define two token sets (dark default, light via `[data-theme="light"]`), consumed as Tailwind v4 utility classes through an `@theme inline` block. A cookie-backed theme toggle lives in a new shared `AppHeader`, rendered once from the root layout. A CSS-only `GalaxyBackground` component renders behind all content and hides itself in the light theme via CSS. A small `Panel` component implements the "targeta" convention used to separate functional blocks on multi-section pages. Every existing page is then updated to use the new tokens instead of raw Tailwind color utilities.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), Tailwind CSS v4, `next/font/google`.

## Global Constraints

- Dark theme ("Nit de lectura") is the default; light theme ("Llum del dia") activates via a `data-theme="light"` attribute on `<html>`, driven by a `theme` cookie (`"dark"` | `"light"`, default `"dark"`).
- After this plan, no page may use raw Tailwind color utilities (`bg-black`, `text-white`, `text-gray-600`, `text-red-600`, `border` alone, etc.) — use the token utilities defined in Task 1: `bg-bg`, `text-ink`, `text-ink-muted`, `bg-accent`, `text-accent`, `text-accent-ink`, `text-danger`, `border-danger-border`, `bg-panel-bg`, `border-panel-border`, `bg-field-bg`, `border-field-border`, `font-display`, `font-sans`.
- The `Panel` component (Task 2) is used for every distinct functional block on `/dashboard` (one per status section) and `/entries/[id]` (edit entry, delete entry — "Zona de perill" variant, edit book, sessions). Single-purpose pages (auth pages, `/books/new`, `/history`) do not need `Panel` — apply tokens directly.
- `GalaxyBackground` renders once, globally, from the root layout — no page adds or conditions it itself.
- No test framework in this plan (deferred, per project decision).
- Every task ends in its own git commit.

---

## File Structure

```
src/
├── app/
│   ├── globals.css                     # Modified: tokens, fonts, focus-visible, galaxy CSS
│   ├── layout.tsx                       # Modified: font loading, theme read, AppHeader + GalaxyBackground
│   ├── theme-actions.ts                 # New: setTheme() Server Action
│   ├── login/page.tsx                    # Modified: tokens
│   ├── signup/page.tsx                   # Modified: tokens
│   ├── forgot-password/page.tsx          # Modified: tokens
│   ├── reset-password/page.tsx           # Modified: tokens
│   ├── onboarding/page.tsx               # Modified: tokens
│   ├── dashboard/page.tsx                # Modified: tokens + Panel per status section
│   ├── books/new/page.tsx                # Modified: tokens
│   ├── history/page.tsx                  # Modified: tokens
│   └── entries/[id]/
│       ├── page.tsx                       # Modified: tokens
│       ├── entry-edit-form.tsx            # Modified: tokens + Panel
│       ├── delete-entry-button.tsx        # Modified: tokens + Panel (danger variant)
│       ├── book-edit-form.tsx             # Modified: tokens + Panel
│       ├── session-form.tsx               # Modified: tokens
│       └── session-row.tsx                # Modified: tokens
├── components/
│   ├── panel.tsx                          # New: Panel component
│   ├── app-header.tsx                     # New: shared header (Server Component)
│   ├── theme-toggle.tsx                   # New: client toggle button
│   └── galaxy-background.tsx              # New: decorative background
└── lib/
    └── theme.ts                           # New: getTheme(), Theme type
```

---

### Task 1: Design tokens, fonts, and focus-visible baseline

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utility classes `bg-bg`, `text-ink`, `text-ink-muted`, `bg-accent`, `text-accent`, `text-accent-ink`, `text-danger`, `border-danger-border`, `bg-panel-bg`, `border-panel-border`, `bg-field-bg`, `border-field-border`, `font-display`, `font-sans` — consumed by every later task. Produces `--font-fraunces`/`--font-instrument-sans` CSS variables on `<html>` — consumed by Task 3.

- [ ] **Step 1: Replace `globals.css`**

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --bg: #12111c;
  --ink: #f6f1e7;
  --ink-muted: #a89d87;
  --accent: #e0a94a;
  --accent-ink: #12111c;
  --danger: #d97b6c;
  --danger-border: #7a3f38;
  --panel-bg: rgba(20, 19, 30, 0.72);
  --panel-border: rgba(255, 255, 255, 0.1);
  --field-bg: rgba(255, 255, 255, 0.05);
  --field-border: rgba(255, 255, 255, 0.12);
}

:root[data-theme="light"] {
  --bg: #f6f1e7;
  --ink: #2b2620;
  --ink-muted: #7a6f5c;
  --accent: #3d5c46;
  --accent-ink: #fff8ee;
  --danger: #a3402f;
  --danger-border: #c99b8e;
  --panel-bg: rgba(255, 255, 255, 0.55);
  --panel-border: rgba(0, 0, 0, 0.08);
  --field-bg: rgba(0, 0, 0, 0.03);
  --field-border: rgba(0, 0, 0, 0.12);
}

@theme inline {
  --color-bg: var(--bg);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-accent: var(--accent);
  --color-accent-ink: var(--accent-ink);
  --color-danger: var(--danger);
  --color-danger-border: var(--danger-border);
  --color-panel-bg: var(--panel-bg);
  --color-panel-border: var(--panel-border);
  --color-field-bg: var(--field-bg);
  --color-field-border: var(--field-border);
  --font-display: var(--font-fraunces);
  --font-sans: var(--font-instrument-sans);
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

This removes the old `--background`/`--foreground` tokens, the
`prefers-color-scheme` media query (theme is now cookie-driven, not
OS-driven), and the `font-family: Arial, Helvetica, sans-serif;`
override that was silently defeating the previously-loaded fonts.

- [ ] **Step 2: Swap the loaded fonts in `layout.tsx`**

In `src/app/layout.tsx`, change:

```typescript
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

to:

```typescript
import { Fraunces, Instrument_Sans } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});
```

And change the `className` on `<html>` from
`` `${geistSans.variable} ${geistMono.variable} h-full antialiased` ``
to
`` `${fraunces.variable} ${instrumentSans.variable} h-full antialiased` ``.

Leave everything else in `layout.tsx` untouched for this task — the
header, galaxy background, and theme cookie wiring come in Task 3.

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual visual check**

```bash
npm run dev
```

Visit any page (e.g. `/login`). Expected: dark background (`#12111c`),
cream text, and the page title now rendered in a serif display font
(Fraunces) instead of Arial. Stop the dev server afterward.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add Nit de lectura design tokens and swap to Fraunces/Instrument Sans"
```

---

### Task 2: `Panel` component

**Files:**
- Create: `src/components/panel.tsx`

**Interfaces:**
- Consumes: Tailwind utilities from Task 1 (`bg-panel-bg`, `border-panel-border`, `text-accent`, `text-danger`).
- Produces: `Panel({ label: string; variant?: "default" | "danger"; children: React.ReactNode })` from `src/components/panel.tsx` — consumed by Tasks 5, 7, 8.

- [ ] **Step 1: Write the component**

```typescript
// src/components/panel.tsx
export default function Panel({
  label,
  variant = "default",
  children,
}: {
  label: string;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  const labelColor = variant === "danger" ? "text-danger" : "text-accent";

  return (
    <div className="rounded-lg border border-panel-border bg-panel-bg p-4">
      <h4
        className={`mb-2.5 text-[11px] font-medium uppercase tracking-wide ${labelColor}`}
      >
        {label}
      </h4>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (the component isn't used yet, so this only
checks its own syntax/types).

- [ ] **Step 3: Commit**

```bash
git add src/components/panel.tsx
git commit -m "feat: add Panel component for grouping page sections"
```

---

### Task 3: Theme toggle, shared header, and galaxy background

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/app/theme-actions.ts`
- Create: `src/components/theme-toggle.tsx`
- Create: `src/components/app-header.tsx`
- Create: `src/components/galaxy-background.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `Theme = "dark" | "light"` and `getTheme(): Promise<Theme>` from `src/lib/theme.ts`.
- Produces: `setTheme(theme: Theme): Promise<void>` Server Action from `src/app/theme-actions.ts`.
- Consumes: Tailwind utilities from Task 1.

- [ ] **Step 1: Write the theme reader**

```typescript
// src/lib/theme.ts
import { cookies } from "next/headers";

export type Theme = "dark" | "light";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get("theme")?.value;
  return value === "light" ? "light" : "dark";
}
```

- [ ] **Step 2: Write the Server Action**

```typescript
// src/app/theme-actions.ts
"use server";

import { cookies } from "next/headers";
import type { Theme } from "@/lib/theme";

export async function setTheme(theme: Theme) {
  (await cookies()).set("theme", theme, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
```

- [ ] **Step 3: Write the client toggle**

```typescript
// src/components/theme-toggle.tsx
"use client";

import { useState } from "react";
import { setTheme } from "@/app/theme-actions";
import type { Theme } from "@/lib/theme";

export default function ThemeToggle({
  currentTheme,
}: {
  currentTheme: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  async function handleClick() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    await setTheme(next);
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-ink-muted hover:text-ink"
      aria-label="Canvia de tema clar/fosc"
    >
      {theme === "dark" ? "☀ Mode clar" : "☾ Mode fosc"}
    </button>
  );
}
```

Local state (`theme`) is required here, not just the `currentTheme`
prop: `AppHeader` is a Server Component that only re-renders on a full
server round-trip, so without local state a second click would use a
stale `currentTheme` and never toggle back.

- [ ] **Step 4: Write the shared header**

```typescript
// src/components/app-header.tsx
import ThemeToggle from "@/components/theme-toggle";
import type { Theme } from "@/lib/theme";

export default function AppHeader({ theme }: { theme: Theme }) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-sm items-center justify-between px-4 pt-6">
      <span className="font-display text-sm tracking-wide text-ink">
        readOmetre
      </span>
      <ThemeToggle currentTheme={theme} />
    </header>
  );
}
```

- [ ] **Step 5: Write the galaxy background**

```typescript
// src/components/galaxy-background.tsx
export default function GalaxyBackground() {
  return (
    <div
      aria-hidden="true"
      className="galaxy-background pointer-events-none fixed inset-0 -z-10"
    />
  );
}
```

- [ ] **Step 6: Add the galaxy CSS and light-theme hide rule**

Append to `src/app/globals.css` (after the `:focus-visible` rule added
in Task 1):

```css
.galaxy-background {
  background:
    radial-gradient(circle at 25% 15%, rgba(120, 90, 180, 0.35), transparent 45%),
    radial-gradient(circle at 80% 70%, rgba(60, 80, 140, 0.35), transparent 50%),
    radial-gradient(1.5px 1.5px at 10% 20%, #fff, transparent),
    radial-gradient(1px 1px at 30% 10%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 55% 30%, #fff, transparent),
    radial-gradient(1px 1px at 70% 65%, #fff, transparent),
    radial-gradient(1px 1px at 15% 70%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 85% 45%, #fff, transparent),
    radial-gradient(1px 1px at 45% 85%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 90% 15%, #fff, transparent);
}

:root[data-theme="light"] .galaxy-background {
  display: none;
}
```

- [ ] **Step 7: Wire it all into the root layout**

In `src/app/layout.tsx`, add these imports alongside the existing
`Fraunces`/`Instrument_Sans` ones from Task 1:

```typescript
import { getTheme } from "@/lib/theme";
import AppHeader from "@/components/app-header";
import GalaxyBackground from "@/components/galaxy-background";
```

Change the component to an `async` function that reads the theme and
sets `data-theme` on `<html>`, and render `GalaxyBackground` and
`AppHeader` inside `<body>`, before `{children}`:

```tsx
export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const theme = await getTheme();

  return (
    <html
      lang="ca"
      data-theme={theme === "light" ? "light" : undefined}
      className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-bg text-ink">
        <GalaxyBackground />
        <AppHeader theme={theme} />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Manual visual check**

```bash
npm run dev
```

Visit `/login`. Expected: "readOmetre" header with a "☀ Mode clar"
toggle, a starry/nebula background visible behind the (still
unstyled-below-this-task) page content. Click the toggle: background
switches instantly to flat paper, no reload; click again: galaxy
returns. Reload the page after toggling to light: theme persists
(cookie). Stop the dev server afterward.

- [ ] **Step 10: Commit**

```bash
git add src/lib/theme.ts src/app/theme-actions.ts src/components/theme-toggle.tsx src/components/app-header.tsx src/components/galaxy-background.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: add theme toggle, shared header, and galaxy background"
```

---

### Task 4: Public pages — login, signup, forgot-password, reset-password

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/reset-password/page.tsx`

**Interfaces:** None new — applies tokens from Task 1.

- [ ] **Step 1: Update `src/app/login/page.tsx`**

Replace the file's return statement with:

```tsx
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Inicia sessió
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="password"
          type="password"
          placeholder="Contrasenya"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Entra
        </button>
      </form>
      <button
        onClick={handleGoogleLogin}
        className="w-full rounded border border-field-border p-2 text-ink"
      >
        Continua amb Google
      </button>
      <p className="text-sm text-ink">
        <a href="/forgot-password" className="text-accent underline">
          Has oblidat la contrasenya?
        </a>
      </p>
      <p className="text-sm text-ink">
        No tens compte?{" "}
        <a href="/signup" className="text-accent underline">
          Registra&apos;t
        </a>
      </p>
    </main>
  );
```

Leave the rest of the file (imports, `handleSubmit`, `handleGoogleLogin`,
the `error` state) untouched.

- [ ] **Step 2: Update `src/app/signup/page.tsx`**

Replace the file's return statements with:

```tsx
  if (success) {
    return (
      <main className="relative z-10 mx-auto mt-10 max-w-sm px-4">
        <p className="text-ink">Revisa el teu email per confirmar el compte.</p>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Crea un compte
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="password"
          type="password"
          placeholder="Contrasenya"
          required
          minLength={6}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Registra&apos;t
        </button>
      </form>
      <p className="text-sm text-ink">
        Ja tens compte?{" "}
        <a href="/login" className="text-accent underline">
          Inicia sessió
        </a>
      </p>
    </main>
  );
```

- [ ] **Step 3: Update `src/app/forgot-password/page.tsx`**

Replace the file's return statements with:

```tsx
  if (success) {
    return (
      <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
        <p className="text-sm text-ink-muted">
          Si l&apos;email existeix, rebràs un enllaç per restablir la
          contrasenya.
        </p>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Recupera la contrasenya
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Envia l&apos;enllaç
        </button>
      </form>
      <p className="text-sm text-ink">
        <a href="/login" className="text-accent underline">
          Torna a l&apos;inici de sessió
        </a>
      </p>
    </main>
  );
```

- [ ] **Step 4: Update `src/app/reset-password/page.tsx`**

Replace the file's return statement with:

```tsx
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Estableix una contrasenya nova
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="password"
          type="password"
          placeholder="Contrasenya nova"
          required
          minLength={6}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Repeteix la contrasenya"
          required
          minLength={6}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Desa la contrasenya
        </button>
      </form>
      <p className="text-sm text-ink">
        <a href="/forgot-password" className="text-accent underline">
          Torna a demanar un enllaç
        </a>
      </p>
    </main>
  );
```

- [ ] **Step 5: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/login/page.tsx src/app/signup/page.tsx src/app/forgot-password/page.tsx src/app/reset-password/page.tsx
git commit -m "feat: apply design tokens to public auth pages"
```

---

### Task 5: Onboarding and dashboard

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Panel` from `@/components/panel` (Task 2).

- [ ] **Step 1: Update `src/app/onboarding/page.tsx`**

Replace the file's return statement with:

```tsx
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Completa el teu perfil
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="nom"
          placeholder="Nom"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="cognom"
          placeholder="Cognom"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="dataNaixement"
          type="date"
          placeholder="Data de naixement"
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Guarda i continua
        </button>
      </form>
    </main>
  );
```

- [ ] **Step 2: Update `src/app/dashboard/page.tsx`**

Add the import at the top, alongside the existing ones:

```typescript
import Panel from "@/components/panel";
```

Replace the file's return statement with:

```tsx
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Benvingut, {usuari.nom}
      </h1>
      <div className="flex gap-2">
        <a
          href="/books/new"
          className="inline-block rounded border border-field-border p-2 text-ink"
        >
          Afegeix un llibre
        </a>
        <a
          href="/history"
          className="inline-block rounded border border-field-border p-2 text-ink"
        >
          Historial de lectura
        </a>
      </div>
      {readingEntries.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Encara no has afegit cap llibre.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {finishedCount} llibres finalitzats · {readingCount} en curs ·{" "}
            {totalPages} pàgines llegides
          </p>
          <div className="space-y-4">
            {sections.map((section) => (
              <Panel key={section.title} label={section.title}>
                <ul className="space-y-1">
                  {section.entries.map((entry) => (
                    <li key={entry.id} className="text-sm text-ink">
                      <a
                        href={`/entries/${entry.id}`}
                        className="font-medium text-accent underline"
                      >
                        {entry.book.title}
                      </a>
                      {" — "}
                      {entry.book.author}
                      {entry.book.genre ? ` (${entry.book.genre})` : ""}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </>
      )}
      <form action={logout}>
        <button
          type="submit"
          className="rounded border border-field-border p-2 text-ink"
        >
          Tanca sessió
        </button>
      </form>
    </main>
  );
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx src/app/dashboard/page.tsx
git commit -m "feat: apply design tokens to onboarding and dashboard"
```

---

### Task 6: `/books/new`

**Files:**
- Modify: `src/app/books/new/page.tsx`

**Interfaces:** None new — applies tokens from Task 1.

- [ ] **Step 1: Update the search phase**

Replace the `phase === "search"` return block with:

```tsx
  if (phase === "search") {
    return (
      <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-4 px-4">
        <h1 className="font-display text-2xl font-bold text-ink">
          Afegeix un llibre
        </h1>
        <input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="ISBN"
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {searchError && <p className="text-sm text-danger">{searchError}</p>}
        <button
          onClick={handleSearch}
          disabled={searching}
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          {searching ? "Cercant..." : "Cerca"}
        </button>
        <button
          onClick={handleManualEntry}
          className="w-full rounded border border-field-border p-2 text-ink"
        >
          Entrada manual
        </button>
      </main>
    );
  }
```

- [ ] **Step 2: Update the confirm phase**

Replace the final return block with:

```tsx
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-4 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Confirma les dades
      </h1>
      <form action={handleSave} className="space-y-4">
        <input type="hidden" name="isbn" value={isbn} />
        {readOnlyBook ? (
          <div className="space-y-1 rounded border border-panel-border bg-panel-bg p-3 text-sm text-ink">
            <p>
              <strong>{book.title}</strong>
            </p>
            <p>{book.author}</p>
            {book.genre && <p>{book.genre}</p>}
            {book.pageCount && <p>{book.pageCount} pàgines</p>}
            <input type="hidden" name="title" value={book.title} />
            <input type="hidden" name="author" value={book.author} />
            <input type="hidden" name="genre" value={book.genre} />
            <input type="hidden" name="pageCount" value={book.pageCount} />
          </div>
        ) : (
          <>
            <input
              name="title"
              defaultValue={book.title}
              placeholder="Títol"
              required
              className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
            />
            <input
              name="author"
              defaultValue={book.author}
              placeholder="Autor"
              required
              className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
            />
            <input
              name="genre"
              defaultValue={book.genre}
              placeholder="Gènere"
              className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
            />
            <input
              name="pageCount"
              type="number"
              defaultValue={book.pageCount}
              placeholder="Pàgines"
              min={1}
              className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
            />
          </>
        )}
        <select
          name="status"
          defaultValue="reading"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
        >
          <option value="reading">Llegint</option>
          <option value="finished">Finalitzat</option>
          <option value="abandoned">Abandonat</option>
        </select>
        <input
          name="startDate"
          type="date"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
        />
        <input
          name="endDate"
          type="date"
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
        />
        <input
          name="rating"
          type="number"
          min={1}
          max={5}
          placeholder="Valoració (1-5)"
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {saveError && <p className="text-sm text-danger">{saveError}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Desa
        </button>
      </form>
    </main>
  );
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/books/new/page.tsx
git commit -m "feat: apply design tokens to books/new"
```

---

### Task 7: `/entries/[id]` page, entry edit form, and delete button

**Files:**
- Modify: `src/app/entries/[id]/page.tsx`
- Modify: `src/app/entries/[id]/entry-edit-form.tsx`
- Modify: `src/app/entries/[id]/delete-entry-button.tsx`

**Interfaces:**
- Consumes: `Panel` from `@/components/panel` (Task 2).

- [ ] **Step 1: Update `src/app/entries/[id]/page.tsx`**

Replace the file's return statement with:

```tsx
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        {entry.book.title}
      </h1>
      <p className="text-sm text-ink-muted">{entry.book.author}</p>
      <p className="text-sm text-ink-muted">Estat: {entry.status}</p>
      {progressPercent !== null && (
        <p className="text-sm text-ink-muted">
          {latestSession.page} de {entry.book.pageCount} pàgines ·{" "}
          {progressPercent}%
        </p>
      )}
      <EntryEditForm
        readingEntryId={entry.id}
        status={entry.status}
        rating={entry.rating}
        notes={entry.notes}
        endDate={toDateInputValue(entry.endDate)}
      />
      <DeleteEntryButton readingEntryId={entry.id} />
      <BookEditForm
        bookId={entry.book.id}
        title={entry.book.title}
        author={entry.book.author}
        genre={entry.book.genre}
        pageCount={entry.book.pageCount}
        isbn={entry.book.isbn}
      />
      <SessionForm readingEntryId={entry.id} />
      {entry.readingSessions.length > 0 && (
        <Panel label="Sessions de lectura">
          <ul className="space-y-1">
            {entry.readingSessions.map((session) => (
              <SessionRow
                key={session.id}
                sessionId={session.id}
                page={session.page}
                dateDisplay={session.date.toLocaleDateString("ca")}
                dateValue={session.date.toISOString().slice(0, 10)}
              />
            ))}
          </ul>
        </Panel>
      )}
      <a
        href="/dashboard"
        className="inline-block rounded border border-field-border p-2 text-ink"
      >
        Torna al dashboard
      </a>
    </main>
  );
```

Add the import alongside the existing ones:

```typescript
import Panel from "@/components/panel";
```

- [ ] **Step 2: Update `src/app/entries/[id]/entry-edit-form.tsx`**

Wrap the existing `<form>` in a `Panel`, and update its inner
element classes. Replace the file's return statement with:

```tsx
  return (
    <Panel label="Estat de lectura">
      <form action={handleSubmit} className="space-y-4">
        <select
          name="status"
          defaultValue={status}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
        >
          <option value="reading">Llegint</option>
          <option value="finished">Acabat</option>
          <option value="abandoned">Abandonat</option>
        </select>
        <input
          name="rating"
          type="number"
          min={1}
          max={5}
          placeholder="Valoració (1-5)"
          defaultValue={rating ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          defaultValue={notes ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="endDate"
          type="date"
          defaultValue={endDate ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Desa
        </button>
      </form>
    </Panel>
  );
```

Add the import alongside the existing ones:

```typescript
import Panel from "@/components/panel";
```

- [ ] **Step 3: Update `src/app/entries/[id]/delete-entry-button.tsx`**

Replace the file's return statement with:

```tsx
  return (
    <Panel label="Zona de perill" variant="danger">
      <button
        onClick={handleDelete}
        className="rounded border border-danger-border px-3 py-1.5 text-sm text-danger"
      >
        Esborra aquest llibre
      </button>
    </Panel>
  );
```

Add the import alongside the existing one:

```typescript
import Panel from "@/components/panel";
```

- [ ] **Step 4: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/entries/[id]/page.tsx src/app/entries/[id]/entry-edit-form.tsx src/app/entries/[id]/delete-entry-button.tsx
git commit -m "feat: apply design tokens and Panel to entry detail, edit form, and delete button"
```

---

### Task 8: Book edit form, session form, and session row

**Files:**
- Modify: `src/app/entries/[id]/book-edit-form.tsx`
- Modify: `src/app/entries/[id]/session-form.tsx`
- Modify: `src/app/entries/[id]/session-row.tsx`

**Interfaces:**
- Consumes: `Panel` from `@/components/panel` (Task 2).

- [ ] **Step 1: Update `src/app/entries/[id]/book-edit-form.tsx`**

Replace the file's return statement with:

```tsx
  return (
    <Panel label="Dades del llibre">
      <form action={handleSubmit} className="space-y-4">
        {isbn && <p className="text-sm text-ink-muted">ISBN: {isbn}</p>}
        <input
          name="title"
          type="text"
          placeholder="Títol"
          defaultValue={title}
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="author"
          type="text"
          placeholder="Autor"
          defaultValue={author}
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="genre"
          type="text"
          placeholder="Gènere"
          defaultValue={genre ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="pageCount"
          type="number"
          min={1}
          placeholder="Nombre de pàgines"
          defaultValue={pageCount ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Desa el llibre
        </button>
      </form>
    </Panel>
  );
```

Add the import alongside the existing one:

```typescript
import Panel from "@/components/panel";
```

- [ ] **Step 2: Update `src/app/entries/[id]/session-form.tsx`**

Replace the file's return statement with:

```tsx
  return (
    <form action={handleSubmit} className="space-y-4">
      <input
        name="date"
        type="date"
        required
        className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
      />
      <input
        name="page"
        type="number"
        min={1}
        placeholder="Pàgina"
        required
        className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
      >
        Registra sessió
      </button>
    </form>
  );
```

This page has no shared imports to add — `session-form.tsx` doesn't
wrap itself in a `Panel` (the `Panel` labeled "Sessions de lectura"
wrapping the whole sessions area, including this form, was already
added to `page.tsx` in Task 7).

- [ ] **Step 3: Update `src/app/entries/[id]/session-row.tsx`**

Replace the whole file's JSX (both the `isEditing` branch and the
default return) with:

```tsx
  if (isEditing) {
    return (
      <li className="text-sm">
        <form
          action={handleSave}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            name="date"
            type="date"
            defaultValue={dateValue}
            required
            className="rounded border border-field-border bg-field-bg p-1 text-ink"
          />
          <input
            name="page"
            type="number"
            min={1}
            defaultValue={page}
            required
            className="w-20 rounded border border-field-border bg-field-bg p-1 text-ink"
          />
          <button
            type="submit"
            className="rounded border border-field-border px-2 py-1 text-ink"
          >
            Desa
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border border-field-border px-2 py-1 text-ink"
          >
            Cancel·la
          </button>
        </form>
        {error && <p className="text-sm text-danger">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 text-sm text-ink">
      <span>
        {dateDisplay} — pàgina {page}
      </span>
      <button onClick={() => setIsEditing(true)} className="text-accent underline">
        Edita
      </button>
      <button onClick={handleDelete} className="text-danger underline">
        Esborra
      </button>
    </li>
  );
```

- [ ] **Step 4: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/entries/[id]/book-edit-form.tsx src/app/entries/[id]/session-form.tsx src/app/entries/[id]/session-row.tsx
git commit -m "feat: apply design tokens and Panel to book edit form, session form, and session row"
```

---

### Task 9: `/history`

**Files:**
- Modify: `src/app/history/page.tsx`

**Interfaces:** None new — applies tokens from Task 1.

- [ ] **Step 1: Update the return statement**

```tsx
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Historial de lectura
      </h1>
      {entries.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Encara no has acabat cap llibre.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="text-sm text-ink">
              <a
                href={`/entries/${entry.id}`}
                className="font-medium text-accent underline"
              >
                {entry.book.title}
              </a>
              {" — "}
              {entry.book.author}
              {entry.book.genre ? ` (${entry.book.genre})` : ""}
              <br />
              <span className="text-ink-muted">{formatStars(entry.rating)}</span>
            </li>
          ))}
        </ul>
      )}
      <a
        href="/dashboard"
        className="inline-block rounded border border-field-border p-2 text-ink"
      >
        Torna al dashboard
      </a>
    </main>
  );
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/history/page.tsx
git commit -m "feat: apply design tokens to history page"
```

---

### Task 10: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Theme toggle and persistence**

```bash
npm run dev
```

1. Visit `/login` with no cookies. Expected: dark theme, galaxy
   background visible, "☀ Mode clar" toggle in the header.
2. Click the toggle. Expected: instantly switches to the light theme
   (paper background, forest-green accent, no galaxy), no page reload.
3. Reload the page. Expected: light theme persists.
4. Click the toggle again to switch back to dark, and confirm the
   galaxy reappears.

- [ ] **Step 2: Every page renders with tokens, no raw defaults left**

Visit each of these pages (log in with a test account as needed) and
confirm none of them show plain black/white/gray Tailwind defaults,
and that page titles render in the serif display font:
`/login`, `/signup`, `/forgot-password`, `/reset-password`,
`/onboarding` (new account), `/dashboard`, `/books/new` (both phases),
`/entries/[id]` (an entry with sessions), `/history`.

- [ ] **Step 3: `/entries/[id]` panel separation**

On an entry with at least one session, confirm the page shows four
distinct panels: "Estat de lectura", "Zona de perill" (with the
delete button in danger colors, visually different from the other
panels), "Dades del llibre", and "Sessions de lectura" — each with its
own bordered/translucent card and uppercase label.

- [ ] **Step 4: Keyboard focus and mobile width**

1. Tab through a form (e.g. `/login`) and confirm every input and
   button shows a visible accent-colored focus ring.
2. Resize the browser to a narrow (mobile) width on `/entries/[id]`
   and confirm all panels and forms remain readable and usable, no
   horizontal overflow.

- [ ] **Step 5: Contrast spot-check**

Using the browser's DevTools color picker/contrast checker, spot-check
`--ink-muted` text on `--bg` and the accent button text on `--accent`
in both themes. Expected: no glaringly low-contrast combinations (this
is a manual sanity check, not a formal audit).

- [ ] **Step 6: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
