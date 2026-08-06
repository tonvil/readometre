export function formatStars(rating: number | null): string {
  if (rating === null) return "Sense valoració";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}
