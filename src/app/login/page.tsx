"use client";

import { useState } from "react";
import { login } from "./actions";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) setError(result.error);
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Inicia sessió
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="password"
          type="password"
          placeholder="Contrasenya"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Entra
        </button>
      </form>
      <button
        onClick={handleGoogleLogin}
        className="w-full rounded border border-field-border p-2 text-ink"
      >
        Continua amb Google
      </button>
      <p className="text-sm text-ink">
        <a href="/forgot-password" className="text-accent underline">
          Has oblidat la contrasenya?
        </a>
      </p>
      <p className="text-sm text-ink">
        No tens compte?{" "}
        <a href="/signup" className="text-accent underline">
          Registra&apos;t
        </a>
      </p>
    </main>
  );
}
