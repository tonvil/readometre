# Registre de llibres per ISBN — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an authenticated user register a book they're reading by ISBN — looked up in the local catalog, then Google Books, then Open Library, with manual entry always available — creating a `Book` (deduplicated by ISBN) and a `ReadingEntry` in one form.

**Architecture:** Two small provider clients (`googleBooks.ts`, `openLibrary.ts`) normalize external API responses to a shared shape; a `searchBook` Server Action tries local catalog → Google Books → Open Library in order; a `saveBook` Server Action creates/reuses the `Book` and always creates a `ReadingEntry`; a client-side page (`/books/new`) drives a two-phase UI (search → confirm/edit).

**Tech Stack:** Next.js (App Router, Server Actions), Prisma, native `fetch` for external APIs (no SDK needed).

## Global Constraints

- Package manager: npm only.
- Language: TypeScript everywhere, App Router (`src/app`).
- Styling: Tailwind CSS only.
- No API key for Google Books — use the unauthenticated endpoint.
- No test framework in this plan (deferred, per project decision).
- Every task ends in its own git commit.
- `Book` is a shared/global catalog — once a `Book` exists (found by ISBN), its fields are never overwritten by a later registration of the same ISBN.

---

## File Structure

```
prisma/
└── schema.prisma                    # Book gains `isbn String? @unique`
src/
├── lib/
│   └── books/
│       ├── types.ts                  # Shared BookLookup type
│       ├── googleBooks.ts            # searchByIsbn() — Google Books API
│       └── openLibrary.ts            # searchByIsbn() — Open Library API
├── app/
│   ├── books/
│   │   └── new/
│   │       ├── actions.ts            # searchBook(), saveBook()
│   │       └── page.tsx              # Search + confirm/edit UI
│   └── dashboard/
│       └── page.tsx                  # Modified: add link to /books/new
└── lib/supabase/middleware.ts        # Modified: protect /books
```

---

### Task 1: Add `isbn` to the `Book` model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_book_isbn/migration.sql`

**Interfaces:**
- Produces: `Book.isbn` (`String?`, `@unique`) — consumed by Tasks 4, 5.

- [ ] **Step 1: Update the schema**

In `prisma/schema.prisma`, change the `Book` model from:

```prisma
model Book {
  id             String         @id @default(uuid())
  title          String
  author         String
  genre          String?
  pageCount      Int?
  readingEntries ReadingEntry[]
}
```

to:

```prisma
model Book {
  id             String         @id @default(uuid())
  isbn           String?        @unique
  title          String
  author         String
  genre          String?
  pageCount      Int?
  readingEntries ReadingEntry[]
}
```

- [ ] **Step 2: Generate and apply the migration**

`npx prisma migrate dev` requires an interactive terminal, which is not
available here. Instead, author the migration by hand (same approach used
for the `dataNaixement` migration earlier in this project):

```bash
TS=$(date -u +%Y%m%d%H%M%S)
mkdir -p "prisma/migrations/${TS}_book_isbn"
cat > "prisma/migrations/${TS}_book_isbn/migration.sql" <<'EOF'
-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "isbn" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
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
(Table Editor → `Book`) and confirm the `isbn` column exists.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add unique isbn field to Book"
```

---

### Task 2: Shared lookup type + Google Books client

**Files:**
- Create: `src/lib/books/types.ts`
- Create: `src/lib/books/googleBooks.ts`

**Interfaces:**
- Produces: `BookLookup` type from `src/lib/books/types.ts` — consumed by
  Tasks 3, 4. `searchByIsbn(isbn: string): Promise<BookLookup | null>`
  from `src/lib/books/googleBooks.ts` — consumed by Task 4.

- [ ] **Step 1: Write the shared type**

```typescript
// src/lib/books/types.ts
export type BookLookup = {
  title: string;
  author: string;
  genre: string | null;
  pageCount: number | null;
};
```

- [ ] **Step 2: Write the Google Books client**

```typescript
// src/lib/books/googleBooks.ts
import type { BookLookup } from "./types";

export async function searchByIsbn(isbn: string): Promise<BookLookup | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const info = data.items?.[0]?.volumeInfo;
    if (!info?.title) return null;

    return {
      title: info.title,
      author: Array.isArray(info.authors) ? info.authors.join(", ") : "",
      genre:
        Array.isArray(info.categories) && info.categories.length > 0
          ? info.categories[0]
          : null,
      pageCount: typeof info.pageCount === "number" ? info.pageCount : null,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify the API shape against a real ISBN**

```bash
curl -s "https://www.googleapis.com/books/v1/volumes?q=isbn:9780061120084" | head -c 2000
```

Expected: JSON containing `"items"` with a `volumeInfo` object that has a
`title` field (this is "To Kill a Mockingbird" — a stable, well-cataloged
ISBN, safe to use as the manual check here) — confirms `googleBooks.ts`'s
parsing path (`data.items?.[0]?.volumeInfo`) matches the real response
shape.

- [ ] **Step 5: Commit**

```bash
git add src/lib/books/types.ts src/lib/books/googleBooks.ts
git commit -m "feat: add Google Books ISBN lookup client"
```

---

### Task 3: Open Library client

**Files:**
- Create: `src/lib/books/openLibrary.ts`

**Interfaces:**
- Consumes: `BookLookup` from `src/lib/books/types.ts` (Task 2).
- Produces: `searchByIsbn(isbn: string): Promise<BookLookup | null>` from
  `src/lib/books/openLibrary.ts` — consumed by Task 4.

- [ ] **Step 1: Write the Open Library client**

```typescript
// src/lib/books/openLibrary.ts
import type { BookLookup } from "./types";

export async function searchByIsbn(isbn: string): Promise<BookLookup | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const entry = data[`ISBN:${isbn}`];
    if (!entry?.title) return null;

    const author = Array.isArray(entry.authors)
      ? entry.authors.map((a: { name: string }) => a.name).join(", ")
      : "";
    const genre =
      Array.isArray(entry.subjects) && entry.subjects.length > 0
        ? entry.subjects[0].name
        : null;

    return {
      title: entry.title,
      author,
      genre,
      pageCount:
        typeof entry.number_of_pages === "number"
          ? entry.number_of_pages
          : null,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify the API shape against a real ISBN**

```bash
curl -s "https://openlibrary.org/api/books?bibkeys=ISBN:9780061120084&format=json&jscmd=data" | head -c 2000
```

Expected: JSON with a top-level key `"ISBN:9780061120084"` whose value has
a `title` field — confirms the parsing path (`data["ISBN:" + isbn]`)
matches the real response shape.

- [ ] **Step 4: Commit**

```bash
git add src/lib/books/openLibrary.ts
git commit -m "feat: add Open Library ISBN lookup client"
```

---

### Task 4: `searchBook` Server Action

**Files:**
- Create: `src/app/books/new/actions.ts`

**Interfaces:**
- Consumes: `searchByIsbn` from `@/lib/books/googleBooks` and
  `@/lib/books/openLibrary` (Tasks 2, 3), `BookLookup` from
  `@/lib/books/types` (Task 2), `prisma` from `@/lib/prisma`.
- Produces: `BookFields` type, `SearchBookResult` discriminated union, and
  `searchBook(rawIsbn: string): Promise<SearchBookResult>` from
  `src/app/books/new/actions.ts` — consumed by Task 6.

- [ ] **Step 1: Write `searchBook`**

```typescript
// src/app/books/new/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { searchByIsbn as searchGoogleBooks } from "@/lib/books/googleBooks";
import { searchByIsbn as searchOpenLibrary } from "@/lib/books/openLibrary";
import type { BookLookup } from "@/lib/books/types";

export type BookFields = {
  title: string;
  author: string;
  genre: string;
  pageCount: string;
};

export type SearchBookResult =
  | { status: "error"; message: string }
  | { status: "found"; fromCatalog: boolean; book: BookFields }
  | { status: "not_found" };

function normalizeIsbn(raw: string): string {
  return raw.replace(/[-\s]/g, "");
}

function isValidIsbn(isbn: string): boolean {
  return /^\d{10}$/.test(isbn) || /^\d{13}$/.test(isbn);
}

function toFields(lookup: BookLookup): BookFields {
  return {
    title: lookup.title,
    author: lookup.author,
    genre: lookup.genre ?? "",
    pageCount: lookup.pageCount !== null ? String(lookup.pageCount) : "",
  };
}

export async function searchBook(rawIsbn: string): Promise<SearchBookResult> {
  const isbn = normalizeIsbn(rawIsbn);

  if (!isValidIsbn(isbn)) {
    return {
      status: "error",
      message: "ISBN no vàlid (ha de tenir 10 o 13 dígits).",
    };
  }

  const existing = await prisma.book.findUnique({ where: { isbn } });
  if (existing) {
    return {
      status: "found",
      fromCatalog: true,
      book: {
        title: existing.title,
        author: existing.author,
        genre: existing.genre ?? "",
        pageCount: existing.pageCount !== null ? String(existing.pageCount) : "",
      },
    };
  }

  const googleResult = await searchGoogleBooks(isbn);
  if (googleResult) {
    return { status: "found", fromCatalog: false, book: toFields(googleResult) };
  }

  const openLibraryResult = await searchOpenLibrary(isbn);
  if (openLibraryResult) {
    return { status: "found", fromCatalog: false, book: toFields(openLibraryResult) };
  }

  return { status: "not_found" };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/books/new/actions.ts
git commit -m "feat: add searchBook Server Action (local catalog, Google Books, Open Library)"
```

---

### Task 5: `saveBook` Server Action

**Files:**
- Modify: `src/app/books/new/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `prisma` from
  `@/lib/prisma`, `ReadingStatus` from `@prisma/client`.
- Produces: `saveBook(formData: FormData): Promise<{ error: string } | never>`
  (redirects on success) — consumed by Task 6.

- [ ] **Step 1: Add `saveBook` to the same file**

Append to `src/app/books/new/actions.ts` (add these imports to the top of
the file, alongside the existing ones):

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReadingStatus } from "@prisma/client";
```

Then add the function at the end of the file:

```typescript
export async function saveBook(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const author = formData.get("author") as string;

  if (!title || !author) {
    return { error: "Omple el títol i l'autor." };
  }

  const status = formData.get("status") as string;
  const startDate = formData.get("startDate") as string;

  if (!status || !startDate) {
    return { error: "Omple l'estat i la data d'inici." };
  }

  const isbnRaw = formData.get("isbn") as string;
  const isbn = isbnRaw ? isbnRaw.replace(/[-\s]/g, "") : null;
  const genre = (formData.get("genre") as string) || null;
  const pageCountRaw = formData.get("pageCount") as string;
  const pageCount = pageCountRaw ? Number(pageCountRaw) : null;
  const endDateRaw = formData.get("endDate") as string;
  const ratingRaw = formData.get("rating") as string;
  const notes = (formData.get("notes") as string) || null;

  let book = isbn ? await prisma.book.findUnique({ where: { isbn } }) : null;

  if (!book) {
    book = await prisma.book.create({
      data: { isbn, title, author, genre, pageCount },
    });
  }

  await prisma.readingEntry.create({
    data: {
      bookId: book.id,
      usuariId: user.id,
      status: status as ReadingStatus,
      startDate: new Date(startDate),
      endDate: endDateRaw ? new Date(endDateRaw) : null,
      rating: ratingRaw ? Number(ratingRaw) : null,
      notes,
    },
  });

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
git add src/app/books/new/actions.ts
git commit -m "feat: add saveBook Server Action"
```

---

### Task 6: `/books/new` page (search + confirm/edit UI)

**Files:**
- Create: `src/app/books/new/page.tsx`

**Interfaces:**
- Consumes: `searchBook`, `saveBook`, `SearchBookResult`, `BookFields`
  from `./actions` (Tasks 4, 5).

- [ ] **Step 1: Write the page**

```typescript
// src/app/books/new/page.tsx
"use client";

import { useState } from "react";
import { searchBook, saveBook, type BookFields } from "./actions";

const EMPTY_BOOK: BookFields = { title: "", author: "", genre: "", pageCount: "" };

export default function NewBookPage() {
  const [phase, setPhase] = useState<"search" | "confirm">("search");
  const [isbn, setIsbn] = useState("");
  const [book, setBook] = useState<BookFields>(EMPTY_BOOK);
  const [readOnlyBook, setReadOnlyBook] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    const result = await searchBook(isbn);
    setSearching(false);

    if (result.status === "error") {
      setSearchError(result.message);
      return;
    }
    if (result.status === "found") {
      setBook(result.book);
      setReadOnlyBook(result.fromCatalog);
    } else {
      setBook(EMPTY_BOOK);
      setReadOnlyBook(false);
    }
    setPhase("confirm");
  }

  function handleManualEntry() {
    setBook(EMPTY_BOOK);
    setReadOnlyBook(false);
    setSearchError(null);
    setPhase("confirm");
  }

  async function handleSave(formData: FormData) {
    const result = await saveBook(formData);
    if (result?.error) setSaveError(result.error);
  }

  if (phase === "search") {
    return (
      <main className="mx-auto mt-20 max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Afegeix un llibre</h1>
        <input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="ISBN"
          className="w-full border p-2"
        />
        {searchError && <p className="text-sm text-red-600">{searchError}</p>}
        <button
          onClick={handleSearch}
          disabled={searching}
          className="w-full bg-black p-2 text-white"
        >
          {searching ? "Cercant..." : "Cerca"}
        </button>
        <button onClick={handleManualEntry} className="w-full border p-2">
          Entrada manual
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Confirma les dades</h1>
      <form action={handleSave} className="space-y-4">
        <input type="hidden" name="isbn" value={isbn} />
        {readOnlyBook ? (
          <div className="space-y-1 border p-2 text-sm">
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
              className="w-full border p-2"
            />
            <input
              name="author"
              defaultValue={book.author}
              placeholder="Autor"
              required
              className="w-full border p-2"
            />
            <input
              name="genre"
              defaultValue={book.genre}
              placeholder="Gènere"
              className="w-full border p-2"
            />
            <input
              name="pageCount"
              type="number"
              defaultValue={book.pageCount}
              placeholder="Pàgines"
              min={1}
              className="w-full border p-2"
            />
          </>
        )}
        <select name="status" defaultValue="reading" required className="w-full border p-2">
          <option value="reading">Llegint</option>
          <option value="finished">Finalitzat</option>
          <option value="abandoned">Abandonat</option>
        </select>
        <input name="startDate" type="date" required className="w-full border p-2" />
        <input name="endDate" type="date" className="w-full border p-2" />
        <input
          name="rating"
          type="number"
          min={1}
          max={5}
          placeholder="Valoració (1-5)"
          className="w-full border p-2"
        />
        <textarea name="notes" placeholder="Notes" className="w-full border p-2" />
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        <button type="submit" className="w-full bg-black p-2 text-white">
          Desa
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

Expected: no errors. Full interactive verification (search phase,
confirm phase, save) happens in Task 8, since it requires an
authenticated session and hits real external APIs.

- [ ] **Step 3: Commit**

```bash
git add src/app/books/new/page.tsx
git commit -m "feat: add /books/new page with search and confirm/edit UI"
```

---

### Task 7: Protect `/books` and link from the dashboard

**Files:**
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- None new — this task only wires existing pieces together.

- [ ] **Step 1: Add `/books` to protected paths**

In `src/lib/supabase/middleware.ts`, change:

```typescript
const PROTECTED_PATHS = ["/dashboard", "/onboarding"];
```

to:

```typescript
const PROTECTED_PATHS = ["/dashboard", "/onboarding", "/books"];
```

- [ ] **Step 2: Add a link from the dashboard**

In `src/app/dashboard/page.tsx`, add a link to `/books/new` inside the
`<main>` element, right after the `<h1>` welcome heading and before the
existing "properament" paragraph:

```tsx
<a href="/books/new" className="inline-block border p-2">
  Afegeix un llibre
</a>
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

Visit `http://localhost:3000/books/new` with no session. Expected:
redirected to `/login`. Stop the dev server afterward.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/middleware.ts src/app/dashboard/page.tsx
git commit -m "feat: protect /books route and link it from the dashboard"
```

---

### Task 8: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Full search-and-save flow with a real ISBN**

```bash
npm run dev
```

1. Log in with an existing test account, land on `/dashboard`.
2. Click "Afegeix un llibre".
3. Enter ISBN `9780061120084` (To Kill a Mockingbird) and click "Cerca".
   Expected: confirm/edit form appears, pre-filled with title/author from
   Google Books (or Open Library, if Google Books is unreachable), fields
   editable.
4. Set status to "Llegint", pick a start date, click "Desa". Expected:
   redirected to `/dashboard`.
5. In the Supabase dashboard, confirm a new `Book` row exists with
   `isbn = 9780061120084` and a new `ReadingEntry` row links it to your
   `Usuari`.

- [ ] **Step 2: Catalog reuse (no duplicate `Book`)**

1. From `/dashboard`, click "Afegeix un llibre" again.
2. Enter the same ISBN `9780061120084` and click "Cerca". Expected: the
   confirm screen shows the book's data as read-only (not an editable
   form) — confirming it came from the local catalog, not a fresh API
   call.
3. Fill status/start date, save. Expected: redirected to `/dashboard`; in
   Supabase, confirm there is still only **one** `Book` row with this
   ISBN, and now **two** `ReadingEntry` rows point to it.

- [ ] **Step 3: Manual entry (not found / skipped)**

1. Click "Afegeix un llibre", enter a made-up ISBN that won't be found
   (e.g. `9999999999999`), click "Cerca". Expected: confirm screen
   appears with all book fields empty and editable.
2. Fill in title/author manually, status, start date, save. Expected:
   redirected to `/dashboard`; a new `Book` row exists with this ISBN and
   the manually entered title/author.
3. Separately, click "Afegeix un llibre" → "Entrada manual" directly
   (skipping the search). Expected: same empty editable form appears
   immediately.

- [ ] **Step 4: Invalid ISBN**

1. Click "Afegeix un llibre", enter `abc` as the ISBN, click "Cerca".
   Expected: inline error "ISBN no vàlid..." — no navigation to the
   confirm screen.

- [ ] **Step 5: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
