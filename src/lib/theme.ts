import { cookies } from "next/headers";

export type Theme = "dark" | "light";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get("theme")?.value;
  return value === "light" ? "light" : "dark";
}
