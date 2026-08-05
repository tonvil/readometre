# Estadístiques del hàbit lector al dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show finished-book count, in-progress count, and total pages read on the dashboard.

**Architecture:** Three values computed in memory from the `readingEntries` already fetched for the book listing in `src/app/dashboard/page.tsx` — no new query.

**Tech Stack:** Next.js (App Router, Server Components), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only.
- No new Prisma query — reuse `readingEntries` already fetched.
- Pages counted only from `finished` entries; books without `pageCount` contribute 0.
- Single commit for this plan (one self-contained file change).

---

## File Structure

```
src/app/dashboard/page.tsx   # Modified: add stats computation + display line
```

---

### Task 1: Reading-habit stats on the dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:** None — self-contained change to one file.

- [ ] **Step 1: Replace the file contents**

Replace the full contents of `src/app/dashboard/page.tsx` with:

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "./actions";

export default async function DashboardPage() {
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

  const readingEntries = await prisma.readingEntry.findMany({
    where: { usuariId: usuari.id },
    include: { book: true },
    orderBy: { startDate: "desc" },
  });

  const finishedCount = readingEntries.filter(
    (e) => e.status === "finished",
  ).length;
  const readingCount = readingEntries.filter(
    (e) => e.status === "reading",
  ).length;
  const totalPages = readingEntries
    .filter((e) => e.status === "finished")
    .reduce((sum, e) => sum + (e.book.pageCount ?? 0), 0);

  const sections = [
    {
      title: "Llegint ara",
      entries: readingEntries.filter((e) => e.status === "reading"),
    },
    {
      title: "Finalitzats",
      entries: readingEntries.filter((e) => e.status === "finished"),
    },
    {
      title: "Abandonats",
      entries: readingEntries.filter((e) => e.status === "abandoned"),
    },
  ].filter((section) => section.entries.length > 0);

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Benvingut, {usuari.nom}</h1>
      <a href="/books/new" className="inline-block border p-2">
        Afegeix un llibre
      </a>
      {readingEntries.length === 0 ? (
        <p className="text-sm text-gray-600">Encara no has afegit cap llibre.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {finishedCount} llibres finalitzats · {readingCount} en curs ·{" "}
            {totalPages} pàgines llegides
          </p>
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <ul className="space-y-1">
                  {section.entries.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <span className="font-medium">{entry.book.title}</span>
                      {" — "}
                      {entry.book.author}
                      {entry.book.genre ? ` (${entry.book.genre})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
      <form action={logout}>
        <button type="submit" className="border p-2">
          Tanca sessió
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

1. Log in with the test account that already has three test books (one
   "reading", one "finished", one "abandoned" — created during the
   dashboard-listing feature's verification). Visit `/dashboard`.
   Expected: a line reading "1 llibres finalitzats · 1 en curs · N pàgines
   llegides" (N depends on whether the finished test book has a
   `pageCount` — if it was created via manual entry with no pages field
   filled in, N should be `0`, which is correct per spec: books without
   `pageCount` contribute nothing).
2. Confirm the book listing sections below the stats line still render
   correctly (unchanged behavior from the previous feature).
3. If you have access to a fresh account with zero `ReadingEntry` rows,
   confirm the stats line does NOT appear — only the "Encara no has
   afegit cap llibre." message.
4. Stop the dev server afterward.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: show reading-habit stats on the dashboard"
```

---
