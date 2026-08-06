# Esborrat d'una entrada de lectura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user permanently delete an entire `ReadingEntry` (and all its `ReadingSession` records) from `/entries/[id]`, to undo a book added by mistake.

**Architecture:** A new Server Action `deleteEntry` in `src/app/entries/[id]/actions.ts` deletes a `ReadingEntry`'s sessions and the entry itself inside a single Prisma transaction (required because the `ReadingSession.readingEntryId` foreign key is `ON DELETE RESTRICT`). A new client component `DeleteEntryButton`, separate from `EntryEditForm`, confirms via `window.confirm` before calling it.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only, matching existing button/link conventions in this route.
- The `Book` record itself is never deleted — only the `ReadingEntry` and its `ReadingSession`s. `Book` stays in the shared catalog.
- Deleting a `ReadingEntry` with existing `ReadingSession`s must not hit a foreign-key error — sessions are deleted first, in the same transaction as the entry delete.
- A `ReadingEntry` not owned by the requesting user (or nonexistent) must redirect, not error — reuse the ownership-check pattern already used by `addSession`/`updateEntry`/`updateSession`/`deleteSession` in the same file.
- Delete requires a `window.confirm` before calling the delete action — same pattern as `SessionRow`'s delete button.
- On success, redirect to `/dashboard` (not back to `/entries/[id]`, since the entry no longer exists).
- Every task ends in its own git commit.

---

## File Structure

```
src/
└── app/
    └── entries/
        └── [id]/
            ├── actions.ts               # Modified: add deleteEntry()
            ├── delete-entry-button.tsx  # New: client button with confirm
            └── page.tsx                  # Modified: render DeleteEntryButton
```

---

### Task 1: `deleteEntry` Server Action

**Files:**
- Modify: `src/app/entries/[id]/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `prisma` from `@/lib/prisma` (already imported in this file).
- Produces: `deleteEntry(readingEntryId: string): Promise<never>` (always redirects) from `src/app/entries/[id]/actions.ts` — consumed by Task 2.

- [ ] **Step 1: Add the action**

Append this function at the end of `src/app/entries/[id]/actions.ts`, after `deleteSession`:

```typescript
export async function deleteEntry(readingEntryId: string) {
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

  await prisma.$transaction([
    prisma.readingSession.deleteMany({ where: { readingEntryId } }),
    prisma.readingEntry.delete({ where: { id: readingEntryId } }),
  ]);

  redirect("/dashboard");
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
git commit -m "feat: add deleteEntry Server Action"
```

---

### Task 2: `DeleteEntryButton` and page integration

**Files:**
- Create: `src/app/entries/[id]/delete-entry-button.tsx`
- Modify: `src/app/entries/[id]/page.tsx`

**Interfaces:**
- Consumes: `deleteEntry` from `./actions` (Task 1).

- [ ] **Step 1: Write the client button component**

```typescript
// src/app/entries/[id]/delete-entry-button.tsx
"use client";

import { deleteEntry } from "./actions";

export default function DeleteEntryButton({
  readingEntryId,
}: {
  readingEntryId: string;
}) {
  async function handleDelete() {
    if (
      window.confirm(
        "Segur que vols esborrar aquest llibre i totes les seves sessions?",
      )
    ) {
      await deleteEntry(readingEntryId);
    }
  }

  return (
    <button onClick={handleDelete} className="border p-2">
      Esborra aquest llibre
    </button>
  );
}
```

- [ ] **Step 2: Render it on the detail page**

In `src/app/entries/[id]/page.tsx`, add the import alongside the existing
`SessionForm`/`EntryEditForm`/`SessionRow` imports:

```typescript
import DeleteEntryButton from "./delete-entry-button";
```

Add `<DeleteEntryButton readingEntryId={entry.id} />` right after
`<EntryEditForm ... />` and before `<SessionForm ... />`, as a separate
element (not inside `EntryEditForm`'s `<form>`):

```tsx
      <EntryEditForm
        readingEntryId={entry.id}
        status={entry.status}
        rating={entry.rating}
        notes={entry.notes}
        endDate={toDateInputValue(entry.endDate)}
      />
      <DeleteEntryButton readingEntryId={entry.id} />
      <SessionForm readingEntryId={entry.id} />
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/entries/[id]/delete-entry-button.tsx src/app/entries/[id]/page.tsx
git commit -m "feat: add delete-entry button with confirmation"
```

---

### Task 3: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Delete an entry with sessions**

```bash
npm run dev
```

1. Log in with a test account. Create a new book entry via `/books/new`
   if needed, and register at least one reading session for it via
   `/entries/[id]`.
2. On that entry's page, click "Esborra aquest llibre". Expected: a
   browser confirm dialog appears. Click "Cancel". Expected: nothing
   happens, the entry and its sessions are still there.
3. Click "Esborra aquest llibre" again and confirm. Expected: no
   foreign-key error, and you're redirected to `/dashboard`.
4. Confirm the deleted entry no longer appears anywhere on
   `/dashboard`.

- [ ] **Step 2: Book catalog entry survives**

1. Note the title/ISBN of the book you just deleted the entry for.
2. Go to `/books/new` and search by the same ISBN (if it had one).
   Expected: the book is still found (fields prefilled), confirming
   the `Book` record itself was not deleted — only the `ReadingEntry`
   and its sessions.

- [ ] **Step 3: Ownership guard still holds**

1. Attempting to reach `deleteEntry` for an entry belonging to another
   user isn't reachable through the UI (no direct form exposing
   arbitrary IDs); confirm by code review that the guard added in
   Task 1 mirrors the existing, already-verified pattern in
   `updateEntry`/`deleteSession` — no separate manual step needed here
   beyond the code check.

- [ ] **Step 4: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
