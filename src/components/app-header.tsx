import ThemeToggle from "@/components/theme-toggle";
import type { Theme } from "@/lib/theme";

export default function AppHeader({ theme }: { theme: Theme }) {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-sm items-center justify-between px-4 pt-6">
      <span className="font-display text-sm tracking-wide text-ink">
        readOmetre
      </span>
      <ThemeToggle currentTheme={theme} />
    </header>
  );
}
