import type { BookLookup } from "./types";

export async function searchByIsbn(isbn: string): Promise<BookLookup | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const entry = data[`ISBN:${isbn}`];
    if (!entry?.title) return null;

    const author = Array.isArray(entry.authors)
      ? entry.authors.map((a: { name: string }) => a.name).join(", ")
      : "";
    const genre =
      Array.isArray(entry.subjects) && entry.subjects.length > 0
        ? entry.subjects[0].name
        : null;

    return {
      title: entry.title,
      author,
      genre,
      pageCount:
        typeof entry.number_of_pages === "number"
          ? entry.number_of_pages
          : null,
    };
  } catch {
    return null;
  }
}
