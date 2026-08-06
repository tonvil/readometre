# Edició i esborrat de sessions de lectura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user correct or delete an existing `ReadingSession` from `/entries/[id]` — inline edit of date/page, and delete with confirmation.

**Architecture:** Two new Server Actions (`updateSession`, `deleteSession`) alongside the existing ones in `src/app/entries/[id]/actions.ts`. A new client component `SessionRow` replaces the static `<li>` per session, toggling between a read view (with "Edita"/"Esborra" buttons) and an inline edit form.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only, matching the existing form/button conventions in this route.
- No per-session notes, no bulk delete, no change history/audit trail, no session duration (all out of scope, per spec).
- A `ReadingSession` belonging to an entry not owned by the requesting user (or a nonexistent session) must redirect, not error — reuse the ownership-check pattern already used by `addSession`/`updateEntry`, adapted for the one extra hop through `readingEntry`.
- Progress recalculation on the page requires no new logic — it already derives from `readingSessions[0]` (most recent by date) on every render.
- Delete requires a `window.confirm` before calling the delete action.
- Every task ends in its own git commit.

---

## File Structure

```
src/
└── app/
    └── entries/
        └── [id]/
            ├── actions.ts        # Modified: add updateSession(), deleteSession()
            ├── session-row.tsx   # New: client row component (view/edit toggle, delete)
            └── page.tsx          # Modified: render SessionRow per session instead of a static <li>
```

---

### Task 1: `updateSession` and `deleteSession` Server Actions

**Files:**
- Modify: `src/app/entries/[id]/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `prisma` from `@/lib/prisma` (already imported in this file).
- Produces:
  - `updateSession(sessionId: string, formData: FormData): Promise<{ error: string } | never>` (redirects on success)
  - `deleteSession(sessionId: string): Promise<never>` (always redirects)
  Both from `src/app/entries/[id]/actions.ts` — consumed by Task 2.

- [ ] **Step 1: Add both actions**

Append these two functions at the end of `src/app/entries/[id]/actions.ts`, after `updateEntry`:

```typescript
export async function updateSession(sessionId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await prisma.readingSession.findUnique({
    where: { id: sessionId },
    include: { readingEntry: true },
  });

  if (!session || session.readingEntry.usuariId !== user.id) {
    redirect("/dashboard");
  }

  const date = formData.get("date") as string;
  const pageRaw = formData.get("page") as string;
  const page = Number(pageRaw);

  if (!date || !pageRaw || Number.isNaN(page) || page < 1) {
    return { error: "Introdueix una data i una pàgina vàlides." };
  }

  await prisma.readingSession.update({
    where: { id: sessionId },
    data: {
      date: new Date(date),
      page,
    },
  });

  redirect(`/entries/${session.readingEntryId}`);
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await prisma.readingSession.findUnique({
    where: { id: sessionId },
    include: { readingEntry: true },
  });

  if (!session || session.readingEntry.usuariId !== user.id) {
    redirect("/dashboard");
  }

  await prisma.readingSession.delete({ where: { id: sessionId } });

  redirect(`/entries/${session.readingEntryId}`);
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
git commit -m "feat: add updateSession and deleteSession Server Actions"
```

---

### Task 2: `SessionRow` component with inline edit and delete

**Files:**
- Create: `src/app/entries/[id]/session-row.tsx`
- Modify: `src/app/entries/[id]/page.tsx`

**Interfaces:**
- Consumes: `updateSession`, `deleteSession` from `./actions` (Task 1).

- [ ] **Step 1: Write the client row component**

```typescript
// src/app/entries/[id]/session-row.tsx
"use client";

import { useState } from "react";
import { updateSession, deleteSession } from "./actions";

export default function SessionRow({
  sessionId,
  page,
  dateDisplay,
  dateValue,
}: {
  sessionId: string;
  page: number;
  dateDisplay: string;
  dateValue: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const result = await updateSession(sessionId, formData);
    if (result?.error) setError(result.error);
  }

  async function handleDelete() {
    if (window.confirm("Segur que vols esborrar aquesta sessió?")) {
      await deleteSession(sessionId);
    }
  }

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
            className="border p-1"
          />
          <input
            name="page"
            type="number"
            min={1}
            defaultValue={page}
            required
            className="w-20 border p-1"
          />
          <button type="submit" className="border px-2 py-1">
            Desa
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="border px-2 py-1"
          >
            Cancel·la
          </button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 text-sm">
      <span>
        {dateDisplay} — pàgina {page}
      </span>
      <button onClick={() => setIsEditing(true)} className="underline">
        Edita
      </button>
      <button onClick={handleDelete} className="underline">
        Esborra
      </button>
    </li>
  );
}
```

- [ ] **Step 2: Render it on the detail page**

In `src/app/entries/[id]/page.tsx`, add the import alongside the existing
`SessionForm`/`EntryEditForm` imports:

```typescript
import SessionRow from "./session-row";
```

Replace the sessions `<ul>` block:

```tsx
          <ul className="space-y-1">
            {entry.readingSessions.map((session) => (
              <li key={session.id} className="text-sm">
                {session.date.toLocaleDateString("ca")} — pàgina{" "}
                {session.page}
              </li>
            ))}
          </ul>
```

with:

```tsx
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
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/entries/[id]/session-row.tsx src/app/entries/[id]/page.tsx
git commit -m "feat: add inline session edit and delete"
```

---

### Task 3: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Edit a session**

```bash
npm run dev
```

1. Log in with a test account and go to an entry with at least two
   sessions logged (register a couple via the existing session form if
   needed).
2. Click "Edita" on a session. Expected: the line becomes an inline
   form with the current date/page prefilled, plus "Desa" and
   "Cancel·la".
3. Change the page number and submit. Expected: the page reloads, the
   session shows the new page number, and the progress line above
   reflects the change if this was the most recent session by date.

- [ ] **Step 2: Cancel an edit without saving**

1. Click "Edita" on a session, change the page number, then click
   "Cancel·la" instead of "Desa". Expected: the row returns to read
   mode showing the original, unchanged value.

- [ ] **Step 3: Validation error on edit**

1. Click "Edita" on a session, clear the page field, and submit (or use
   the browser to bypass the `min`/`required` HTML constraints if
   needed). Expected: an inline error appears in the edit form and the
   session is not modified.

- [ ] **Step 4: Delete a session with confirmation**

1. Click "Esborra" on a session. Expected: a browser confirm dialog
   appears. Click "Cancel" on it. Expected: nothing happens, the
   session is still listed.
2. Click "Esborra" again and confirm. Expected: the session disappears
   from the list, and if it was the most recent by date, the progress
   line now reflects the next-most-recent session (or disappears
   entirely if none remain).

- [ ] **Step 5: Ownership guard still holds**

1. Note a session's `id` (visible via Prisma Studio/Supabase if
   needed).
2. Attempting to reach `updateSession`/`deleteSession` for a session
   belonging to another user's entry isn't reachable through the UI
   (no direct URL); confirm by code review that the guard added in
   Task 1 mirrors `addSession`'s existing, already-verified pattern —
   no separate manual step needed here beyond the code check.

- [ ] **Step 6: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
