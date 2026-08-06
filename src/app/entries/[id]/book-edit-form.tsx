"use client";

import { useState } from "react";
import { updateBook } from "./actions";
import Panel from "@/components/panel";

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
    <Panel label="Dades del llibre">
      <form action={handleSubmit} className="space-y-4">
        {isbn && <p className="text-sm text-ink-muted">ISBN: {isbn}</p>}
        <input
          name="title"
          type="text"
          placeholder="Títol"
          defaultValue={title}
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="author"
          type="text"
          placeholder="Autor"
          defaultValue={author}
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="genre"
          type="text"
          placeholder="Gènere"
          defaultValue={genre ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="pageCount"
          type="number"
          min={1}
          placeholder="Nombre de pàgines"
          defaultValue={pageCount ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Desa el llibre
        </button>
      </form>
    </Panel>
  );
}
