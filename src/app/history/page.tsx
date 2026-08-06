import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatStars } from "@/lib/rating";

export default async function HistoryPage() {
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

  const entries = await prisma.readingEntry.findMany({
    where: { usuariId: usuari.id, status: "finished" },
    include: { book: true },
  });

  entries.sort(
    (a, b) =>
      (b.endDate ?? b.startDate).getTime() -
      (a.endDate ?? a.startDate).getTime(),
  );

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Historial de lectura</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-600">Encara no has acabat cap llibre.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="text-sm">
              <a href={`/entries/${entry.id}`} className="font-medium underline">
                {entry.book.title}
              </a>
              {" — "}
              {entry.book.author}
              {entry.book.genre ? ` (${entry.book.genre})` : ""}
              <br />
              {formatStars(entry.rating)}
            </li>
          ))}
        </ul>
      )}
      <a href="/dashboard" className="inline-block border p-2">
        Torna al dashboard
      </a>
    </main>
  );
}
