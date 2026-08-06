"use client";

import { useState } from "react";
import type { ReadingStatus } from "@prisma/client";
import { updateEntry } from "./actions";
import Panel from "@/components/panel";

export default function EntryEditForm({
  readingEntryId,
  status,
  rating,
  notes,
  endDate,
}: {
  readingEntryId: string;
  status: ReadingStatus;
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
    <Panel label="Estat de lectura">
      <form action={handleSubmit} className="space-y-4">
        <select
          name="status"
          defaultValue={status}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
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
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <textarea
          name="notes"
          placeholder="Notes"
          defaultValue={notes ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="endDate"
          type="date"
          defaultValue={endDate ?? ""}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Desa
        </button>
      </form>
    </Panel>
  );
}
