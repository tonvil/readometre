# Historial de llibres llegits — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the user a `/history` page listing all their `finished` books with rating, separate from the operational `/dashboard`.

**Architecture:** A small shared `formatStars` helper renders a rating as star characters. A new protected page `/history` queries `finished` entries, sorts them by effective date (`endDate ?? startDate`) descending, and renders them. The dashboard links to it.

**Tech Stack:** Next.js (App Router, Server Components), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only, matching the existing page conventions (`mx-auto mt-20 max-w-sm space-y-6` main wrapper, `text-sm text-gray-600` secondary text, `border p-2` links styled as buttons, `underline` inline links — see `src/app/dashboard/page.tsx` and `src/app/entries/[id]/page.tsx`).
- Only `status === "finished"` entries appear on `/history` — no `abandoned`, no filters, no pagination (all out of scope, per spec).
- Sort key is `endDate ?? startDate`, descending — never `startDate` alone, since `endDate` is the more accurate "when I finished this" signal when present.
- A `rating` of `null` renders as the literal text "Sense valoració", never as five empty stars (which would be visually indistinguishable from a 0 rating, which the app doesn't allow — `rating` is 1-5 or absent).
- Every task ends in its own git commit.

---

## File Structure

```
src/
├── lib/
│   └── rating.ts                 # New: formatStars(rating) helper
├── lib/supabase/
│   └── middleware.ts              # Modified: add "/history" to PROTECTED_PATHS
└── app/
    ├── history/
    │   └── page.tsx                # New: /history page
    └── dashboard/
        └── page.tsx                 # Modified: add link to /history
```

---

### Task 1: `formatStars` helper

**Files:**
- Create: `src/lib/rating.ts`

**Interfaces:**
- Produces: `formatStars(rating: number | null): string` from `src/lib/rating.ts` — consumed by Task 2.

- [ ] **Step 1: Write the helper**

```typescript
// src/lib/rating.ts
export function formatStars(rating: number | null): string {
  if (rating === null) return "Sense valoració";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rating.ts
git commit -m "feat: add formatStars rating helper"
```

---

### Task 2: `/history` page and route protection

**Files:**
- Create: `src/app/history/page.tsx`
- Modify: `src/lib/supabase/middleware.ts`

**Interfaces:**
- Consumes: `formatStars` from `@/lib/rating` (Task 1), `createClient` from `@/lib/supabase/server`, `prisma` from `@/lib/prisma`.

- [ ] **Step 1: Protect the route**

In `src/lib/supabase/middleware.ts`, change:

```typescript
const PROTECTED_PATHS = ["/dashboard", "/onboarding", "/books", "/entries"];
```

to:

```typescript
const PROTECTED_PATHS = ["/dashboard", "/onboarding", "/books", "/entries", "/history"];
```

- [ ] **Step 2: Write the page**

```typescript
// src/app/history/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatStars } from "@/lib/rating";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuari = await prisma.usuari.findUnique({ where: { id: user.id } });

  if (!usuari) {
    redirect("/onboarding");
  }

  const entries = await prisma.readingEntry.findMany({
    where: { usuariId: usuari.id, status: "finished" },
    include: { book: true },
  });

  entries.sort(
    (a, b) =>
      (b.endDate ?? b.startDate).getTime() -
      (a.endDate ?? a.startDate).getTime(),
  );

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Historial de lectura</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-600">
          Encara no has acabat cap llibre.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="text-sm">
              <a
                href={`/entries/${entry.id}`}
                className="font-medium underline"
              >
                {entry.book.title}
              </a>
              {" — "}
              {entry.book.author}
              {entry.book.genre ? ` (${entry.book.genre})` : ""}
              <br />
              {formatStars(entry.rating)}
            </li>
          ))}
        </ul>
      )}
      <a href="/dashboard" className="inline-block border p-2">
        Torna al dashboard
      </a>
    </main>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/history/page.tsx src/lib/supabase/middleware.ts
git commit -m "feat: add reading history page"
```

---

### Task 3: Link from the dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:** None new — this task only wires existing pieces together.

- [ ] **Step 1: Add the link**

In `src/app/dashboard/page.tsx`, change:

```tsx
      <a href="/books/new" className="inline-block border p-2">
        Afegeix un llibre
      </a>
```

to:

```tsx
      <div className="flex gap-2">
        <a href="/books/new" className="inline-block border p-2">
          Afegeix un llibre
        </a>
        <a href="/history" className="inline-block border p-2">
          Historial de lectura
        </a>
      </div>
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: link to reading history from the dashboard"
```

---

### Task 4: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Filtering and sorting**

```bash
npm run dev
```

1. Log in with a test account that has entries in different statuses
   (reading, finished, abandoned). If it doesn't have at least two
   `finished` entries with different `endDate` values, create/edit some
   via `/books/new` and the entry edit form (`/entries/[id]`) to set
   this up.
2. Click "Historial de lectura" from `/dashboard`. Expected: only
   `finished` entries appear, ordered with the most recently finished
   book first.
3. If you have a `finished` entry with no `endDate` (created directly
   as "Acabat" from `/books/new` without a date), confirm it's
   positioned by its `startDate` relative to the others.

- [ ] **Step 2: Rating display**

1. Confirm entries with a rating show the correct number of filled
   stars (e.g. rating 4 → `★★★★☆`).
2. Confirm a `finished` entry with no rating shows "Sense valoració".

- [ ] **Step 3: Empty state and route protection**

1. If feasible, test with an account with zero `finished` entries (or
   temporarily reason about the empty-state branch by inspection):
   expected message "Encara no has acabat cap llibre."
2. Log out. Visit `/history` directly. Expected: redirected to
   `/login`.

- [ ] **Step 4: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
