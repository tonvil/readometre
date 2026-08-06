"use server";

import { cookies } from "next/headers";
import type { Theme } from "@/lib/theme";

export async function setTheme(theme: Theme) {
  const value: Theme = theme === "light" ? "light" : "dark";
  (await cookies()).set("theme", value, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
