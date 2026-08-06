import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "./actions";
import Panel from "@/components/panel";

export default async function DashboardPage() {
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

  const readingEntries = await prisma.readingEntry.findMany({
    where: { usuariId: usuari.id },
    include: { book: true },
    orderBy: { startDate: "desc" },
  });

  const finishedCount = readingEntries.filter(
    (e) => e.status === "finished",
  ).length;
  const readingCount = readingEntries.filter(
    (e) => e.status === "reading",
  ).length;
  const totalPages = readingEntries
    .filter((e) => e.status === "finished")
    .reduce((sum, e) => sum + (e.book.pageCount ?? 0), 0);

  const sections = [
    {
      title: "Llegint ara",
      entries: readingEntries.filter((e) => e.status === "reading"),
    },
    {
      title: "Finalitzats",
      entries: readingEntries.filter((e) => e.status === "finished"),
    },
    {
      title: "Abandonats",
      entries: readingEntries.filter((e) => e.status === "abandoned"),
    },
  ].filter((section) => section.entries.length > 0);

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Benvingut, {usuari.nom}
      </h1>
      <div className="flex gap-2">
        <a
          href="/books/new"
          className="inline-block rounded border border-field-border p-2 text-ink"
        >
          Afegeix un llibre
        </a>
        <a
          href="/history"
          className="inline-block rounded border border-field-border p-2 text-ink"
        >
          Historial de lectura
        </a>
      </div>
      {readingEntries.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Encara no has afegit cap llibre.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-muted">
            {finishedCount} llibres finalitzats · {readingCount} en curs ·{" "}
            {totalPages} pàgines llegides
          </p>
          <div className="space-y-4">
            {sections.map((section) => (
              <Panel key={section.title} label={section.title}>
                <ul className="space-y-1">
                  {section.entries.map((entry) => (
                    <li key={entry.id} className="text-sm text-ink">
                      <a
                        href={`/entries/${entry.id}`}
                        className="font-medium text-accent underline"
                      >
                        {entry.book.title}
                      </a>
                      {" — "}
                      {entry.book.author}
                      {entry.book.genre ? ` (${entry.book.genre})` : ""}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </>
      )}
      <form action={logout}>
        <button
          type="submit"
          className="rounded border border-field-border p-2 text-ink"
        >
          Tanca sessió
        </button>
      </form>
    </main>
  );
}
