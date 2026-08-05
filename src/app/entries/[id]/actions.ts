"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function addSession(readingEntryId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const entry = await prisma.readingEntry.findUnique({
    where: { id: readingEntryId },
  });

  if (!entry || entry.usuariId !== user.id) {
    redirect("/dashboard");
  }

  const date = formData.get("date") as string;
  const pageRaw = formData.get("page") as string;
  const page = Number(pageRaw);

  if (!date || !pageRaw || Number.isNaN(page) || page < 1) {
    return { error: "Introdueix una data i una pàgina vàlides." };
  }

  await prisma.readingSession.create({
    data: {
      readingEntryId,
      date: new Date(date),
      page,
    },
  });

  redirect(`/entries/${readingEntryId}`);
}
