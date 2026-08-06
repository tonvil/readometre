"use client";

import { useState } from "react";
import { updateSession, deleteSession } from "./actions";

export default function SessionRow({
  sessionId,
  page,
  dateDisplay,
  dateValue,
}: {
  sessionId: string;
  page: number;
  dateDisplay: string;
  dateValue: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    const result = await updateSession(sessionId, formData);
    if (result?.error) setError(result.error);
  }

  async function handleDelete() {
    if (window.confirm("Segur que vols esborrar aquesta sessió?")) {
      await deleteSession(sessionId);
    }
  }

  if (isEditing) {
    return (
      <li className="text-sm">
        <form
          action={handleSave}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            name="date"
            type="date"
            defaultValue={dateValue}
            required
            className="border p-1"
          />
          <input
            name="page"
            type="number"
            min={1}
            defaultValue={page}
            required
            className="w-20 border p-1"
          />
          <button type="submit" className="border px-2 py-1">
            Desa
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="border px-2 py-1"
          >
            Cancel·la
          </button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 text-sm">
      <span>
        {dateDisplay} — pàgina {page}
      </span>
      <button onClick={() => setIsEditing(true)} className="underline">
        Edita
      </button>
      <button onClick={handleDelete} className="underline">
        Esborra
      </button>
    </li>
  );
}
