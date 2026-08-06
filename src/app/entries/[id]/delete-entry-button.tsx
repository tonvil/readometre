"use client";

import { deleteEntry } from "./actions";
import Panel from "@/components/panel";

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
    <Panel label="Zona de perill" variant="danger">
      <button
        onClick={handleDelete}
        className="rounded border border-danger-border px-3 py-1.5 text-sm text-danger"
      >
        Esborra aquest llibre
      </button>
    </Panel>
  );
}
