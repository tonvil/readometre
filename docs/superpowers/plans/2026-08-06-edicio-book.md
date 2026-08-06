# Edició del Book — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user with a `ReadingEntry` for a given `Book` correct that book's catalog data (title, author, genre, page count) from `/entries/[id]`.

**Architecture:** A new Server Action `updateBook` in `src/app/entries/[id]/actions.ts` gates on the requesting user owning at least one `ReadingEntry` pointing at that `Book`, then updates it directly (no ISBN change). A new client component `BookEditForm`, separate from `EntryEditForm` and `DeleteEntryButton`, renders on the entry detail page.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), Prisma.

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only, matching the existing form conventions in this route (`w-full border p-2` inputs, `w-full bg-black p-2 text-white` submit button, `text-sm text-red-600` errors — see `entry-edit-form.tsx`).
- `isbn` is never editable through this form — displayed as read-only text only, if present.
- `title` and `author` are required (non-blank); `pageCount`, if provided, must be a positive integer.
- Authorization is via `ReadingEntry` ownership, not a generic "any authenticated user" check: the requesting user must have at least one `ReadingEntry` with `bookId` equal to the book being edited and `usuariId` equal to the requesting user. No such entry → redirect, not error (same pattern as the rest of `actions.ts`).
- Editing a `Book` is expected to affect every `ReadingEntry` (from any user) that references it — this is intended shared-catalog behavior, not a bug.
- Every task ends in its own git commit.

---

## File Structure

```
src/
└── app/
    └── entries/
        └── [id]/
            ├── actions.ts          # Modified: add updateBook()
            ├── book-edit-form.tsx  # New: client form component
            └── page.tsx             # Modified: render BookEditForm
```

---

### Task 1: `updateBook` Server Action

**Files:**
- Modify: `src/app/entries/[id]/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `prisma` from `@/lib/prisma` (already imported in this file).
- Produces: `updateBook(bookId: string, formData: FormData): Promise<{ error: string } | never>` (redirects on success) from `src/app/entries/[id]/actions.ts` — consumed by Task 2.

- [ ] **Step 1: Add the action**

Append this function at the end of `src/app/entries/[id]/actions.ts`, after `deleteEntry`:

```typescript
export async function updateBook(bookId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ownEntry = await prisma.readingEntry.findFirst({
    where: { bookId, usuariId: user.id },
  });

  if (!ownEntry) {
    redirect("/dashboard");
  }

  const title = formData.get("title") as string;
  const author = formData.get("author") as string;

  if (!title || !author) {
    return { error: "Omple el títol i l'autor." };
  }

  const genre = (formData.get("genre") as string) || null;
  const pageCountRaw = formData.get("pageCount") as string;
  const pageCount = pageCountRaw ? Number(pageCountRaw) : null;

  if (
    pageCount !== null &&
    (!Number.isInteger(pageCount) || pageCount < 1)
  ) {
    return { error: "El nombre de pàgines ha de ser un enter positiu." };
  }

  await prisma.book.update({
    where: { id: bookId },
    data: { title, author, genre, pageCount },
  });

  redirect(`/entries/${ownEntry.id}`);
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
git commit -m "feat: add updateBook Server Action"
```

---

### Task 2: `BookEditForm` and page integration

**Files:**
- Create: `src/app/entries/[id]/book-edit-form.tsx`
- Modify: `src/app/entries/[id]/page.tsx`

**Interfaces:**
- Consumes: `updateBook` from `./actions` (Task 1).

- [ ] **Step 1: Write the client form component**

```typescript
// src/app/entries/[id]/book-edit-form.tsx
"use client";

import { useState } from "react";
import { updateBook } from "./actions";

export default function BookEditForm({
  bookId,
  title,
  author,
  genre,
  pageCount,
  isbn,
}: {
  bookId: string;
  title: string;
  author: string;
  genre: string | null;
  pageCount: number | null;
  isbn: string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await updateBook(bookId, formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {isbn && <p className="text-sm text-gray-600">ISBN: {isbn}</p>}
      <input
        name="title"
        type="text"
        placeholder="Títol"
        defaultValue={title}
        required
        className="w-full border p-2"
      />
      <input
        name="author"
        type="text"
        placeholder="Autor"
        defaultValue={author}
        required
        className="w-full border p-2"
      />
      <input
        name="genre"
        type="text"
        placeholder="Gènere"
        defaultValue={genre ?? ""}
        className="w-full border p-2"
      />
      <input
        name="pageCount"
        type="number"
        min={1}
        placeholder="Nombre de pàgines"
        defaultValue={pageCount ?? ""}
        className="w-full border p-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full bg-black p-2 text-white">
        Desa el llibre
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Render it on the detail page**

In `src/app/entries/[id]/page.tsx`, add the import alongside the existing
`SessionForm`/`EntryEditForm`/`SessionRow`/`DeleteEntryButton` imports:

```typescript
import BookEditForm from "./book-edit-form";
```

Add `<BookEditForm ... />` right after `<DeleteEntryButton ... />` and
before `<SessionForm ... />`:

```tsx
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
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/entries/[id]/book-edit-form.tsx src/app/entries/[id]/page.tsx
git commit -m "feat: add book edit form to entry detail page"
```

---

### Task 3: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Edit a book's fields**

```bash
npm run dev
```

1. Log in with a test account and go to an entry's detail page.
2. In the new book form, confirm the ISBN (if the book has one) is
   shown as plain text, not an editable input.
3. Change the title, author, genre, and page count, and submit.
   Expected: page reloads, the new title now shows in the `<h1>` at
   the top of the page, and the form reflects the saved values.

- [ ] **Step 2: Validation errors**

1. Clear the title field and submit. Expected: inline error "Omple el
   títol i l'autor." and no change is saved.
2. Restore the title, set page count to `0` or a negative number, and
   submit. Expected: inline error "El nombre de pàgines ha de ser un
   enter positiu." and no change is saved.

- [ ] **Step 3: Shared catalog behavior**

1. If you have (or can create) two `ReadingEntry` records pointing at
   the same `Book` (e.g. two entries for the same ISBN, possibly under
   different accounts, or re-adding the same ISBN as a second entry
   for the same user), edit the book's title from one entry's page and
   confirm the other entry's page also shows the updated title.

- [ ] **Step 4: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
