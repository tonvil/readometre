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
