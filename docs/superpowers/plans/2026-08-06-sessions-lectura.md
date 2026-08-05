# Sessions de lectura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user record reading sessions (date + page reached) for a book they're reading, view their progress, and reach each book's detail page from the dashboard.

**Architecture:** A new `ReadingSession` Prisma model belongs to `ReadingEntry`. A new protected route `/entries/[id]` shows the entry's detail, progress, a session-logging form, and the session history; the dashboard's book list links to it.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only.
- No auto-status-change on reaching the last page — status stays manual (out of scope, per spec).
- No session edit/delete, no per-session notes (out of scope, per spec).
- A `ReadingEntry` not owned by the requesting user (or nonexistent) must 404, not error.
- Every task ends in its own git commit.

---

## File Structure

```
prisma/
└── schema.prisma                    # New ReadingSession model; ReadingEntry gains readingSessions[]
src/
├── app/
│   ├── entries/
│   │   └── [id]/
│   │       ├── actions.ts            # addSession()
│   │       ├── session-form.tsx      # Client form component
│   │       └── page.tsx              # Detail page: guards, progress, sessions list
│   └── dashboard/
│       └── page.tsx                  # Modified: book titles become links to /entries/[id]
└── lib/supabase/middleware.ts        # Modified: protect /entries
```

---

### Task 1: `ReadingSession` model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_reading_session/migration.sql`

**Interfaces:**
- Produces: `ReadingSession` model (`id`, `readingEntryId`, `date`, `page`) and `ReadingEntry.readingSessions` relation — consumed by Tasks 2, 3.

- [ ] **Step 1: Update the schema**

In `prisma/schema.prisma`, add `readingSessions ReadingSession[]` as the
last field of the `ReadingEntry` model (after `notes`), and add a new
model after `ReadingEntry`:

```prisma
model ReadingSession {
  id             String       @id @default(uuid())
  readingEntryId String
  readingEntry   ReadingEntry @relation(fields: [readingEntryId], references: [id])
  date           DateTime
  page           Int
}
```

- [ ] **Step 2: Author the migration by hand**

`npx prisma migrate dev` requires an interactive terminal, unavailable
here — author the migration the same way used throughout this project:

```bash
TS=$(date -u +%Y%m%d%H%M%S)
mkdir -p "prisma/migrations/${TS}_reading_session"
cat > "prisma/migrations/${TS}_reading_session/migration.sql" <<'EOF'
-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "readingEntryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "page" INTEGER NOT NULL,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_readingEntryId_fkey" FOREIGN KEY ("readingEntryId") REFERENCES "ReadingEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EOF
npx prisma migrate deploy
npx prisma generate
```

- [ ] **Step 3: Verify**

```bash
npx prisma validate
npx tsc --noEmit
```

Expected: both succeed with no errors. Then check the Supabase dashboard
(Table Editor) and confirm the `ReadingSession` table exists with a
foreign key to `ReadingEntry`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add ReadingSession model"
```

---

### Task 2: `addSession` Server Action

**Files:**
- Create: `src/app/entries/[id]/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `prisma` from
  `@/lib/prisma`.
- Produces: `addSession(readingEntryId: string, formData: FormData): Promise<{ error: string } | never>`
  (redirects on success) from `src/app/entries/[id]/actions.ts` —
  consumed by Task 3.

- [ ] **Step 1: Write the action**

```typescript
// src/app/entries/[id]/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function addSession(readingEntryId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const entry = await prisma.readingEntry.findUnique({
    where: { id: readingEntryId },
  });

  if (!entry || entry.usuariId !== user.id) {
    redirect("/dashboard");
  }

  const date = formData.get("date") as string;
  const pageRaw = formData.get("page") as string;
  const page = Number(pageRaw);

  if (!date || !pageRaw || Number.isNaN(page) || page < 1) {
    return { error: "Introdueix una data i una pàgina vàlides." };
  }

  await prisma.readingSession.create({
    data: {
      readingEntryId,
      date: new Date(date),
      page,
    },
  });

  redirect(`/entries/${readingEntryId}`);
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/entries/[id]/actions.ts
git commit -m "feat: add addSession Server Action"
```

---

### Task 3: `/entries/[id]` detail page

**Files:**
- Create: `src/app/entries/[id]/session-form.tsx`
- Create: `src/app/entries/[id]/page.tsx`

**Interfaces:**
- Consumes: `addSession` from `./actions` (Task 2), `createClient` from
  `@/lib/supabase/server`, `prisma` from `@/lib/prisma`.

- [ ] **Step 1: Write the client form component**

```typescript
// src/app/entries/[id]/session-form.tsx
"use client";

import { useState } from "react";
import { addSession } from "./actions";

export default function SessionForm({
  readingEntryId,
}: {
  readingEntryId: string;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await addSession(readingEntryId, formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input name="date" type="date" required className="w-full border p-2" />
      <input
        name="page"
        type="number"
        min={1}
        placeholder="Pàgina"
        required
        className="w-full border p-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full bg-black p-2 text-white">
        Registra sessió
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write the page**

```typescript
// src/app/entries/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import SessionForm from "./session-form";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const entry = await prisma.readingEntry.findUnique({
    where: { id },
    include: {
      book: true,
      readingSessions: { orderBy: { date: "desc" } },
    },
  });

  if (!entry || entry.usuariId !== usuari.id) {
    notFound();
  }

  const latestSession = entry.readingSessions[0];
  const progressPercent =
    entry.book.pageCount && latestSession
      ? Math.min(
          100,
          Math.round((latestSession.page / entry.book.pageCount) * 100),
        )
      : null;

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">{entry.book.title}</h1>
      <p className="text-sm text-gray-600">{entry.book.author}</p>
      <p className="text-sm text-gray-600">Estat: {entry.status}</p>
      {progressPercent !== null && (
        <p className="text-sm text-gray-600">
          {latestSession.page} de {entry.book.pageCount} pàgines ·{" "}
          {progressPercent}%
        </p>
      )}
      <SessionForm readingEntryId={entry.id} />
      {entry.readingSessions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Sessions</h2>
          <ul className="space-y-1">
            {entry.readingSessions.map((session) => (
              <li key={session.id} className="text-sm">
                {session.date.toLocaleDateString("ca")} — pàgina{" "}
                {session.page}
              </li>
            ))}
          </ul>
        </div>
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

Expected: no errors. Full interactive verification happens in Task 5.

- [ ] **Step 4: Commit**

```bash
git add src/app/entries/[id]/session-form.tsx src/app/entries/[id]/page.tsx
git commit -m "feat: add reading entry detail page with sessions and progress"
```

---

### Task 4: Protect `/entries` and link from the dashboard

**Files:**
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:** None new — this task only wires existing pieces together.

- [ ] **Step 1: Add `/entries` to protected paths**

In `src/lib/supabase/middleware.ts`, change:

```typescript
const PROTECTED_PATHS = ["/dashboard", "/onboarding", "/books"];
```

to:

```typescript
const PROTECTED_PATHS = ["/dashboard", "/onboarding", "/books", "/entries"];
```

- [ ] **Step 2: Link each book title to its detail page**

In `src/app/dashboard/page.tsx`, inside the `sections.map` block, change
the `<li>` from:

```tsx
<li key={entry.id} className="text-sm">
  <span className="font-medium">{entry.book.title}</span>
  {" — "}
  {entry.book.author}
  {entry.book.genre ? ` (${entry.book.genre})` : ""}
</li>
```

to:

```tsx
<li key={entry.id} className="text-sm">
  <a href={`/entries/${entry.id}`} className="font-medium underline">
    {entry.book.title}
  </a>
  {" — "}
  {entry.book.author}
  {entry.book.genre ? ` (${entry.book.genre})` : ""}
</li>
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual check — route protection**

```bash
npm run dev
```

Visit `http://localhost:3000/entries/anything` with no session. Expected:
redirected to `/login`. Stop the dev server afterward.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/middleware.ts src/app/dashboard/page.tsx
git commit -m "feat: protect /entries route and link books to their detail page"
```

---

### Task 5: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Register sessions and see progress**

```bash
npm run dev
```

1. Log in with a test account that has at least one book with `status:
   "reading"` and a non-null `pageCount` on its `Book` (check via
   Prisma Studio/Supabase if unsure which test book qualifies — the
   dashboard-listing feature's test books may have no `pageCount` set,
   in which case register a new book via `/books/new` with manual entry
   and a page count filled in, status "Llegint").
2. From `/dashboard`, click the book's title. Expected: lands on
   `/entries/[id]`, shows title/author/estat, the session form, and no
   progress line yet (no sessions registered).
3. Fill in today's date and a page number less than the book's
   `pageCount`, submit. Expected: redirected back to the same page,
   the session now appears in the "Sessions" list, and a progress line
   shows the correct percentage.
4. Register a second session with a higher page number. Expected: the
   progress line now reflects the *most recent* session by date (not
   necessarily the highest page), and both sessions appear in the list,
   most recent first.

- [ ] **Step 2: Ownership check (404)**

1. Note the `id` from the URL of the entry you just viewed (a UUID).
2. Log out, log in with a *different* test account (or note you'd need
   one — if none exists, this step can be verified by constructing a
   clearly-invalid UUID instead, e.g. `/entries/00000000-0000-0000-0000-000000000000`).
3. Visit `/entries/<that-id-or-a-fake-one>`. Expected: a 404 page, not a
   crash or someone else's data.

- [ ] **Step 3: Route protection**

1. Log out. Visit `/entries/<any-id>` directly. Expected: redirected to
   `/login`.

- [ ] **Step 4: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
