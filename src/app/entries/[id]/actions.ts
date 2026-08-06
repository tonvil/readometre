"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ReadingStatus } from "@prisma/client";

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

function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function updateEntry(readingEntryId: string, formData: FormData) {
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

  const status = formData.get("status") as string;
  const validStatuses: ReadingStatus[] = ["reading", "finished", "abandoned"];
  if (!validStatuses.includes(status as ReadingStatus)) {
    return { error: "Estat no vàlid." };
  }

  const ratingRaw = formData.get("rating") as string;
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return { error: "La valoració ha de ser un número enter entre 1 i 5." };
  }

  const notes = (formData.get("notes") as string) || null;
  const endDateRaw = formData.get("endDate") as string;

  let endDate: Date | null;
  if (status === "reading") {
    endDate = null;
  } else {
    endDate = endDateRaw ? new Date(endDateRaw) : todayUtcMidnight();
  }

  if (endDate !== null && Number.isNaN(endDate.getTime())) {
    return { error: "Data de finalització no vàlida." };
  }

  if (endDate !== null && endDate < entry.startDate) {
    return {
      error: "La data de finalització no pot ser anterior a la data d'inici.",
    };
  }

  await prisma.readingEntry.update({
    where: { id: readingEntryId },
    data: {
      status: status as ReadingStatus,
      rating,
      notes,
      endDate,
    },
  });

  redirect(`/entries/${readingEntryId}`);
}

export async function updateSession(sessionId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await prisma.readingSession.findUnique({
    where: { id: sessionId },
    include: { readingEntry: true },
  });

  if (!session || session.readingEntry.usuariId !== user.id) {
    redirect("/dashboard");
  }

  const date = formData.get("date") as string;
  const pageRaw = formData.get("page") as string;
  const page = Number(pageRaw);

  if (!date || !pageRaw || Number.isNaN(page) || page < 1) {
    return { error: "Introdueix una data i una pàgina vàlides." };
  }

  await prisma.readingSession.update({
    where: { id: sessionId },
    data: {
      date: new Date(date),
      page,
    },
  });

  redirect(`/entries/${session.readingEntryId}`);
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await prisma.readingSession.findUnique({
    where: { id: sessionId },
    include: { readingEntry: true },
  });

  if (!session || session.readingEntry.usuariId !== user.id) {
    redirect("/dashboard");
  }

  await prisma.readingSession.delete({ where: { id: sessionId } });

  redirect(`/entries/${session.readingEntryId}`);
}
