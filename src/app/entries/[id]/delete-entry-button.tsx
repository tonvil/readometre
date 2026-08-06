"use client";

import { deleteEntry } from "./actions";

export default function DeleteEntryButton({
  readingEntryId,
}: {
  readingEntryId: string;
}) {
  async function handleDelete() {
    if (
      window.confirm(
        "Segur que vols esborrar aquest llibre i totes les seves sessions?",
      )
    ) {
      await deleteEntry(readingEntryId);
    }
  }

  return (
    <button onClick={handleDelete} className="border p-2">
      Esborra aquest llibre
    </button>
  );
}
