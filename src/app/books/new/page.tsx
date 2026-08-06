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
}
