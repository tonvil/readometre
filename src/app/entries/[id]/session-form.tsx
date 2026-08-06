"use client";

import { useState } from "react";
import { addSession } from "./actions";

export default function SessionForm({
  readingEntryId,
}: {
  readingEntryId: string;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await addSession(readingEntryId, formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input
        name="date"
        type="date"
        required
        className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
      />
      <input
        name="page"
        type="number"
        min={1}
        placeholder="Pàgina"
        required
        className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
      >
        Registra sessió
      </button>
    </form>
  );
}
