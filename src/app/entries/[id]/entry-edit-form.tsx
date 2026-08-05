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
