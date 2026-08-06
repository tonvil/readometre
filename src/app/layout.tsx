import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { getTheme } from "@/lib/theme";
import AppHeader from "@/components/app-header";
import GalaxyBackground from "@/components/galaxy-background";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diari de lectura",
  description:
    "Registra els llibres que llegeixes i segueix el teu hàbit lector.",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const theme = await getTheme();

  return (
    <html
      lang="ca"
      data-theme={theme === "light" ? "light" : undefined}
      className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-bg text-ink">
        <GalaxyBackground />
        <AppHeader theme={theme} />
        {children}
      </body>
    </html>
  );
}
