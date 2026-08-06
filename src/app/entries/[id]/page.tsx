import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import SessionForm from "./session-form";
import EntryEditForm from "./entry-edit-form";
import SessionRow from "./session-row";
import DeleteEntryButton from "./delete-entry-button";
import BookEditForm from "./book-edit-form";
import Panel from "@/components/panel";

function toDateInputValue(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuari = await prisma.usuari.findUnique({ where: { id: user.id } });

  if (!usuari) {
    redirect("/onboarding");
  }

  const entry = await prisma.readingEntry.findUnique({
    where: { id },
    include: {
      book: true,
      readingSessions: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!entry || entry.usuariId !== usuari.id) {
    notFound();
  }

  const latestSession = entry.readingSessions[0];
  const progressPercent =
    entry.book.pageCount && latestSession
      ? Math.min(
          100,
          Math.round((latestSession.page / entry.book.pageCount) * 100),
        )
      : null;

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        {entry.book.title}
      </h1>
      <p className="text-sm text-ink-muted">{entry.book.author}</p>
      <p className="text-sm text-ink-muted">Estat: {entry.status}</p>
      {progressPercent !== null && (
        <p className="text-sm text-ink-muted">
          {latestSession.page} de {entry.book.pageCount} pàgines ·{" "}
          {progressPercent}%
        </p>
      )}
      <EntryEditForm
        readingEntryId={entry.id}
        status={entry.status}
        rating={entry.rating}
        notes={entry.notes}
        endDate={toDateInputValue(entry.endDate)}
      />
      <DeleteEntryButton readingEntryId={entry.id} />
      <BookEditForm
        bookId={entry.book.id}
        title={entry.book.title}
        author={entry.book.author}
        genre={entry.book.genre}
        pageCount={entry.book.pageCount}
        isbn={entry.book.isbn}
      />
      <SessionForm readingEntryId={entry.id} />
      {entry.readingSessions.length > 0 && (
        <Panel label="Sessions de lectura">
          <ul className="space-y-1">
            {entry.readingSessions.map((session) => (
              <SessionRow
                key={session.id}
                sessionId={session.id}
                page={session.page}
                dateDisplay={session.date.toLocaleDateString("ca")}
                dateValue={session.date.toISOString().slice(0, 10)}
              />
            ))}
          </ul>
        </Panel>
      )}
      <a
        href="/dashboard"
        className="inline-block rounded border border-field-border p-2 text-ink"
      >
        Torna al dashboard
      </a>
    </main>
  );
}
