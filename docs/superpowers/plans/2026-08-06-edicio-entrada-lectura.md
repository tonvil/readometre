# Edició d'una entrada de lectura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user edit an existing `ReadingEntry` from `/entries/[id]` — freely change its status (`reading`/`finished`/`abandoned` in any direction) and edit `rating`, `notes`, and `endDate` at any time, not only when the entry is created.

**Architecture:** A new `updateEntry` Server Action alongside the existing `addSession` in `src/app/entries/[id]/actions.ts`, backed by a new always-visible client form (`entry-edit-form.tsx`) rendered on the entry detail page between the current progress line and the session-logging form.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only, matching the existing form patterns in this route (`session-form.tsx`).
- No editing of `Book` fields, no entry deletion, no `startDate` editing, no status-change audit trail (all out of scope, per spec).
- A `ReadingEntry` not owned by the requesting user (or nonexistent) must redirect/404, not error — reuse the same guard already used by `addSession`.
- `endDate` is never taken at face value from the form: `status === "reading"` forces it to `null`; any other status defaults it to today when the field was left empty.
- `rating`, when present, must be an integer between 1 and 5.
- Every task ends in its own git commit.

---

## File Structure

```
src/
└── app/
    └── entries/
        └── [id]/
            ├── actions.ts            # Modified: add updateEntry()
            ├── entry-edit-form.tsx   # New: client form component
            └── page.tsx              # Modified: render EntryEditForm with current values
```

---

### Task 1: `updateEntry` Server Action

**Files:**
- Modify: `src/app/entries/[id]/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `prisma` from `@/lib/prisma`, `ReadingStatus` type from `@prisma/client`.
- Produces: `updateEntry(readingEntryId: string, formData: FormData): Promise<{ error: string } | never>` (redirects on success) from `src/app/entries/[id]/actions.ts` — consumed by Task 2.

- [ ] **Step 1: Add the action**

Add to the top of `src/app/entries/[id]/actions.ts`, alongside the existing imports:

```typescript
import type { ReadingStatus } from "@prisma/client";
```

Then append this function at the end of the file, after `addSession`:

```typescript
export async function updateEntry(readingEntryId: string, formData: FormData) {
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

  const status = formData.get("status") as string;
  const validStatuses: ReadingStatus[] = ["reading", "finished", "abandoned"];
  if (!validStatuses.includes(status as ReadingStatus)) {
    return { error: "Estat no vàlid." };
  }

  const ratingRaw = formData.get("rating") as string;
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    return { error: "La valoració ha de ser un número enter entre 1 i 5." };
  }

  const notes = (formData.get("notes") as string) || null;
  const endDateRaw = formData.get("endDate") as string;

  let endDate: Date | null;
  if (status === "reading") {
    endDate = null;
  } else {
    endDate = endDateRaw ? new Date(endDateRaw) : new Date();
  }

  if (endDate !== null && endDate < entry.startDate) {
    return {
      error: "La data de finalització no pot ser anterior a la data d'inici.",
    };
  }

  await prisma.readingEntry.update({
    where: { id: readingEntryId },
    data: {
      status: status as ReadingStatus,
      rating,
      notes,
      endDate,
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
git commit -m "feat: add updateEntry Server Action"
```

---

### Task 2: Edit form on the entry detail page

**Files:**
- Create: `src/app/entries/[id]/entry-edit-form.tsx`
- Modify: `src/app/entries/[id]/page.tsx`

**Interfaces:**
- Consumes: `updateEntry` from `./actions` (Task 1).

- [ ] **Step 1: Write the client form component**

```typescript
// src/app/entries/[id]/entry-edit-form.tsx
"use client";

import { useState } from "react";
import { updateEntry } from "./actions";

export default function EntryEditForm({
  readingEntryId,
  status,
  rating,
  notes,
  endDate,
}: {
  readingEntryId: string;
  status: string;
  rating: number | null;
  notes: string | null;
  endDate: string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await updateEntry(readingEntryId, formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <select
        name="status"
        defaultValue={status}
        className="w-full border p-2"
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
        className="w-full border p-2"
      />
      <textarea
        name="notes"
        placeholder="Notes"
        defaultValue={notes ?? ""}
        className="w-full border p-2"
      />
      <input
        name="endDate"
        type="date"
        defaultValue={endDate ?? ""}
        className="w-full border p-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full bg-black p-2 text-white">
        Desa
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Render it on the detail page with current values**

In `src/app/entries/[id]/page.tsx`, add the import alongside the existing
`SessionForm` import:

```typescript
import EntryEditForm from "./entry-edit-form";
```

Add this helper function above the `EntryDetailPage` component:

```typescript
function toDateInputValue(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
```

Then, in the JSX, insert `<EntryEditForm ... />` right after the
`progressPercent` block and before `<SessionForm ... />`:

```tsx
      {progressPercent !== null && (
        <p className="text-sm text-gray-600">
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
      <SessionForm readingEntryId={entry.id} />
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/entries/[id]/entry-edit-form.tsx src/app/entries/[id]/page.tsx
git commit -m "feat: add entry edit form for status, rating, notes and endDate"
```

---

### Task 3: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Finish an entry and check auto endDate**

```bash
npm run dev
```

1. Log in with a test account that has an entry with `status: "reading"`.
2. Go to its `/entries/[id]` page. Expected: the edit form shows "Llegint"
   selected, empty rating/notes, empty endDate.
3. Change the status select to "Acabat", leave endDate empty, submit.
   Expected: page reloads, status now shows "finished", and the endDate
   field in the form is now pre-filled with today's date.

- [ ] **Step 2: Rating out of range is rejected**

1. On the same entry, type `6` into the rating field and submit. Expected:
   inline error "La valoració ha de ser un número enter entre 1 i 5." and
   the entry's status/rating are unchanged (reload the page to confirm the
   stored rating is still empty).
2. Repeat with `0`. Expected: same error.
3. Enter `4` and submit. Expected: saved without error, form shows `4` on
   reload.

- [ ] **Step 3: Reopening clears endDate**

1. On the same (now "finished") entry, change status back to "Llegint"
   and submit. Expected: page reloads with status "reading" and the
   endDate field now empty.

- [ ] **Step 4: endDate before startDate is rejected**

1. Note the entry's `startDate` (visible via Prisma Studio or the
   `/books/new` form you used to create it, or just pick an entry you
   know started recently).
2. Change status to "Acabat" and manually set endDate to a date clearly
   before that entry's start date, submit. Expected: inline error "La
   data de finalització no pot ser anterior a la data d'inici." and no
   change is saved.

- [ ] **Step 5: Notes-only edit leaves other fields untouched**

1. On an entry currently "reading", type text into the notes field only
   (leave status/rating/endDate as-is) and submit. Expected: page reloads
   with the notes saved, status still "reading", rating and endDate
   unchanged.

- [ ] **Step 6: Ownership and auth guards still hold**

1. Log out. Visit `/entries/<any-id>` directly. Expected: redirected to
   `/login` (unchanged from before this feature).
2. Log back in, visit `/entries/00000000-0000-0000-0000-000000000000`.
   Expected: 404 (unchanged from before this feature).

- [ ] **Step 7: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
