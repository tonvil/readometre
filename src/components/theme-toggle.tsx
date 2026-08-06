"use client";

import { useState } from "react";
import { setTheme } from "@/app/theme-actions";
import type { Theme } from "@/lib/theme";

export default function ThemeToggle({
  currentTheme,
}: {
  currentTheme: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  async function handleClick() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    await setTheme(next);
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-ink-muted hover:text-ink"
      aria-label="Canvia de tema clar/fosc"
    >
      {theme === "dark" ? "☀ Mode clar" : "☾ Mode fosc"}
    </button>
  );
}
