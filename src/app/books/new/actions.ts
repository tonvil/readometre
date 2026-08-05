"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { searchByIsbn as searchGoogleBooks } from "@/lib/books/googleBooks";
import { searchByIsbn as searchOpenLibrary } from "@/lib/books/openLibrary";
import type { BookLookup } from "@/lib/books/types";
import { createClient } from "@/lib/supabase/server";
import type { ReadingStatus } from "@prisma/client";

export type BookFields = {
  title: string;
  author: string;
  genre: string;
  pageCount: string;
};

export type SearchBookResult =
  | { status: "error"; message: string }
  | { status: "found"; fromCatalog: boolean; book: BookFields }
  | { status: "not_found" };

function normalizeIsbn(raw: string): string {
  return raw.replace(/[-\s]/g, "");
}

function isValidIsbn(isbn: string): boolean {
  return /^\d{10}$/.test(isbn) || /^\d{13}$/.test(isbn);
}

function toFields(lookup: BookLookup): BookFields {
  return {
    title: lookup.title,
    author: lookup.author,
    genre: lookup.genre ?? "",
    pageCount: lookup.pageCount !== null ? String(lookup.pageCount) : "",
  };
}

export async function searchBook(rawIsbn: string): Promise<SearchBookResult> {
  const isbn = normalizeIsbn(rawIsbn);

  if (!isValidIsbn(isbn)) {
    return {
      status: "error",
      message: "ISBN no vàlid (ha de tenir 10 o 13 dígits).",
    };
  }

  const existing = await prisma.book.findUnique({ where: { isbn } });
  if (existing) {
    return {
      status: "found",
      fromCatalog: true,
      book: {
        title: existing.title,
        author: existing.author,
        genre: existing.genre ?? "",
        pageCount: existing.pageCount !== null ? String(existing.pageCount) : "",
      },
    };
  }

  const googleResult = await searchGoogleBooks(isbn);
  if (googleResult) {
    return { status: "found", fromCatalog: false, book: toFields(googleResult) };
  }

  const openLibraryResult = await searchOpenLibrary(isbn);
  if (openLibraryResult) {
    return { status: "found", fromCatalog: false, book: toFields(openLibraryResult) };
  }

  return { status: "not_found" };
}

export async function saveBook(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const author = formData.get("author") as string;

  if (!title || !author) {
    return { error: "Omple el títol i l'autor." };
  }

  const status = formData.get("status") as string;
  const startDate = formData.get("startDate") as string;

  if (!status || !startDate) {
    return { error: "Omple l'estat i la data d'inici." };
  }

  const isbnRaw = formData.get("isbn") as string;
  const isbn = isbnRaw ? isbnRaw.replace(/[-\s]/g, "") : null;
  const genre = (formData.get("genre") as string) || null;
  const pageCountRaw = formData.get("pageCount") as string;
  const pageCount = pageCountRaw ? Number(pageCountRaw) : null;
  const endDateRaw = formData.get("endDate") as string;
  const ratingRaw = formData.get("rating") as string;
  const notes = (formData.get("notes") as string) || null;

  let book = isbn ? await prisma.book.findUnique({ where: { isbn } }) : null;

  if (!book) {
    book = await prisma.book.create({
      data: { isbn, title, author, genre, pageCount },
    });
  }

  await prisma.readingEntry.create({
    data: {
      bookId: book.id,
      usuariId: user.id,
      status: status as ReadingStatus,
      startDate: new Date(startDate),
      endDate: endDateRaw ? new Date(endDateRaw) : null,
      rating: ratingRaw ? Number(ratingRaw) : null,
      notes,
    },
  });

  redirect("/dashboard");
}
