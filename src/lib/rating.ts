export function formatStars(rating: number | null): string {
  if (rating === null) return "Sense valoració";
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
}
