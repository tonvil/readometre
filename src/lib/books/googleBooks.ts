import type { BookLookup } from "./types";

export async function searchByIsbn(isbn: string): Promise<BookLookup | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const info = data.items?.[0]?.volumeInfo;
    if (!info?.title) return null;

    return {
      title: info.title,
      author: Array.isArray(info.authors) ? info.authors.join(", ") : "",
      genre:
        Array.isArray(info.categories) && info.categories.length > 0
          ? info.categories[0]
          : null,
      pageCount: typeof info.pageCount === "number" ? info.pageCount : null,
    };
  } catch {
    return null;
  }
}
