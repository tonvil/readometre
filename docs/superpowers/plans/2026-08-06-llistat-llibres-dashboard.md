# Llistat de llibres al dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's "properament" placeholder with the user's actual books, grouped by reading status.

**Architecture:** A single query in the existing `src/app/dashboard/page.tsx` Server Component fetches all of the user's `ReadingEntry` rows (with their `Book`), grouped by status in memory and rendered as up to three sections.

**Tech Stack:** Next.js (App Router, Server Components), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only.
- No edit/delete/pagination/filters — display only, per spec.
- Single commit for this plan (one self-contained file change).

---

## File Structure

```
src/app/dashboard/page.tsx   # Modified: add query + grouped listing, remove "properament" paragraph
```

---

### Task 1: Grouped book listing on the dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:** None — this is a self-contained, standalone change to one file.

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

1. Log in with a test account that already has `ReadingEntry` rows in
   more than one status (from earlier manual testing sessions in this
   project — e.g. one "reading" and one "finished" entry should already
   exist). Visit `/dashboard`. Expected: sections for each status that
   has at least one book, each showing title/author/genre, most recently
   started book first within each section. No section renders for a
   status with zero books.
2. If you have access to a fresh test account with zero `ReadingEntry`
   rows (e.g. a brand-new signup that completed onboarding but never
   visited `/books/new`), visit `/dashboard` with it. Expected: "Encara
   no has afegit cap llibre." shown instead of any section.
3. Stop the dev server afterward.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: list user's books on the dashboard, grouped by status"
```

---
