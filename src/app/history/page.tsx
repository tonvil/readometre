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

  const finishedEntries = await prisma.readingEntry.findMany({
    where: {
      usuariId: usuari.id,
      status: "finished",
    },
    include: { book: true },
    orderBy: { endDate: "desc" },
  });

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Historial de lectures</h1>
      {finishedEntries.length === 0 ? (
        <p className="text-sm text-gray-600">Encara no has finalitzat cap llibre.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {finishedEntries.length} llibres finalitzats
          </p>
          <ul className="space-y-3">
            {finishedEntries.map((entry) => (
              <li key={entry.id} className="space-y-1 border-b pb-3">
                <a href={`/entries/${entry.id}`} className="font-medium underline">
                  {entry.book.title}
                </a>
                <p className="text-sm text-gray-600">{entry.book.author}</p>
                {entry.book.genre && (
                  <p className="text-sm text-gray-600">{entry.book.genre}</p>
                )}
                <p className="text-sm">{formatStars(entry.rating)}</p>
                {entry.notes && (
                  <p className="text-sm text-gray-700">{entry.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <a href="/dashboard" className="inline-block border p-2">
        Torna al dashboard
      </a>
    </main>
  );
}
