"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Les contrasenyes no coincideixen.");
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("No s'ha pogut canviar la contrasenya. Torna-ho a provar.");
      return;
    }

    // Full page navigation (not router.push) so the middleware-protected
    // /dashboard route sees the session cookies Supabase just set.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/dashboard";
  }

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Estableix una contrasenya nova
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="password"
          type="password"
          placeholder="Contrasenya nova"
          required
          minLength={6}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Repeteix la contrasenya"
          required
          minLength={6}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Desa la contrasenya
        </button>
      </form>
      <p className="text-sm text-ink">
        <a href="/forgot-password" className="text-accent underline">
          Torna a demanar un enllaç
        </a>
      </p>
    </main>
  );
}
