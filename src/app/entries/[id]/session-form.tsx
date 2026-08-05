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
      <input name="date" type="date" required className="w-full border p-2" />
      <input
        name="page"
        type="number"
        min={1}
        placeholder="Pàgina"
        required
        className="w-full border p-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="w-full bg-black p-2 text-white">
        Registra sessió
      </button>
    </form>
  );
}
