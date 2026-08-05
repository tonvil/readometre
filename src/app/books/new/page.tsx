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
