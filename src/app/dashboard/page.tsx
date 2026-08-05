import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "./actions";

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
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Benvingut, {usuari.nom}</h1>
      <a href="/books/new" className="inline-block border p-2">
        Afegeix un llibre
      </a>
      {readingEntries.length === 0 ? (
        <p className="text-sm text-gray-600">Encara no has afegit cap llibre.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {finishedCount} llibres finalitzats · {readingCount} en curs ·{" "}
            {totalPages} pàgines llegides
          </p>
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <ul className="space-y-1">
                  {section.entries.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <a href={`/entries/${entry.id}`} className="font-medium underline">
                        {entry.book.title}
                      </a>
                      {" — "}
                      {entry.book.author}
                      {entry.book.genre ? ` (${entry.book.genre})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
      <form action={logout}>
        <button type="submit" className="border p-2">
          Tanca sessió
        </button>
      </form>
    </main>
  );
}
