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

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Benvingut, {usuari.nom}</h1>
      <a href="/books/new" className="inline-block border p-2">
        Afegeix un llibre
      </a>
      <p className="text-sm text-gray-600">
        Aquí aniran els teus llibres i estadístiques (properament).
      </p>
      <form action={logout}>
        <button type="submit" className="border p-2">
          Tanca sessió
        </button>
      </form>
    </main>
  );
}
