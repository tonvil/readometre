"use server";

import { prisma } from "@/lib/prisma";
import { searchByIsbn as searchGoogleBooks } from "@/lib/books/googleBooks";
import { searchByIsbn as searchOpenLibrary } from "@/lib/books/openLibrary";
import type { BookLookup } from "@/lib/books/types";

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
